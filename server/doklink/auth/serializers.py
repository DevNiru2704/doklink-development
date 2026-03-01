from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from phonenumber_field.serializerfields import PhoneNumberField
from .models import CustomUser, Address, UserAgreement
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
        return value


class UserSignUpSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    # Basic fields
    name = serializers.CharField(write_only=True, help_text="Full name will be split into first and last name")
    email = serializers.EmailField()
    username = serializers.CharField(read_only=True)  # Auto-generated
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    dob = serializers.DateField(source='date_of_birth')
    phone_number = PhoneNumberField()
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    aadhaar_number = serializers.CharField(max_length=12)
    
    # Address fields
    permanent_address = AddressSerializer()
    current_address = AddressSerializer(required=False, allow_null=True)
    same_as_permanent = serializers.BooleanField(default=False)
    
    # Preferences
    language = serializers.CharField(source='preferred_language')
    referral_code = serializers.CharField(required=False, allow_blank=True)
    
    # Agreements
    agreements = serializers.DictField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'name', 'email', 'username', 'password', 'confirm_password',
            'dob', 'phone_number', 'profile_picture', 'aadhaar_number',
            'permanent_address', 'current_address', 'same_as_permanent',
            'language', 'referral_code', 'agreements'
        ]

    def validate_name(self, value):
        """Validate name format"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long")
        return value.strip()

    def validate_email(self, value):
        """Validate email uniqueness"""
        if CustomUser.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value.lower()

    def validate_phone_number(self, value):
        """Validate phone number uniqueness and format"""
        if CustomUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists")
        
        # Additional validation for Indian phone numbers
        phone_str = str(value)
        if not re.match(r'^\+91[6-9]\d{9}$', phone_str):
            raise serializers.ValidationError("Please enter a valid Indian phone number")
        
        return value

    def validate_aadhaar_number(self, value):
        """Validate Aadhaar number format and uniqueness"""
        if not re.match(r'^[2-9][0-9]{11}$', value):
            raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        
        if CustomUser.objects.filter(aadhaar_number=value).exists():
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
        valid_languages = [choice[0] for choice in CustomUser.LANGUAGE_CHOICES]
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
        
        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create permanent address
        permanent_address = Address.objects.create(**permanent_address_data)
        
        # Create current address if different
        if same_as_permanent or not current_address_data:
            current_address = permanent_address
        else:
            current_address = Address.objects.create(**current_address_data)
        
        # Handle referral code
        referral_code = validated_data.pop('referral_code', None)
        referred_by = None
        if referral_code:
            try:
                referred_by = CustomUser.objects.get(username=referral_code)
            except CustomUser.DoesNotExist:
                pass  # Invalid referral code, ignore
        
        # Create user
        user = CustomUser.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            permanent_address=permanent_address,
            current_address=current_address,
            same_as_permanent=same_as_permanent,
            referred_by=referred_by,
            terms_conditions_accepted=agreements_data.get('termsConditions', False),
            privacy_policy_accepted=agreements_data.get('privacyPolicy', False),
            data_consent_given=agreements_data.get('dataConsent', False),
            notifications_enabled=agreements_data.get('notifications', False),
            **validated_data
        )
        
        # Set password
        user.set_password(password)
        user.save()
        
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
    """Serializer for user data"""
    permanent_address = AddressSerializer(read_only=True)
    current_address = AddressSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'phone_number', 'date_of_birth', 'profile_picture', 'aadhaar_number',
            'permanent_address', 'current_address', 'same_as_permanent',
            'preferred_language', 'is_verified', 'email_verified', 'phone_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'username', 'is_verified', 'email_verified', 'phone_verified',
            'created_at', 'updated_at'
        ]


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
