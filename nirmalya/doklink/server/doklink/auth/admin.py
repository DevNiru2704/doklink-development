from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import CustomUser, Address, UserAgreement, OTPVerification


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


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    
    list_display = [
        'email', 'username', 'get_full_name', 'phone_number', 
        'is_verified', 'email_verified', 'phone_verified', 
        'is_active', 'created_at'
    ]
    
    list_filter = [
        'is_active', 'is_staff', 'is_superuser', 'is_verified',
        'email_verified', 'phone_verified', 'preferred_language',
        'created_at', 'last_login'
    ]
    
    search_fields = [
        'email', 'username', 'first_name', 'last_name', 
        'phone_number', 'aadhaar_number'
    ]
    
    ordering = ['-created_at']
    
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'last_login', 
        'date_joined', 'password'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'email', 'username', 'password',
                'first_name', 'last_name', 'date_of_birth',
                'phone_number', 'profile_picture'
            )
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
        ('Permissions', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
    )
    
    add_fieldsets = (
        ('Basic Information', {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'password1', 'password2',
                'first_name', 'last_name', 'phone_number'
            )
        }),
        ('Identity', {
            'fields': ('aadhaar_number',)
        }),
    )
    
    inlines = [UserAgreementInline, OTPVerificationInline]
    
    def get_full_name(self, obj):
        return obj.get_full_name() or '-'
    get_full_name.short_description = 'Full Name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'permanent_address', 'current_address', 'referred_by'
        )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Address Admin"""
    
    list_display = ['__str__', 'created_at', 'updated_at']
    list_filter = ['state', 'created_at']
    search_fields = ['address', 'city', 'state', 'pin']
    readonly_fields = ['created_at', 'updated_at']
    
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
        'user', 'agreement_type', 'version', 'accepted_at', 'ip_address'
    ]
    list_filter = ['agreement_type', 'version', 'accepted_at']
    search_fields = ['user__email', 'user__username', 'agreement_type']
    readonly_fields = ['accepted_at']
    
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
        'user', 'otp_type', 'otp_code', 'created_at', 
        'expires_at', 'is_used', 'attempts'
    ]
    list_filter = ['otp_type', 'is_used', 'created_at']
    search_fields = ['user__email', 'user__username', 'otp_type']
    readonly_fields = ['created_at']
    
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
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
