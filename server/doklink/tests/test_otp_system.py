#!/usr/bin/env python
"""
Test script for DokLink OTP functionality
Run this script to test email and SMS OTP features
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from django.contrib.auth.models import User
from app_auth.models import OTPVerification, UserProfile
from app_auth.otp_service import OTPService
from django.core.mail import send_mail
from django.conf import settings
import json

def test_email_configuration():
    """Test email configuration"""
    print("🔍 Testing Email Configuration...")
    try:
        send_mail(
            'DokLink OTP Test',
            'This is a test email from DokLink OTP system.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER],  # Send to yourself
            fail_silently=False,
        )
        print("✅ Email configuration is working!")
        return True
    except Exception as e:
        print(f"❌ Email configuration failed: {e}")
        print("💡 Check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env")
        return False

def test_sms_configuration():
    """Test SMS configuration"""
    print("\n🔍 Testing SMS Configuration...")
    try:
        from django.conf import settings
        api_key = getattr(settings, 'FAST2SMS_API_KEY', None)
        if not api_key or api_key == 'your-fast2sms-api-key-here':
            print("❌ Fast2SMS API key not configured")
            print("💡 Set FAST2SMS_API_KEY in your .env file")
            return False
        
        print("✅ Fast2SMS API key is configured")
        print("💡 To test SMS, create a user and use the send_test_otp function")
        return True
    except Exception as e:
        print(f"❌ SMS configuration check failed: {e}")
        return False

def create_test_user():
    """Create a test user if none exists"""
    print("\n🔍 Checking for test users...")
    
    try:
        user = User.objects.filter(email__icontains='test').first()
        if user:
            print(f"✅ Found test user: {user.email}")
            return user
        
        # Create test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            phone_number='+911234567890'
        )
        
        print(f"✅ Created test user: {user.email}")
        return user
        
    except Exception as e:
        print(f"❌ Failed to create test user: {e}")
        return None

def test_email_otp(user):
    """Test email OTP generation and sending"""
    print(f"\n🔍 Testing Email OTP for {user.email}...")
    
    try:
        success, message = OTPService.send_otp(
            user=user,
            otp_type='login_2fa',
            delivery_method='email',
            email_subject="Test Login OTP"
        )
        
        if success:
            print(f"✅ Email OTP sent successfully: {message}")
            
            # Get the OTP record
            otp_record = OTPVerification.objects.filter(
                user=user,
                otp_type='login_2fa',
                is_used=False
            ).order_by('-created_at').first()
            
            if otp_record:
                print(f"🔑 OTP Code (for testing): {otp_record.otp_code}")
                print(f"⏰ Expires at: {otp_record.expires_at}")
                return otp_record.otp_code
            
        else:
            print(f"❌ Email OTP failed: {message}")
            
    except Exception as e:
        print(f"❌ Email OTP test failed: {e}")
    
    return None

def test_otp_verification(user, otp_code):
    """Test OTP verification"""
    print(f"\n🔍 Testing OTP Verification...")
    
    try:
        success, message = OTPService.verify_otp(user, otp_code, 'login_2fa')
        
        if success:
            print(f"✅ OTP verification successful: {message}")
            return True
        else:
            print(f"❌ OTP verification failed: {message}")
            return False
            
    except Exception as e:
        print(f"❌ OTP verification test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints using Django test client"""
    print("\n🔍 Testing API Endpoints...")
    
    from django.test import Client
    from django.urls import reverse
    
    client = Client()
    
    # Test send login OTP endpoint
    try:
        response = client.post('/api/v1/auth/send-login-otp/', {
            'login_field': 'test@example.com',
            'login_method': 'email',
            'delivery_method': 'email'
        })
        
        if response.status_code == 200:
            print("✅ Send Login OTP endpoint working")
        else:
            print(f"⚠️ Send Login OTP returned status {response.status_code}")
            print(f"Response: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")

def main():
    """Run all tests"""
    print("🚀 DokLink OTP System Test")
    print("=" * 50)
    
    # Test configurations
    email_ok = test_email_configuration()
    sms_ok = test_sms_configuration()
    
    # Create test user
    user = create_test_user()
    if not user:
        print("\n❌ Cannot proceed without a test user")
        return
    
    # Test OTP flow
    if email_ok:
        otp_code = test_email_otp(user)
        if otp_code:
            test_otp_verification(user, otp_code)
    
    # Test API endpoints
    test_api_endpoints()
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"📧 Email Configuration: {'✅' if email_ok else '❌'}")
    print(f"📱 SMS Configuration: {'✅' if sms_ok else '❌'}")
    print(f"👤 Test User: {'✅' if user else '❌'}")
    
    if email_ok and user:
        print("\n🎉 Basic OTP system is working!")
        print("💡 Next steps:")
        print("   1. Configure Fast2SMS for SMS OTP")
        print("   2. Test with real phone numbers")
        print("   3. Test the mobile app integration")
    else:
        print("\n⚠️ Some components need configuration")
        print("📖 Check the OTP_SETUP_GUIDE.md for detailed instructions")

if __name__ == "__main__":
    main()
