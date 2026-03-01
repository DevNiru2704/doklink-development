from django.contrib.auth.models import AbstractUser
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.core.validators import RegexValidator
import uuid


class Address(models.Model):
    """Model for storing address information"""
    address = models.TextField(help_text="Full address")
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    pin = models.CharField(
        max_length=6,
        validators=[
            RegexValidator(
                regex=r'^[1-9][0-9]{5}$',
                message="PIN code must be exactly 6 digits and cannot start with 0"
            )
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"

    def __str__(self):
        return f"{self.city}, {self.state} - {self.pin}"


class CustomUser(AbstractUser):
    """Extended User model matching SignUp.tsx requirements"""
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = PhoneNumberField(
        unique=True,
        help_text="Phone number with country code"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text="User profile picture"
    )
    
    # Aadhaar Information
    aadhaar_number = models.CharField(
        max_length=12,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[2-9][0-9]{11}$',
                message="Aadhaar number must be exactly 12 digits"
            )
        ]
    )
    aadhaar_verified = models.BooleanField(default=False)
    
    # Address Information
    permanent_address = models.OneToOneField(
        Address,
        on_delete=models.CASCADE,
        related_name='permanent_user',
        null=True,
        blank=True
    )
    current_address = models.OneToOneField(
        Address,
        on_delete=models.CASCADE,
        related_name='current_user',
        null=True,
        blank=True
    )
    same_as_permanent = models.BooleanField(default=False)
    
    # Preferences
    LANGUAGE_CHOICES = [
        ('English', 'English'),
        ('Hindi', 'Hindi'),
        ('Bengali', 'Bengali'),
        ('Tamil', 'Tamil'),
        ('Telugu', 'Telugu'),
        ('Marathi', 'Marathi'),
        ('Gujarati', 'Gujarati'),
        ('Kannada', 'Kannada'),
        ('Malayalam', 'Malayalam'),
        ('Punjabi', 'Punjabi'),
    ]
    
    preferred_language = models.CharField(
        max_length=20,
        choices=LANGUAGE_CHOICES,
        default='English'
    )
    
    # Referral System
    referral_code = models.CharField(max_length=50, blank=True, null=True)
    referred_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )
    
    # Agreements and Consents
    terms_conditions_accepted = models.BooleanField(default=False)
    privacy_policy_accepted = models.BooleanField(default=False)
    data_consent_given = models.BooleanField(default=False)
    notifications_enabled = models.BooleanField(default=False)
    
    # Account Status
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone_number', 'aadhaar_number']

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['aadhaar_number']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0].lower()
            # Ensure username is unique
            base_username = self.username
            counter = 1
            while CustomUser.objects.filter(username=self.username).exists():
                self.username = f"{base_username}{counter}"
                counter += 1
        
        super().save(*args, **kwargs)


class UserAgreement(models.Model):
    """Track user agreements with timestamps"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='agreements')
    agreement_type = models.CharField(max_length=50)  # 'terms', 'privacy', 'data_consent'
    version = models.CharField(max_length=10, default='1.0')
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'agreement_type', 'version']
        verbose_name = "User Agreement"
        verbose_name_plural = "User Agreements"

    def __str__(self):
        return f"{self.user.email} - {self.agreement_type} v{self.version}"


class OTPVerification(models.Model):
    """OTP verification for email and phone"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_type = models.CharField(max_length=20)  # 'email', 'phone', 'password_reset'
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"

    def __str__(self):
        return f"{self.user.email} - {self.otp_type} OTP"
