#!/bin/bash
# Quick setup script for DokLink OTP system

echo "🚀 Setting up DokLink OTP System..."

# Install new Python packages
echo "📦 Installing Python packages..."
pip install django-redis==5.4.0

# Check if Redis is running
echo "🔍 Checking Redis connection..."
python -c "
import redis
try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print('✅ Redis is running and accessible')
except Exception as e:
    print(f'❌ Redis connection failed: {e}')
    print('💡 Please install and start Redis server:')
    print('   - Windows: choco install redis-64')
    print('   - macOS: brew install redis && brew services start redis')
    print('   - Ubuntu: sudo apt install redis-server && sudo systemctl start redis-server')
"

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser if needed
echo "👤 Creating superuser (if needed)..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@doklink.com', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('✅ Superuser already exists')
"

# Test OTP system
echo "🧪 Testing OTP system..."
python test_otp_system.py

echo "🎉 Setup complete! Your DokLink OTP system is ready."
echo ""
echo "📋 Next steps:"
echo "1. Configure email settings in .env file"
echo "2. Set up Fast2SMS API key for SMS OTP"
echo "3. Start the development server: python manage.py runserver"
echo "4. Test OTP login from your mobile app"
