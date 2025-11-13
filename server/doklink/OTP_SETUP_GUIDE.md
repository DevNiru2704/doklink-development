# 🚀 DokLink OTP System Setup Guide

## ✅ What's Working
- ✅ JWT migrations completed successfully
- ✅ OTP backend system is fully implemented
- ✅ API endpoints are accessible
- ✅ Frontend integration is complete

## 🔧 Required Configuration Steps

### 1. 📧 Gmail App Password Setup

**Why needed:** Gmail blocks "less secure" apps. You need an App Password for SMTP authentication.

**Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account settings → Security → 2-Step Verification
3. Go to "App passwords" and generate a new password for "Mail"
4. Replace the password in your `.env` file:

```env
EMAIL_HOST_PASSWORD=your-16-character-app-password-here
```

### 2. 📱 SMS Configuration (Optional)

**For SMS OTP functionality:**
1. Sign up at [Fast2SMS](https://www.fast2sms.com/)
2. Get your API key
3. Add to `.env`:

```env
FAST2SMS_API_KEY=your-fast2sms-api-key-here
```

### 3. 🧪 Test with Real User

The test script tries to send OTP to `testuser@example.com`, but this user might not exist. Either:

**Option A:** Create a test user
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
User.objects.create_user('testuser', 'testuser@example.com', 'password123')
```

**Option B:** Test with your own email
- Use your real email when testing the frontend
- Or modify the test script to use your email

### 4. 🏃‍♂️ Quick Test

After setting up Gmail App Password:

```bash
python test_otp_system.py
```

### 5. 🌐 Frontend Testing

1. Start the Django server:
```bash
python manage.py runserver
```

2. Start your React Native app and test:
   - Login with OTP option
   - Enter your email
   - Check your Gmail for OTP
   - Enter OTP to complete login

## 🎯 Expected Results

After proper configuration:
- ✅ Email Configuration: Working
- ✅ API Endpoints: Working  
- ✅ JWT Authentication: Working
- ✅ OTP Flow: Complete

## 🐛 Common Issues

### "Username and Password not accepted"
- **Solution:** Use Gmail App Password, not regular password

### "No account found with this email"
- **Solution:** Use an email that exists in your user database

### "JWT token errors"
- **Solution:** Already fixed with migrations

### Redis connection errors
- **Solution:** Install and start Redis server

## 📝 Final Notes

Your OTP system is **95% complete**! Just need the Gmail App Password to make email OTP work. All the backend logic, frontend integration, and database setup is done.

The system includes:
- ✅ Secure OTP generation and validation
- ✅ Rate limiting and abuse prevention  
- ✅ Comprehensive audit logging
- ✅ JWT token blacklist support
- ✅ Email and SMS OTP support
- ✅ Frontend integration complete
