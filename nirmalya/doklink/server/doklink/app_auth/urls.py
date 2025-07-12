from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

app_name = 'app_auth'

urlpatterns = [
    # Authentication endpoints
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Login OTP endpoints
    path('get-username-otp-options/', views.get_username_otp_options, name='get_username_otp_options'),
    path('send-login-otp/', views.send_login_otp, name='send_login_otp'),
    path('verify-login-otp/', views.verify_login_otp, name='verify_login_otp'),
    
    # Forgot password endpoints
    path('send-forgot-password-otp/', views.send_forgot_password_otp, name='send_forgot_password_otp'),
    path('verify-forgot-password-otp/', views.verify_forgot_password_otp, name='verify_forgot_password_otp'),
    path('confirm-password-reset/', views.confirm_password_reset, name='confirm_password_reset'),
    
    # Configuration endpoints
    path('cloudinary-config/', views.get_cloudinary_config, name='cloudinary_config'),
    path('cloudinary-signature/', views.generate_cloudinary_signature, name='cloudinary_signature'),
    
    # User management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # OTP verification
    path('verify-email/', views.verify_email, name='verify_email'),
    path('verify-phone/', views.verify_phone, name='verify_phone'),
    path('send-phone-otp/', views.send_phone_otp, name='send_phone_otp'),
    path('verification-status/', views.check_verification_status, name='verification_status'),
    
    # Password reset (legacy - replaced by forgot password endpoints above)
    path('reset-password/', views.reset_password_request, name='reset_password_request'),
    path('reset-password-confirm/', views.reset_password_confirm, name='reset_password_confirm'),
]