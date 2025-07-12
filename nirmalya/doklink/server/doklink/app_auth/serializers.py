from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, Address, UserAgreement, OTPVerification
import re
from datetime import datetime, date


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model"""
    
    class Meta:
        model = Address
        fields = ['address', 'state', 'city', 'pin']

    def validate_pin(self, value):
        """Validate PIN code format"""
        if not re.match(r'^[1-9][0-9]{5}$', value):
            raise serializers.ValidationError(
                "PIN code must be exactly 6 digits and cannot start with 0"
            )
        return value

    def validate_state(self, value):
        """Validate state selection"""
        if value == "Select State":
            raise serializers.ValidationError("Please select a valid state")
        
        # Check if state is in the valid choices
        valid_states = [choice[0] for choice in Address.STATE_CHOICES]
        if value not in valid_states:
            raise serializers.ValidationError("Please select a valid Indian state")
        
        return value


class UserSignUpSerializer(serializers.Serializer):
    """Serializer for user registration with UserProfile"""
    
    # Basic fields
    name = serializers.CharField(write_only=True, help_text="Full name will be split into first and last name")
    email = serializers.EmailField()
    username = serializers.CharField(read_only=True)  # Auto-generated
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    dob = serializers.DateField()
    phone_number = serializers.CharField()
    profile_picture = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    aadhaar_number = serializers.CharField(max_length=12)
    
    # Address fields
    permanent_address = AddressSerializer()
    current_address = AddressSerializer(required=False, allow_null=True)
    same_as_permanent = serializers.BooleanField(default=False)
    
    # Preferences
    language = serializers.CharField()
    referral_code = serializers.CharField(required=False, allow_blank=True)
    
    # Agreements
    agreements = serializers.DictField(write_only=True)

    def validate_name(self, value):
        """Validate name format"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long")
        return value.strip()

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value.lower()

    def validate_phone_number(self, value):
        """Validate phone number uniqueness and format using regex"""
        # Check for existing phone number
        if UserProfile.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists")
        
        # Convert to string for regex validation
        phone_str = str(value).strip()
        
        # Regex pattern for Indian phone numbers
        # Since frontend always sends with +91 prefix, but we make +91 optional in case of direct API calls
        # Patterns supported:
        # - 7001467098 (10 digits only - for direct API calls)
        # - +917001467098 (+91 prefix - from frontend)
        # - 917001467098 (91 prefix without + - for direct API calls)
        indian_phone_pattern = r'^(\+91|91)?[6-9]\d{9}$'
        
        if not re.match(indian_phone_pattern, phone_str):
            raise serializers.ValidationError("Please enter a valid Indian phone number (10 digits starting with 6, 7, 8, or 9)")
        
        return value

    def validate_aadhaar_number(self, value):
        """Validate Aadhaar number format and uniqueness"""
        if not re.match(r'^[2-9][0-9]{11}$', value):
            raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        
        if UserProfile.objects.filter(aadhaar_number=value).exists():
            raise serializers.ValidationError("A user with this Aadhaar number already exists")
        
        return value

    def validate_dob(self, value):
        """Validate date of birth"""
        if value >= date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        
        # Calculate age
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 0 or age > 120:
            raise serializers.ValidationError("Please provide a valid date of birth")
        
        return value

    def validate_language(self, value):
        """Validate language choice"""
        valid_languages = [choice[0] for choice in UserProfile.LANGUAGE_CHOICES]
        if value not in valid_languages:
            raise serializers.ValidationError("Please select a valid language")
        return value

    def validate_agreements(self, value):
        """Validate required agreements"""
        required_agreements = ['termsConditions', 'privacyPolicy', 'dataConsent']
        
        for agreement in required_agreements:
            if not value.get(agreement, False):
                agreement_names = {
                    'termsConditions': 'Terms & Conditions',
                    'privacyPolicy': 'Privacy Policy',
                    'dataConsent': 'Data Collection Consent'
                }
                raise serializers.ValidationError(
                    f"You must accept the {agreement_names[agreement]}"
                )
        
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        # Password validation
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        # Django password validation
        try:
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        # Address validation
        same_as_permanent = attrs.get('same_as_permanent', False)
        if not same_as_permanent and not attrs.get('current_address'):
            raise serializers.ValidationError({
                'current_address': 'Current address is required when different from permanent address'
            })
        
        return attrs

    def create(self, validated_data):
        """Create user with all related data"""
        # Extract nested data
        name = validated_data.pop('name')
        agreements_data = validated_data.pop('agreements')
        permanent_address_data = validated_data.pop('permanent_address')
        current_address_data = validated_data.pop('current_address', None)
        same_as_permanent = validated_data.pop('same_as_permanent', False)
        password = validated_data.pop('password')
        validated_data.pop('confirm_password')  # Remove confirm_password
        email = validated_data.pop('email')
        dob = validated_data.pop('dob')
        phone_number = validated_data.pop('phone_number')
        aadhaar_number = validated_data.pop('aadhaar_number')
        language = validated_data.pop('language')
        referral_code = validated_data.pop('referral_code', None)
        profile_picture = validated_data.pop('profile_picture', None)
        
        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Generate username from email
        username = email.split('@')[0].lower()
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create Django User
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create permanent address
        permanent_address = Address.objects.create(**permanent_address_data)
        
        # Create current address if different
        if same_as_permanent or not current_address_data:
            current_address = permanent_address
        else:
            current_address = Address.objects.create(**current_address_data)
        
        # Handle referral code
        referred_by = None
        if referral_code:
            try:
                referred_user = User.objects.get(username=referral_code)
                referred_by = referred_user.profile
            except (User.DoesNotExist, UserProfile.DoesNotExist):
                pass  # Invalid referral code, ignore
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            phone_number=phone_number,
            date_of_birth=dob,
            profile_picture=profile_picture,
            aadhaar_number=aadhaar_number,
            permanent_address=permanent_address,
            current_address=current_address,
            same_as_permanent=same_as_permanent,
            preferred_language=language,
            referred_by=referred_by,
            terms_conditions_accepted=agreements_data.get('termsConditions', False),
            privacy_policy_accepted=agreements_data.get('privacyPolicy', False),
            data_consent_given=agreements_data.get('dataConsent', False),
            notifications_enabled=agreements_data.get('notifications', False),
        )
        
        # Create agreement records for audit trail
        agreements_to_create = [
            ('terms', agreements_data.get('termsConditions')),
            ('privacy', agreements_data.get('privacyPolicy')),
            ('data_consent', agreements_data.get('dataConsent')),
        ]
        
        for agreement_type, accepted in agreements_to_create:
            if accepted:
                UserAgreement.objects.create(
                    user=user,
                    agreement_type=agreement_type,
                    version='1.0'
                )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data with profile"""
    profile = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'is_active', 'date_joined', 'profile'
        ]
        read_only_fields = [
            'id', 'username', 'is_active', 'date_joined'
        ]

    def get_profile(self, obj):
        """Get user profile data"""
        try:
            profile = obj.profile
            permanent_address = AddressSerializer(profile.permanent_address).data if profile.permanent_address else None
            current_address = AddressSerializer(profile.current_address).data if profile.current_address else None
            
            return {
                'phone_number': str(profile.phone_number),
                'date_of_birth': profile.date_of_birth,
                'profile_picture': profile.profile_picture if profile.profile_picture else None,
                'aadhaar_number': profile.aadhaar_number,
                'permanent_address': permanent_address,
                'current_address': current_address,
                'same_as_permanent': profile.same_as_permanent,
                'preferred_language': profile.preferred_language,
                'is_verified': profile.is_verified,
                'email_verified': profile.email_verified,
                'phone_verified': profile.phone_verified,
                'created_at': profile.created_at,
                'updated_at': profile.updated_at
            }
        except UserProfile.DoesNotExist:
            return None


class LoginSerializer(serializers.Serializer):
    """Enhanced serializer for user login supporting multiple methods and OTP"""
    login_field = serializers.CharField(help_text="Phone number, email, or username")
    password = serializers.CharField(style={'input_type': 'password'}, required=False)
    otp = serializers.CharField(max_length=6, required=False)
    login_method = serializers.ChoiceField(choices=['phone', 'email', 'username'])
    auth_mode = serializers.ChoiceField(choices=['password', 'otp'])

    def validate_login_field(self, value):
        """Validate login field based on method"""
        method = self.initial_data.get('login_method', 'email')
        
        if method == 'phone':
            # Indian phone number validation
            phone_pattern = r'^(\+91|91)?[6-9]\d{9}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError(
                    "Please enter a valid Indian phone number"
                )
        elif method == 'email':
            # Email validation
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
                raise serializers.ValidationError(
                    "Please enter a valid email address"
                )
        elif method == 'username':
            # Username validation
            if not re.match(r'^[a-z][a-z0-9]*$', value):
                raise serializers.ValidationError(
                    "Username must start with lowercase letter and contain only lowercase letters and digits"
                )
        
        return value

    def validate(self, attrs):
        login_field = attrs.get('login_field')
        password = attrs.get('password')
        otp = attrs.get('otp')
        login_method = attrs.get('login_method')
        auth_mode = attrs.get('auth_mode')

        if auth_mode == 'password' and not password:
            raise serializers.ValidationError({'password': 'Password is required for password authentication'})
        
        if auth_mode == 'otp' and not otp:
            raise serializers.ValidationError({'otp': 'OTP is required for OTP authentication'})

        # Find user based on login method
        user = None
        if login_method == 'email':
            try:
                user = User.objects.get(email=login_field.lower())
            except User.DoesNotExist:
                raise serializers.ValidationError({'login_field': 'No account found with this email'})
        
        elif login_method == 'phone':
            # Normalize phone number for lookup
            normalized_phone = login_field
            if login_field.startswith('+91'):
                normalized_phone = login_field[3:]
            elif login_field.startswith('91'):
                normalized_phone = login_field[2:]
            
            try:
                profile = UserProfile.objects.get(phone_number__endswith=normalized_phone)
                user = profile.user
            except UserProfile.DoesNotExist:
                raise serializers.ValidationError({'login_field': 'No account found with this phone number'})
        
        elif login_method == 'username':
            try:
                user = User.objects.get(username=login_field.lower())
            except User.DoesNotExist:
                raise serializers.ValidationError({'login_field': 'No account found with this username'})

        if not user.is_active:
            raise serializers.ValidationError({'login_field': 'Account is disabled'})

        # Authenticate based on mode
        if auth_mode == 'password':
            if not user.check_password(password):
                raise serializers.ValidationError({'password': 'Invalid password'})
        
        elif auth_mode == 'otp':
            # Verify OTP
            from django.utils import timezone
            try:
                otp_record = OTPVerification.objects.get(
                    user=user,
                    otp_type='login_2fa',
                    otp_code=otp,
                    is_used=False,
                    expires_at__gt=timezone.now()
                )
                # Mark OTP as used
                otp_record.is_used = True
                otp_record.save()
            except OTPVerification.DoesNotExist:
                raise serializers.ValidationError({'otp': 'Invalid or expired OTP'})

        attrs['user'] = user
        return attrs
