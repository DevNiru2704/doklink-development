from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string

from .models import CustomUser, OTPVerification
from .serializers import UserSignUpSerializer, UserSerializer, LoginSerializer


class SignUpView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = CustomUser.objects.all()
    serializer_class = UserSignUpSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """Handle user registration"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Create user
                user = serializer.save()
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access = refresh.access_token
                
                # Send welcome email (optional)
                try:
                    self.send_welcome_email(user)
                except Exception as e:
                    # Log email error but don't fail registration
                    print(f"Failed to send welcome email: {e}")
                
                # Return user data with tokens
                user_serializer = UserSerializer(user)
                
                return Response({
                    'success': True,
                    'message': 'Account created successfully',
                    'user': user_serializer.data,
                    'tokens': {
                        'access': str(access),
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def send_welcome_email(self, user):
        """Send welcome email to new user"""
        subject = 'Welcome to DokLink!'
        message = f'''
        Dear {user.get_full_name()},
        
        Welcome to DokLink! Your account has been created successfully.
        
        Your username: {user.username}
        Email: {user.email}
        
        Please verify your email address to activate all features.
        
        Best regards,
        The DokLink Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with additional user data"""
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Return user data with tokens
            user_serializer = UserSerializer(user)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': {
                    'access': str(access),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Login failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CheckEmailView(APIView):
    """Check if email is already registered"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower()
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = CustomUser.objects.filter(email=email).exists()
        
        return Response({
            'success': True,
            'exists': exists,
            'message': 'Email already registered' if exists else 'Email available'
        }, status=status.HTTP_200_OK)


class CheckUsernameView(APIView):
    """Check if username is already taken"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').lower()
        
        if not username:
            return Response({
                'success': False,
                'message': 'Username is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = CustomUser.objects.filter(username=username).exists()
        
        return Response({
            'success': True,
            'exists': exists,
            'message': 'Username already taken' if exists else 'Username available'
        }, status=status.HTTP_200_OK)


class SendOTPView(APIView):
    """Send OTP for email/phone verification"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_type = request.data.get('type', 'email')  # email or phone
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Create OTP record
        OTPVerification.objects.create(
            user=user,
            otp_type=otp_type,
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Send OTP via email
        if otp_type == 'email':
            try:
                send_mail(
                    'DokLink Email Verification',
                    f'Your verification code is: {otp_code}\n\nThis code will expire in 10 minutes.',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
                return Response({
                    'success': True,
                    'message': 'OTP sent successfully'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Failed to send OTP',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'message': 'Invalid OTP type'
        }, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """Verify OTP"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        otp_type = request.data.get('type', 'email')
        
        if not all([email, otp_code]):
            return Response({
                'success': False,
                'message': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Find valid OTP
        otp_verification = OTPVerification.objects.filter(
            user=user,
            otp_type=otp_type,
            otp_code=otp_code,
            is_used=False,
            expires_at__gte=timezone.now()
        ).first()
        
        if not otp_verification:
            return Response({
                'success': False,
                'message': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark OTP as used
        otp_verification.is_used = True
        otp_verification.save()
        
        # Update user verification status
        if otp_type == 'email':
            user.email_verified = True
        elif otp_type == 'phone':
            user.phone_verified = True
        
        user.save()
        
        return Response({
            'success': True,
            'message': f'{otp_type.capitalize()} verified successfully'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """API health check endpoint"""
    return Response({
        'success': True,
        'message': 'DokLink API is running',
        'timestamp': timezone.now()
    }, status=status.HTTP_200_OK)
