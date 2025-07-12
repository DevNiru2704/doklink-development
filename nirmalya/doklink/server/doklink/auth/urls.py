from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

app_name = 'auth'

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication endpoints
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # User management
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    
    # Validation endpoints
    path('check-email/', views.CheckEmailView.as_view(), name='check_email'),
    path('check-username/', views.CheckUsernameView.as_view(), name='check_username'),
    
    # OTP verification
    path('send-otp/', views.SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
]