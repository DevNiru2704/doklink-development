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
    
    # Configuration endpoints
    path('cloudinary-config/', views.get_cloudinary_config, name='cloudinary_config'),
    
    # User management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # OTP verification
    path('verify-email/', views.verify_email, name='verify_email'),
    path('verify-phone/', views.verify_phone, name='verify_phone'),
    path('send-phone-otp/', views.send_phone_otp, name='send_phone_otp'),
    path('verification-status/', views.check_verification_status, name='verification_status'),
    
    # Password reset
    path('reset-password/', views.reset_password_request, name='reset_password_request'),
    path('reset-password-confirm/', views.reset_password_confirm, name='reset_password_confirm'),
]