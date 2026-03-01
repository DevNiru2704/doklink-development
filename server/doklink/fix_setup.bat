@echo off
REM Fix Django JWT and OTP Setup Issues

echo 🔧 Fixing Django JWT and Database Issues...

echo 📦 Installing django-redis...
pip install django-redis

echo 🔄 Making migrations for JWT token blacklist...
python manage.py makemigrations

echo 🗄️ Running all migrations...
python manage.py migrate

echo 📧 Testing email configuration...
python -c "import os; import django; from django.core.mail import send_mail; from django.conf import settings; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings'); django.setup(); send_mail('DokLink Test Email', 'This is a test email from DokLink OTP system.', settings.DEFAULT_FROM_EMAIL, [settings.EMAIL_HOST_USER], fail_silently=False); print('✅ Email test successful!')" 2>nul || echo ❌ Email test failed - you may need Gmail App Password

echo 🧪 Testing OTP system...
python test_otp_system.py

echo ✅ Setup complete!
echo 💡 If email tests fail, you'll need to:
echo    1. Enable 2FA on Gmail
echo    2. Generate App Password  
echo    3. Replace password in .env file

pause
