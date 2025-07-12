from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import UserProfile, Address, UserAgreement, OTPVerification, LoginAudit


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class UserAgreementInline(admin.TabularInline):
    model = UserAgreement
    extra = 0
    readonly_fields = ['accepted_at', 'ip_address', 'user_agent']


class OTPVerificationInline(admin.TabularInline):
    model = OTPVerification
    extra = 0
    readonly_fields = ['created_at', 'expires_at']


class UserProfileInline(admin.StackedInline):
    """Inline for UserProfile in Django User admin"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = [
        'phone_number', 'date_of_birth', 'profile_picture', 'aadhaar_number',
        'permanent_address', 'current_address', 'same_as_permanent',
        'preferred_language', 'is_verified', 'email_verified', 'phone_verified',
        'terms_conditions_accepted', 'privacy_policy_accepted', 'data_consent_given',
        'notifications_enabled'
    ]
    readonly_fields = ['created_at', 'updated_at']


# Extend the default User admin to include profile
class ExtendedUserAdmin(BaseUserAdmin):
    """Extended User Admin with Profile"""
    inlines = (UserProfileInline, UserAgreementInline, OTPVerificationInline)
    
    list_display = [
        'username', 'email', 'first_name', 'last_name', 
        'get_phone_number', 'get_verification_status', 
        'is_active', 'date_joined'
    ]
    
    def get_phone_number(self, obj):
        try:
            return obj.profile.phone_number
        except UserProfile.DoesNotExist:
            return '-'
    get_phone_number.short_description = 'Phone Number'
    
    def get_verification_status(self, obj):
        try:
            profile = obj.profile
            status = []
            if profile.email_verified:
                status.append('Email✓')
            if profile.phone_verified:
                status.append('Phone✓')
            if profile.is_verified:
                status.append('Verified✓')
            return ' | '.join(status) if status else 'Not Verified'
        except UserProfile.DoesNotExist:
            return 'No Profile'
    get_verification_status.short_description = 'Verification Status'


# Unregister the default User admin and register our extended version
admin.site.unregister(User)
admin.site.register(User, ExtendedUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """User Profile Admin"""
    
    list_display = [
        'user', 'phone_number', 'aadhaar_number',
        'is_verified', 'email_verified', 'phone_verified', 
        'created_at'
    ]
    
    list_filter = [
        'is_verified', 'email_verified', 'phone_verified',
        'preferred_language', 'created_at'
    ]
    
    search_fields = [
        'user__email', 'user__username', 'user__first_name', 'user__last_name',
        'phone_number', 'aadhaar_number'
    ]
    
    ordering = ['-created_at']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'date_of_birth', 'profile_picture')
        }),
        ('Identity Verification', {
            'fields': (
                'aadhaar_number', 'aadhaar_verified',
                'is_verified', 'email_verified', 'phone_verified'
            )
        }),
        ('Address Information', {
            'fields': (
                'permanent_address', 'current_address', 'same_as_permanent'
            )
        }),
        ('Preferences', {
            'fields': (
                'preferred_language', 'notifications_enabled'
            )
        }),
        ('Agreements', {
            'fields': (
                'terms_conditions_accepted', 'privacy_policy_accepted',
                'data_consent_given'
            )
        }),
        ('Referral System', {
            'fields': ('referred_by', 'referral_code')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    # No inlines since UserAgreement and OTPVerification are linked to User, not UserProfile


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Address Admin"""
    
    list_display = ['__str__', 'state', 'city', 'pin', 'created_at']
    list_filter = ['state', 'city', 'created_at']
    search_fields = ['address', 'city', 'state', 'pin']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Address Details', {
            'fields': ('address', 'city', 'state', 'pin')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(UserAgreement)
class UserAgreementAdmin(admin.ModelAdmin):
    """User Agreement Admin"""
    
    list_display = [
        'user', 'get_agreement_type_display', 'version', 'accepted_at', 'ip_address'
    ]
    list_filter = ['agreement_type', 'version', 'accepted_at']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['accepted_at']
    ordering = ['-accepted_at']
    
    fieldsets = (
        ('Agreement Details', {
            'fields': ('user', 'agreement_type', 'version')
        }),
        ('Audit Information', {
            'fields': ('accepted_at', 'ip_address', 'user_agent')
        }),
    )


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    """OTP Verification Admin"""
    
    list_display = [
        'user', 'get_otp_type_display', 'otp_code', 'created_at', 
        'expires_at', 'is_used', 'is_valid_status', 'attempts'
    ]
    list_filter = ['otp_type', 'is_used', 'created_at', 'expires_at']
    search_fields = ['user__email', 'user__username', 'otp_code']
    readonly_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('OTP Details', {
            'fields': ('user', 'otp_type', 'otp_code')
        }),
        ('Status', {
            'fields': ('is_used', 'attempts')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )
    
    def is_valid_status(self, obj):
        """Show if OTP is currently valid"""
        if obj.is_valid():
            return "✓ Valid"
        elif obj.is_expired():
            return "✗ Expired"
        else:
            return "✗ Used"
    is_valid_status.short_description = 'Status'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(LoginAudit)
class LoginAuditAdmin(admin.ModelAdmin):
    """Enhanced admin for Login Audit tracking"""
    list_display = [
        'email_attempted', 
        'user_link',
        'status_display',
        'ip_address',
        'attempted_at',
        'is_suspicious_display',
        'location'
    ]
    list_filter = [
        'status',
        'is_suspicious',
        'attempted_at',
        ('user', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = [
        'email_attempted',
        'user__email',
        'user__first_name',
        'user__last_name',
        'ip_address',
        'location'
    ]
    readonly_fields = [
        'attempted_at',
        'session_duration',
        'user_agent_display'
    ]
    ordering = ['-attempted_at']
    list_per_page = 50
    
    fieldsets = (
        ('Login Attempt', {
            'fields': ('email_attempted', 'user', 'status', 'attempted_at')
        }),
        ('Security Information', {
            'fields': ('ip_address', 'location', 'is_suspicious', 'failed_attempts_count')
        }),
        ('Technical Details', {
            'fields': ('user_agent_display', 'otp_used'),
            'classes': ('collapse',)
        }),
        ('Session Tracking', {
            'fields': ('session_duration',),
            'classes': ('collapse',)
        }),
    )

    def user_link(self, obj):
        """Link to user profile"""
        if obj.user:
            return format_html(
                '<a href="/admin/auth/user/{}/change/">{}</a>',
                obj.user.id,
                obj.user.get_full_name() or obj.user.email
            )
        return "Unknown User"
    user_link.short_description = "User"

    def status_display(self, obj):
        """Colored status display"""
        colors = {
            'success': 'green',
            'failed_password': 'red',
            'failed_user': 'orange',
            'failed_otp': 'purple',
            'failed_locked': 'darkred',
            'logout': 'blue',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = "Status"

    def is_suspicious_display(self, obj):
        """Display suspicious flag with icon"""
        if obj.is_suspicious:
            return format_html(
                '<span style="color: red;">⚠️ Suspicious</span>'
            )
        return format_html(
            '<span style="color: green;">✅ Normal</span>'
        )
    is_suspicious_display.short_description = "Security Status"

    def user_agent_display(self, obj):
        """Format user agent for better readability"""
        if obj.user_agent:
            return format_html('<pre style="white-space: pre-wrap; font-size: 12px;">{}</pre>', obj.user_agent)
        return "-"
    user_agent_display.short_description = "User Agent"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('user', 'otp_used')
