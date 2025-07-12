# DokLink OTP Backend Setup Guide

This guide will help you configure the complete OTP system for DokLink, including email and SMS OTP functionality.

## 📋 Prerequisites

Before setting up OTP functionality, ensure you have:

1. **Python 3.8+** installed
2. **PostgreSQL** database setup
3. **Redis server** (for caching and rate limiting)
4. **Gmail account** (for email OTP)
5. **Fast2SMS account** (for SMS OTP)

## 🔧 Environment Configuration

### 1. Update `.env` File

The `.env` file has been updated with comprehensive OTP configuration. Here are the key sections you need to configure:

#### Email Configuration (Gmail)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-doklink-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
DEFAULT_FROM_EMAIL=DokLink <your-doklink-email@gmail.com>
```

**Setting up Gmail App Password:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App passwords
3. Generate an app password for "Mail"
4. Use this app password in `EMAIL_HOST_PASSWORD`

#### SMS Configuration (Fast2SMS)
```env
FAST2SMS_API_KEY=your-fast2sms-api-key-here
FAST2SMS_SENDER_ID=DOKLINK
```

**Setting up Fast2SMS:**
1. Sign up at [fast2sms.com](https://www.fast2sms.com/)
2. Complete KYC verification
3. Get your API key from the dashboard
4. Apply for a custom sender ID "DOKLINK" (optional, can use default)

#### OTP Configuration
```env
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3
OTP_RESEND_COOLDOWN_SECONDS=60
```

#### Redis Configuration
```env
REDIS_URL=redis://localhost:6379/0
```

## 🛠️ Installation Steps

### 1. Install Required Dependencies

All required packages are already in `requirements.txt`:

```bash
cd server/doklink
pip install -r requirements.txt
```

Key packages include:
- `djangorestframework` - REST API framework
- `django-phonenumber-field` - Phone number handling
- `redis` - Caching and rate limiting
- `requests` - HTTP requests for SMS API
- `fast2sms` - SMS service integration

### 2. Install and Start Redis

#### On Windows:
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/MicrosoftArchive/redis/releases
```

#### On macOS:
```bash
brew install redis
brew services start redis
```

#### On Ubuntu/Linux:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Verify Redis Installation:**
```bash
redis-cli ping
# Should return: PONG
```

### 3. Database Migration

Run migrations to create OTP-related tables:

```bash
cd server/doklink
python manage.py makemigrations
python manage.py migrate
```

This will create:
- `OTPVerification` table for storing OTPs
- `LoginAudit` table for security logging
- Updated `UserProfile` table with verification fields

### 4. Test Email Configuration

Create a simple test script `test_email.py`:

```python
import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

def test_email():
    try:
        send_mail(
            'DokLink Test Email',
            'This is a test email from DokLink OTP system.',
            settings.DEFAULT_FROM_EMAIL,
            ['test-recipient@gmail.com'],  # Replace with your test email
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Email failed: {e}")

if __name__ == "__main__":
    test_email()
```

Run: `python test_email.py`

### 5. Test SMS Configuration

Create `test_sms.py`:

```python
import os
import django
from app_auth.otp_service import OTPService

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

def test_sms():
    # Create a test OTP record
    from django.contrib.auth.models import User
    from app_auth.models import OTPVerification
    
    # Use existing user or create test user
    user = User.objects.first()
    if not user:
        print("❌ No users found. Create a user first.")
        return
        
    otp_record = OTPService.create_otp_record(user, 'login_2fa', 'sms')
    success, message = OTPService.send_sms_otp(otp_record, '+911234567890')  # Replace with test number
    
    if success:
        print(f"✅ SMS sent successfully: {message}")
    else:
        print(f"❌ SMS failed: {message}")

if __name__ == "__main__":
    test_sms()
```

Run: `python test_sms.py`

## 🔄 API Endpoints

The following OTP endpoints are now available:

### Authentication Endpoints
- `POST /api/v1/auth/login/` - Password-based login
- `POST /api/v1/auth/verify-login-otp/` - OTP-based login ✨ **NEW**

### Login OTP Endpoints
- `POST /api/v1/auth/get-username-otp-options/` - Get delivery options for username
- `POST /api/v1/auth/send-login-otp/` - Send login OTP
- `POST /api/v1/auth/verify-login-otp/` - Verify login OTP ✨ **NEW**

### Forgot Password Endpoints
- `POST /api/v1/auth/send-forgot-password-otp/` - Send password reset OTP
- `POST /api/v1/auth/verify-forgot-password-otp/` - Verify password reset OTP
- `POST /api/v1/auth/confirm-password-reset/` - Complete password reset

## 📱 Frontend Integration

The frontend has been updated with:

### 1. New AuthService Method
```typescript
// New method for OTP-based login
async verifyLoginOTP(data: {
  login_field: string;
  login_method: 'phone' | 'email' | 'username';
  otp_code: string;
}): Promise<LoginResponse>
```

### 2. Updated Login Logic
The `Login.tsx` component now:
- Uses `authService.login()` for password authentication
- Uses `authService.verifyLoginOTP()` for OTP authentication
- Handles both flows seamlessly

### 3. Fixed OTP Container Alignment
- OTP inputs now display correctly in both login and forgot password forms
- Responsive container sizing based on context

## 🧪 Testing the Complete Flow

### 1. Test Email OTP Login
1. Open the app and select "Email" login method
2. Enter your email address
3. Tap "Login with OTP"
4. Check your email for the 6-digit code
5. Enter the code and verify

### 2. Test Phone OTP Login
1. Select "Phone Number" login method
2. Enter your phone number (10 digits)
3. Tap "Login with OTP"
4. Check your SMS for the 6-digit code
5. Enter the code and verify

### 3. Test Username OTP Login
1. Select "Username" login method
2. Enter your username
3. Tap "Login with OTP"
4. Select delivery method (Email/SMS)
5. Check your chosen method for the code
6. Enter the code and verify

### 4. Test Forgot Password Flow
1. From login screen, tap "Forgot Password?"
2. Enter your email/phone/username
3. Tap "Send OTP"
4. Enter received OTP
5. Set new password

## 🛡️ Security Features

The OTP system includes:

### 1. Rate Limiting
- Maximum 3 OTP attempts per request
- 60-second cooldown between OTP requests
- Failed attempt logging

### 2. Security Auditing
- All login attempts logged with IP, user agent
- Suspicious activity detection
- Failed OTP attempt tracking

### 3. OTP Security
- 10-minute expiration time
- Cryptographically secure random generation
- One-time use (automatically invalidated after use)
- Previous OTPs invalidated when new one is requested

## 🚨 Troubleshooting

### Common Issues:

#### 1. Email OTP Not Sending
```bash
# Check email configuration
python manage.py shell
>>> from django.core.mail import send_mail
>>> from django.conf import settings
>>> send_mail('Test', 'Test message', settings.DEFAULT_FROM_EMAIL, ['test@gmail.com'])
```

**Solutions:**
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail
- Ensure `EMAIL_USE_TLS=True`
- Check firewall/network restrictions

#### 2. SMS OTP Not Sending
```bash
# Check Fast2SMS configuration
python manage.py shell
>>> from app_auth.otp_service import OTPService
>>> # Check API key in settings
```

**Solutions:**
- Verify Fast2SMS API key
- Check account balance
- Ensure sender ID is approved
- Verify phone number format (+91XXXXXXXXXX)

#### 3. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

**Solutions:**
- Ensure Redis server is running
- Check Redis URL in .env
- Verify Redis port (default 6379)

#### 4. OTP Expiration Issues
- Check `OTP_EXPIRY_MINUTES` in .env
- Verify server timezone settings
- Check system clock synchronization

## 📊 Monitoring and Logs

### View OTP Logs
```python
# Django shell
python manage.py shell

>>> from app_auth.models import OTPVerification, LoginAudit
>>> 
>>> # Recent OTPs
>>> OTPVerification.objects.filter(created_at__gte=timezone.now()-timedelta(hours=1))
>>> 
>>> # Failed login attempts
>>> LoginAudit.objects.filter(status__startswith='failed')
>>> 
>>> # Successful OTP logins
>>> LoginAudit.objects.filter(status='success', otp_used__isnull=False)
```

### Production Monitoring
Consider adding:
- Sentry for error monitoring
- Prometheus/Grafana for metrics
- ELK stack for log analysis
- SMS delivery status webhooks

## 🎯 Next Steps

After setup, consider:

1. **Rate Limiting Enhancement**
   - Implement IP-based rate limiting
   - Add CAPTCHA for repeated failures

2. **Multi-Channel OTP**
   - Add WhatsApp OTP integration
   - Voice call OTP option

3. **Enhanced Security**
   - Biometric authentication
   - Device fingerprinting
   - Geolocation verification

4. **Analytics**
   - OTP success/failure rates
   - User authentication patterns
   - Security incident alerts

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Django logs: `tail -f doklink/logs/django.log`
3. Check Redis logs: `redis-cli monitor`
4. Verify environment variables: `python manage.py shell` → `from django.conf import settings`

---

**🎉 Congratulations!** Your DokLink OTP system is now fully configured and ready for secure authentication!
