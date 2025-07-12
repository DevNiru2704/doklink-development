from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, Address, UserAgreement
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
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError(
            'Must include "email" and "password".'
        )
