from django.contrib.auth.models import User
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import timedelta
import uuid


class Address(models.Model):
    """Model for storing address information"""
    
    # Indian States for dropdown
    STATE_CHOICES = [
        ('Andhra Pradesh', 'Andhra Pradesh'),
        ('Arunachal Pradesh', 'Arunachal Pradesh'),
        ('Assam', 'Assam'),
        ('Bihar', 'Bihar'),
        ('Chhattisgarh', 'Chhattisgarh'),
        ('Goa', 'Goa'),
        ('Gujarat', 'Gujarat'),
        ('Haryana', 'Haryana'),
        ('Himachal Pradesh', 'Himachal Pradesh'),
        ('Jharkhand', 'Jharkhand'),
        ('Karnataka', 'Karnataka'),
        ('Kerala', 'Kerala'),
        ('Madhya Pradesh', 'Madhya Pradesh'),
        ('Maharashtra', 'Maharashtra'),
        ('Manipur', 'Manipur'),
        ('Meghalaya', 'Meghalaya'),
        ('Mizoram', 'Mizoram'),
        ('Nagaland', 'Nagaland'),
        ('Odisha', 'Odisha'),
        ('Punjab', 'Punjab'),
        ('Rajasthan', 'Rajasthan'),
        ('Sikkim', 'Sikkim'),
        ('Tamil Nadu', 'Tamil Nadu'),
        ('Telangana', 'Telangana'),
        ('Tripura', 'Tripura'),
        ('Uttar Pradesh', 'Uttar Pradesh'),
        ('Uttarakhand', 'Uttarakhand'),
        ('West Bengal', 'West Bengal'),
    ]
    
    address = models.TextField(help_text="Full address")
    state = models.CharField(max_length=100, choices=STATE_CHOICES)
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
        indexes = [
            models.Index(fields=['state']),
            models.Index(fields=['city']),
            models.Index(fields=['pin']),
        ]

    def __str__(self):
        return f"{self.city}, {self.state} - {self.pin}"


class UserProfile(models.Model):
    """Extended User profile matching SignUp.tsx requirements"""
    
    # Link to Django's built-in User model
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Additional Information
    phone_number = PhoneNumberField(
        unique=True,
        help_text="Phone number with country code"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.URLField(
        null=True,
        blank=True,
        help_text="User profile picture URL from Cloudinary"
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

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['aadhaar_number']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} Profile"

    def get_full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()


class UserAgreement(models.Model):
    """Track user agreements with timestamps"""
    
    AGREEMENT_TYPE_CHOICES = [
        ('terms', 'Terms & Conditions'),
        ('privacy', 'Privacy Policy'),
        ('data_consent', 'Data Collection Consent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agreements')
    agreement_type = models.CharField(max_length=50, choices=AGREEMENT_TYPE_CHOICES)
    version = models.CharField(max_length=10, default='1.0')
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'agreement_type', 'version']
        verbose_name = "User Agreement"
        verbose_name_plural = "User Agreements"
        indexes = [
            models.Index(fields=['user', 'agreement_type']),
            models.Index(fields=['accepted_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_agreement_type_display()} v{self.version}"


class OTPVerification(models.Model):
    """Enhanced OTP verification for email and phone with delivery tracking"""
    
    OTP_TYPE_CHOICES = [
        ('email', 'Email Verification'),
        ('phone', 'Phone Verification'),
        ('password_reset', 'Password Reset'),
        ('login_2fa', '2FA Login'),
        ('admin_login', 'Admin Login Verification'),
    ]
    
    DELIVERY_METHOD_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('auto', 'Auto-detect based on login method'),
    ]
    
    DELIVERY_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent Successfully'),
        ('failed', 'Delivery Failed'),
        ('retry', 'Retrying'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_type = models.CharField(max_length=20, choices=OTP_TYPE_CHOICES)
    otp_code = models.CharField(max_length=8)  # Increased for password reset tokens
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHOD_CHOICES, default='auto')
    delivery_status = models.CharField(max_length=10, choices=DELIVERY_STATUS_CHOICES, default='pending')
    delivery_destination = models.CharField(max_length=255, blank=True, help_text="Email or phone where OTP was sent")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)

    class Meta:
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"
        indexes = [
            models.Index(fields=['user', 'otp_type']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['created_at']),
        ]

    def save(self, *args, **kwargs):
        """Auto-set expires_at if not provided"""
        if not self.expires_at:
            if self.otp_type == 'password_reset':
                # Password reset tokens expire in 10 minutes
                self.expires_at = timezone.now() + timedelta(minutes=10)
            else:
                # OTP codes expire in 10 minutes
                self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        """Check if OTP is expired"""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """Check if OTP is valid (not used, not expired, and attempts within limit)"""
        return not self.is_used and not self.is_expired() and self.attempts < self.max_attempts
    
    def can_retry_delivery(self):
        """Check if OTP delivery can be retried"""
        return self.delivery_status in ['failed', 'retry'] and not self.is_expired()

    def __str__(self):
        return f"{self.user.email} - {self.get_otp_type_display()} OTP ({self.delivery_method})"


class LoginAudit(models.Model):
    """Comprehensive audit trail for login attempts"""
    
    LOGIN_STATUS_CHOICES = [
        ('success', 'Successful Login'),
        ('failed_password', 'Failed - Invalid Password'),
        ('failed_user', 'Failed - User Not Found'),
        ('failed_otp', 'Failed - Invalid OTP'),
        ('failed_locked', 'Failed - Account Locked'),
        ('logout', 'User Logout'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='login_audits',
        null=True,  # Null for failed attempts where user doesn't exist
        blank=True
    )
    email_attempted = models.EmailField(help_text="Email used in login attempt")
    status = models.CharField(max_length=20, choices=LOGIN_STATUS_CHOICES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(help_text="Browser/device information")
    location = models.CharField(max_length=200, blank=True, null=True)  # City, Country
    
    # Security tracking
    is_suspicious = models.BooleanField(default=False)
    failed_attempts_count = models.IntegerField(default=0)
    otp_used = models.ForeignKey(
        OTPVerification,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="OTP used for this login (if any)"
    )
    
    # Timestamps
    attempted_at = models.DateTimeField(auto_now_add=True)
    session_duration = models.DurationField(null=True, blank=True)  # For logout tracking

    class Meta:
        verbose_name = "Login Audit"
        verbose_name_plural = "Login Audits"
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['user', 'attempted_at']),
            models.Index(fields=['ip_address', 'attempted_at']),
            models.Index(fields=['status', 'attempted_at']),
            models.Index(fields=['is_suspicious']),
            models.Index(fields=['email_attempted']),
        ]

    def __str__(self):
        return f"{self.email_attempted} - {self.get_status_display()} at {self.attempted_at}"

    @classmethod
    def log_attempt(cls, email, status, ip_address, user_agent, user=None, otp=None, otp_used=None, **kwargs):
        """Helper method to log login attempts.

        Accepts either `otp` (legacy) or `otp_used` (new) keyword for the OTP record so
        that older call-sites do not break. The first non-None value among the two is
        persisted in the `otp_used` field.
        """
        # Backwards compatibility for both `otp` and `otp_used` keyword arguments
        otp_record = otp if otp is not None else otp_used

        return cls.objects.create(
            user=user,
            email_attempted=email,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            otp_used=otp_record,
            **kwargs
        )

    def mark_suspicious(self, reason=""):
        """Mark this login attempt as suspicious"""
        self.is_suspicious = True
        if reason:
            # You could add a reason field if needed
            pass
        self.save()


# Keep the CustomUser model but commented out for future use
"""
class CustomUser(AbstractUser):
    # Extended User model matching SignUp.tsx requirements
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = PhoneNumberField(
        unique=True,
        help_text="Phone number with country code"
    )
    # ... rest of the model for future use
"""
