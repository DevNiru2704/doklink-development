from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile, OTPVerification, LoginAudit
from .serializers import UserSignUpSerializer, UserSerializer, LoginSerializer
from .otp_service import OTPService
import random
import string
from datetime import timedelta


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class SignUpView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Debug: Log incoming phone number data
        phone_number = request.data.get('phone_number')
        print(f"🔍 Received phone_number: {phone_number} (type: {type(phone_number)})")
        
        serializer = UserSignUpSerializer(data=request.data)
        
        # Debug: Log validation errors if any
        if not serializer.is_valid():
            print(f"❌ Serializer errors: {serializer.errors}")
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    
                    # Generate tokens
                    tokens = get_tokens_for_user(user)
                    
                    # Send welcome email (optional)
                    self.send_welcome_email(user)
                    
                    # Create OTP for email verification
                    self.create_email_otp(user)
                    
                    # Serialize user data
                    user_serializer = UserSerializer(user)
                    
                    return Response({
                        'message': 'User registered successfully',
                        'user': user_serializer.data,
                        'tokens': tokens,
                        'email_verification_required': True
                    }, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                return Response({
                    'error': 'Registration failed',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_welcome_email(self, user):
        """Send welcome email to new user"""
        try:
            subject = 'Welcome to DokLink!'
            message = f'''
            Hi {user.first_name},
            
            Welcome to DokLink! Your account has been created successfully.
            
            Please verify your email address to complete your registration.
            
            Best regards,
            DokLink Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending welcome email: {e}")
    
    def create_email_otp(self, user):
        """Create OTP for email verification"""
        try:
            # Generate 6-digit OTP
            otp_code = ''.join(random.choices(string.digits, k=6))
            
            # Create OTP record (expires_at will be auto-set by model)
            otp = OTPVerification.objects.create(
                user=user,
                otp_type='email',
                otp_code=otp_code
            )
            
            # Send OTP via email
            subject = 'Email Verification - DokLink'
            message = f'''
            Hi {user.first_name},
            
            Your email verification code is: {otp_code}
            
            This code will expire in 10 minutes.
            
            Best regards,
            DokLink Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            
        except Exception as e:
            print(f"Error creating email OTP: {e}")


class LoginView(APIView):
    """User login endpoint with comprehensive audit logging"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Get client information for audit
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        email_attempted = request.data.get('email', '')
        
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            tokens = get_tokens_for_user(user)
            
            # Log successful login
            LoginAudit.log_attempt(
                email=email_attempted,
                status='success',
                ip_address=ip_address,
                user_agent=user_agent,
                user=user
            )
            
            # Serialize user data
            user_serializer = UserSerializer(user)
            
            return Response({
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)
        
        # Log failed login attempt
        status_mapping = {
            'Invalid credentials': 'failed_password',
            'User not found': 'failed_user',
            'Account locked': 'failed_locked',
        }
        
        # Determine failure reason from serializer errors
        error_message = str(serializer.errors)
        login_status = 'failed_password'  # Default
        
        for error_key, status_value in status_mapping.items():
            if error_key.lower() in error_message.lower():
                login_status = status_value
                break
        
        # Log failed attempt
        LoginAudit.log_attempt(
            email=email_attempted,
            status=login_status,
            ip_address=ip_address,
            user_agent=user_agent,
            user=None  # No user for failed attempts
        )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """User profile management"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Update user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_email(request):
    """Verify email with OTP"""
    otp_code = request.data.get('otp_code')
    
    if not otp_code:
        return Response({
            'error': 'OTP code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find valid OTP
        otp = OTPVerification.objects.get(
            user=request.user,
            otp_type='email',
            otp_code=otp_code,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        
        # Mark OTP as used
        otp.is_used = True
        otp.save()
        
        # Update user profile email verification status
        try:
            profile = request.user.profile
            profile.email_verified = True
            profile.save()
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            UserProfile.objects.create(
                user=request.user,
                email_verified=True
            )
        
        return Response({
            'message': 'Email verified successfully'
        }, status=status.HTTP_200_OK)
        
    except OTPVerification.DoesNotExist:
        return Response({
            'error': 'Invalid or expired OTP'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_phone(request):
    """Verify phone number with OTP"""
    otp_code = request.data.get('otp_code')
    
    if not otp_code:
        return Response({
            'error': 'OTP code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find valid OTP
        otp = OTPVerification.objects.get(
            user=request.user,
            otp_type='phone',
            otp_code=otp_code,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        
        # Mark OTP as used
        otp.is_used = True
        otp.save()
        
        # Update user profile phone verification status
        try:
            profile = request.user.profile
            profile.phone_verified = True
            profile.save()
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            UserProfile.objects.create(
                user=request.user,
                phone_verified=True
            )
        
        return Response({
            'message': 'Phone number verified successfully'
        }, status=status.HTTP_200_OK)
        
    except OTPVerification.DoesNotExist:
        return Response({
            'error': 'Invalid or expired OTP'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_phone_otp(request):
    """Send OTP for phone verification"""
    try:
        profile = request.user.profile
        phone_number = profile.phone_number
        
        if not phone_number:
            return Response({
                'error': 'No phone number associated with account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Create OTP record (expires_at will be auto-set by model)
        OTPVerification.objects.create(
            user=request.user,
            otp_type='phone',
            otp_code=otp_code
        )
        
        # Here you would integrate with SMS service
        # For now, we'll just return the OTP in response (for testing)
        return Response({
            'message': 'OTP sent successfully',
            'otp_code': otp_code  # Remove this in production
        }, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Failed to send OTP',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_verification_status(request):
    """Check user verification status"""
    try:
        profile = request.user.profile
        
        return Response({
            'email_verified': profile.email_verified,
            'phone_verified': profile.phone_verified,
            'is_verified': profile.is_verified,
            'aadhaar_verified': profile.aadhaar_verified
        })
        
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_request(request):
    """Request password reset"""
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email.lower())
        
        # Generate reset token (OTP)
        reset_token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Create OTP record (expires_at will be auto-set by model)
        OTPVerification.objects.create(
            user=user,
            otp_type='password_reset',
            otp_code=reset_token
        )
        
        # Send reset email
        subject = 'Password Reset - DokLink'
        message = f'''
        Hi {user.first_name},
        
        You have requested a password reset for your DokLink account.
        
        Your password reset code is: {reset_token}
        
        This code will expire in 10 minutes.
        
        If you did not request this reset, please ignore this email.
        
        Best regards,
        DokLink Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Password reset instructions sent to your email'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        # Don't reveal if user exists or not
        return Response({
            'message': 'If an account with this email exists, password reset instructions have been sent'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_confirm(request):
    """Confirm password reset with token"""
    email = request.data.get('email')
    reset_token = request.data.get('reset_token')
    new_password = request.data.get('new_password')
    
    if not all([email, reset_token, new_password]):
        return Response({
            'error': 'Email, reset token, and new password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email.lower())
        
        # Find valid reset token
        otp = OTPVerification.objects.get(
            user=user,
            otp_type='password_reset',
            otp_code=reset_token,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        
        # Validate new password
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({
                'error': 'Password validation failed',
                'details': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        otp.is_used = True
        otp.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid email'
        }, status=status.HTTP_400_BAD_REQUEST)
    except OTPVerification.DoesNotExist:
        return Response({
            'error': 'Invalid or expired reset token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_cloudinary_config(request):
    """
    Return Cloudinary configuration for frontend
    Only returns public/safe configuration values
    """
    try:
        config = {
            'cloudName': settings.CLOUDINARY_CONFIG['CLOUD_NAME'],
            'uploadPreset': settings.CLOUDINARY_CONFIG['UPLOAD_PRESET'],
            'folder': settings.CLOUDINARY_CONFIG['FOLDER'],
            # Note: We don't send API_KEY or API_SECRET to frontend for security
        }
        
        return Response({
            'success': True,
            'config': config
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to get Cloudinary configuration',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def generate_cloudinary_signature(request):
    """
    Generate signature for Cloudinary signed uploads
    Frontend sends upload parameters, backend returns signature
    """
    try:
        # Get parameters from frontend
        timestamp = request.data.get('timestamp')
        public_id = request.data.get('public_id')
        upload_preset = request.data.get('upload_preset')
        folder = request.data.get('folder')
        
        if not all([timestamp, public_id, upload_preset]):
            return Response({
                'success': False,
                'error': 'Missing required parameters: timestamp, public_id, upload_preset'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create parameters string for signing (must be sorted)
        params_to_sign = {
            'folder': folder,
            'public_id': public_id,
            'timestamp': timestamp,
            'upload_preset': upload_preset
        }
        
        # Sort parameters and create signing string
        sorted_params = sorted(params_to_sign.items())
        params_string = '&'.join(f'{k}={v}' for k, v in sorted_params)
        
        # Add API secret to the end
        string_to_sign = params_string + settings.CLOUDINARY_CONFIG['API_SECRET']
        
        # Generate SHA1 signature
        import hashlib
        signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()
        
        return Response({
            'success': True,
            'signature': signature,
            'timestamp': timestamp,
            'apiKey': settings.CLOUDINARY_CONFIG['API_KEY']  # Include API_KEY in signature response
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to generate signature',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_username_otp_options(request):
    """Get available OTP delivery options for username login"""
    username = request.data.get('username')
    
    if not username:
        return Response({
            'error': 'Username is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username.lower())
        
        if not user.is_active:
            return Response({
                'error': 'Account is disabled'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get user's available contact methods
        options = []
        
        # Email option (always available)
        if user.email:
            options.append({
                'method': 'email',
                'display': 'Email',
                'destination': OTPService.mask_email(user.email),
                'description': 'Send OTP to your registered email'
            })
        
        # Phone option (if phone number exists)
        try:
            if hasattr(user, 'profile') and user.profile.phone_number:
                options.append({
                    'method': 'sms',
                    'display': 'SMS',
                    'destination': OTPService.mask_phone(str(user.profile.phone_number)),
                    'description': 'Send OTP to your registered phone number'
                })
        except (UserProfile.DoesNotExist, AttributeError):
            pass
        
        if not options:
            return Response({
                'error': 'No contact methods available for this account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'username': username,
            'options': options,
            'message': 'Select your preferred method to receive OTP'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'No account found with this username'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error getting username OTP options: {e}")
        return Response({
            'error': 'Failed to get OTP options. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_login_otp(request):
    """Enhanced OTP sending for login authentication with delivery method selection"""
    login_field = request.data.get('login_field')
    login_method = request.data.get('login_method')
    delivery_method = request.data.get('delivery_method', 'auto')  # New parameter
    
    if not login_field or not login_method:
        return Response({
            'error': 'login_field and login_method are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user based on login method
    user = None
    try:
        if login_method == 'email':
            user = User.objects.get(email=login_field.lower())
            delivery_method = 'email'  # Force email for email login
        elif login_method == 'phone':
            # Normalize phone number
            normalized_phone = login_field
            if login_field.startswith('+91'):
                normalized_phone = login_field[3:]
            elif login_field.startswith('91'):
                normalized_phone = login_field[2:]
            
            profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
            user = profile.user
            delivery_method = 'sms'  # Force SMS for phone login
        elif login_method == 'username':
            user = User.objects.get(username=login_field.lower())
            # For username, delivery_method should be provided from frontend
            if delivery_method == 'auto':
                return Response({
                    'error': 'Please specify delivery_method for username login'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'error': 'Invalid login method'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (User.DoesNotExist, UserProfile.DoesNotExist):
        return Response({
            'error': f'No account found with this {login_method}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not user.is_active:
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Use the new OTP service
        success, message = OTPService.send_otp(
            user=user,
            otp_type='login_2fa',
            delivery_method=delivery_method,
            phone_number=str(user.profile.phone_number) if hasattr(user, 'profile') else None,
            email_subject="Login OTP"
        )
        
        if success:
            return Response({
                'message': message,
                'delivery_method': delivery_method
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error sending login OTP: {e}")
        return Response({
            'error': 'Failed to send OTP. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_forgot_password_otp(request):
    """Enhanced password reset OTP with delivery method selection"""
    login_field = request.data.get('login_field')
    login_method = request.data.get('login_method')
    delivery_method = request.data.get('delivery_method', 'auto')
    
    if not login_field or not login_method:
        return Response({
            'error': 'login_field and login_method are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user based on login method
    user = None
    try:
        if login_method == 'email':
            user = User.objects.get(email=login_field.lower())
            delivery_method = 'email'  # Force email for email-based reset
        elif login_method == 'phone':
            # Normalize phone number
            normalized_phone = login_field
            if login_field.startswith('+91'):
                normalized_phone = login_field[3:]
            elif login_field.startswith('91'):
                normalized_phone = login_field[2:]
            
            profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
            user = profile.user
            delivery_method = 'sms'  # Force SMS for phone-based reset
        elif login_method == 'username':
            user = User.objects.get(username=login_field.lower())
            # For username, delivery_method should be provided from frontend
            if delivery_method == 'auto':
                return Response({
                    'error': 'Please specify delivery_method for username-based reset'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'error': 'Invalid login method'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (User.DoesNotExist, UserProfile.DoesNotExist):
        return Response({
            'error': f'No account found with this {login_method}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not user.is_active:
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Use the new OTP service
        success, message = OTPService.send_otp(
            user=user,
            otp_type='password_reset',
            delivery_method=delivery_method,
            phone_number=str(user.profile.phone_number) if hasattr(user, 'profile') else None,
            email_subject="Password Reset OTP"
        )
        
        if success:
            return Response({
                'message': message,
                'delivery_method': delivery_method
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error sending forgot password OTP: {e}")
        return Response({
            'error': 'Failed to send OTP. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_forgot_password_otp(request):
    """Verify OTP for password reset using enhanced OTP service"""
    login_field = request.data.get('login_field')
    login_method = request.data.get('login_method')
    # Accept both 'otp' and 'otp_code' from frontend for backward compatibility
    otp_code = request.data.get('otp') or request.data.get('otp_code')
    
    if not all([login_field, login_method, otp_code]):
        return Response({
            'error': 'login_field, login_method, and otp_code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user based on login method
    user = None
    try:
        if login_method == 'email':
            user = User.objects.get(email=login_field.lower())
        elif login_method == 'phone':
            normalized_phone = login_field
            if login_field.startswith('+91'):
                normalized_phone = login_field[3:]
            elif login_field.startswith('91'):
                normalized_phone = login_field[2:]
            
            profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
            user = profile.user
        elif login_method == 'username':
            user = User.objects.get(username=login_field.lower())
            
    except (User.DoesNotExist, UserProfile.DoesNotExist):
        return Response({
            'error': f'No account found with this {login_method}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Use the new OTP service for verification
        success, message = OTPService.verify_otp(user, otp_code, 'password_reset')
        
        if success:
            # Fetch the OTP record we just verified to use its ID as a reset token
            otp_record = OTPVerification.objects.filter(
                user=user,
                otp_type='password_reset',
                otp_code=otp_code,
                is_used=True
            ).order_by('-created_at').first()

            return Response({
                'message': message + ' You can now reset your password.',
                'verified': True,
                'reset_token': str(otp_record.id) if otp_record else None
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message,
                'verified': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Error verifying forgot password OTP: {e}")
        return Response({
            'error': 'OTP verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    """Reset password after OTP verification"""
    login_field = request.data.get('login_field')
    login_method = request.data.get('login_method')
    reset_token = request.data.get('reset_token')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not new_password:
        return Response({'error': 'new_password is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Optional confirmation check
    if confirm_password is not None and new_password != confirm_password:
        return Response({'error': 'new_password and confirm_password do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Resolve user via reset_token if provided, else fall back to login_field/login_method
    if reset_token:
        otp_record = OTPVerification.objects.filter(
            id=reset_token,
            otp_type='password_reset',
            is_used=True,
            created_at__gte=timezone.now() - timedelta(minutes=15)
        ).select_related('user').first()
        if not otp_record:
            return Response({'error': 'Invalid or expired reset token'}, status=status.HTTP_400_BAD_REQUEST)
        user = otp_record.user
    else:
        try:
            if login_method == 'email':
                user = User.objects.get(email=login_field.lower())
            elif login_method == 'phone':
                normalized_phone = login_field
                if login_field and login_field.startswith('+91'):
                    normalized_phone = login_field[3:]
                elif login_field and login_field.startswith('91'):
                    normalized_phone = login_field[2:]
                profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
                user = profile.user
            elif login_method == 'username':
                user = User.objects.get(username=login_field.lower())
            else:
                return Response({'error': 'Invalid login method'}, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response({'error': f'No account found with this {login_method}'}, status=status.HTTP_404_NOT_FOUND)
    
    # Validate new password
    try:
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({
            'error': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if there's a recent used password reset OTP for this user
    recent_otp = OTPVerification.objects.filter(
        user=user,
        otp_type='password_reset',
        is_used=True,
        created_at__gte=timezone.now() - timedelta(minutes=15)  # Allow reset within 15 minutes of OTP verification
    ).order_by('-created_at').first()
    
    if not recent_otp:
        return Response({
            'error': 'No recent OTP verification found. Please verify OTP first.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update password
    user.set_password(new_password)
    user.save()
    
    # Log successful password reset
    LoginAudit.log_attempt(
        email=user.email,
        status='password_reset',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        user=user
    )
    
    return Response({
        'message': 'Password reset successfully. You can now login with your new password.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_login_otp(request):
    """Verify OTP and login user"""
    login_field = request.data.get('login_field')
    login_method = request.data.get('login_method')
    otp_code = request.data.get('otp_code')
    
    # Get client information for audit
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    if not all([login_field, login_method, otp_code]):
        return Response({
            'error': 'login_field, login_method, and otp_code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user based on login method
    user = None
    try:
        if login_method == 'email':
            user = User.objects.get(email=login_field.lower())
        elif login_method == 'phone':
            # Normalize phone number
            normalized_phone = login_field
            if login_field.startswith('+91'):
                normalized_phone = login_field[3:]
            elif login_field.startswith('91'):
                normalized_phone = login_field[2:]
            
            profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
            user = profile.user
        elif login_method == 'username':
            user = User.objects.get(username=login_field.lower())
        else:
            return Response({
                'error': 'Invalid login method'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (User.DoesNotExist, UserProfile.DoesNotExist):
        # Log failed attempt
        LoginAudit.log_attempt(
            email=login_field,
            status='failed_user',
            ip_address=ip_address,
            user_agent=user_agent
        )
        return Response({
            'error': f'No account found with this {login_method}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not user.is_active:
        # Log failed attempt
        LoginAudit.log_attempt(
            email=user.email,
            status='failed_locked',
            ip_address=ip_address,
            user_agent=user_agent,
            user=user
        )
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Verify OTP using OTP service
        success, message = OTPService.verify_otp(user, otp_code, 'login_2fa')
        
        if success:
            # Generate tokens
            tokens = get_tokens_for_user(user)
            
            # Get the OTP record for audit logging
            otp_record = OTPVerification.objects.filter(
                user=user,
                otp_type='login_2fa',
                otp_code=otp_code,
                is_used=True
            ).order_by('-created_at').first()
            
            # Log successful login
            LoginAudit.log_attempt(
                email=user.email,
                status='success',
                ip_address=ip_address,
                user_agent=user_agent,
                user=user,
                otp_used=otp_record
            )
            
            # Serialize user data
            user_serializer = UserSerializer(user)
            
            return Response({
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)
        else:
            # Log failed OTP attempt
            LoginAudit.log_attempt(
                email=user.email,
                status='failed_otp',
                ip_address=ip_address,
                user_agent=user_agent,
                user=user
            )
            return Response({
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Error verifying login OTP: {e}")
        # Log failed attempt
        LoginAudit.log_attempt(
            email=user.email,
            status='failed_otp',
            ip_address=ip_address,
            user_agent=user_agent,
            user=user
        )
        return Response({
            'error': 'OTP verification failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
