# DokLink Backend

Django REST API for DokLink health management app.

## Setup

1. **Create Virtual Environment**
```bash
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Environment Setup**
```bash
cp env-example.env .env
```

3. **Configure .env**
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/doklink
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=doklink_upload_preset
CLOUDINARY_FOLDER=doklink/profile_pictures
```

4. **Database Setup**
```bash
python manage.py migrate
```

5. **Run Server**
```bash
python manage.py runserver 0.0.0.0:8000
```

## API Endpoints

- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login
- `GET /api/v1/auth/cloudinary-config/` - Get Cloudinary config
- `POST /api/v1/auth/cloudinary-signature/` - Generate upload signature

## Features

- JWT Authentication
- User profiles with Aadhaar
- Cloudinary image upload (signed)
- Phone/Email validation
│   ├── urls.py               # Main URL configuration
│   ├── views.py              # API root view
│   └── wsgi.py               # WSGI configuration
├── app_auth/                  # Authentication app
│   ├── models.py             # User profile, address models
│   ├── serializers.py        # API serializers
│   ├── views.py              # API views
│   ├── urls.py               # Auth URL patterns
│   └── migrations/           # Database migrations
├── media/                    # User uploaded files
├── static/                   # Static files
├── templates/                # Email templates
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create from example)
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- PostgreSQL (or SQLite for development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doklink-development/server/doklink
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   python pip install -r requirements.txt
   ```

4. **Environment Configuration**
   
   Create a `.env` file from the example:
   ```bash
   cp env-example.env .env
   ```
   
   Edit `.env` with your configuration:
   ```properties
   SECRET_KEY=your-super-secret-key-here
   DEBUG=True
   
   # Database Configuration
   DB_NAME=your-database-name
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_HOST=localhost
   DB_PORT=5432
   
   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   
   # Security
   ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:8081
   ```

5. **Database Setup**
   
   For PostgreSQL:
   ```bash
   # Create database
   createdb your-database-name
   
   # Run migrations
   python manage.py makemigrations
   python manage.py migrate
   ```
   
   For SQLite (development):
   ```bash
   # Just run migrations (SQLite file will be created automatically)
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser** (optional)
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

The API will be available at `http://localhost:8000/api/v1/`

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup/` | User registration |
| POST | `/api/v1/auth/login/` | User login |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token |
| GET | `/api/v1/auth/profile/` | Get user profile |
| PUT | `/api/v1/auth/profile/` | Update user profile |

### Verification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/verify-email/` | Verify email with OTP |
| POST | `/api/v1/auth/send-phone-otp/` | Send phone OTP |
| POST | `/api/v1/auth/verify-phone/` | Verify phone with OTP |
| GET | `/api/v1/auth/verification-status/` | Check verification status |

### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/password-reset/` | Request password reset |
| POST | `/api/v1/auth/password-reset-confirm/` | Confirm password reset |

---

## 🚀 Redis Caching

DokLink uses Redis for high-performance caching to improve response times and reduce database load on frequently accessed endpoints.

### What's Cached

| Endpoint | TTL | Cache Key Pattern | Invalidation Trigger |
|----------|-----|-------------------|----------------------|
| Hospital Search | 30 seconds | `doklink:nearby_hospitals:{lat}:{lon}:{radius}:{bed_type}` | Bed booking/status update |
| User Insurance | 5 minutes | `doklink:user_insurances:{user_id}` | Manual invalidation |
| User Sessions | Session timeout | `doklink:session:*` | Logout/session expiry |

### Performance Impact

**Before Caching:**
- Hospital search: 200-500ms (database query + distance calculations)
- Insurance fetch: 100-300ms (multiple table joins)

**After Caching:**
- First request: Same as before (cache miss)
- Subsequent requests: 10-50ms (90-95% faster)
- **Overall improvement: ~10x faster for cached requests**

### Cache Invalidation Strategy

**Smart Invalidation:**
- Hospital cache automatically invalidates when:
  - New emergency bed is booked
  - Booking status changes (confirmed/cancelled)
  - Uses pattern-based deletion: `nearby_hospitals:*`

**Manual Invalidation:**
```python
from django.core.cache import cache

# Invalidate all hospital searches
cache.delete_pattern('doklink:nearby_hospitals:*')

# Invalidate specific user insurance
cache.delete(f'doklink:user_insurances:{user_id}')
```

### Technical Implementation

**Cache Configuration** (`settings.py`):
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'KEY_PREFIX': 'doklink',
        'TIMEOUT': 300,  # Default 5 minutes
    }
}
```

**Usage Example** (in views):
```python
from django.core.cache import cache
import hashlib
import json

def get_nearby_hospitals(request):
    # Generate cache key
    cache_params = f"{latitude}:{longitude}:{radius}:{bed_type}"
    cache_key = f"nearby_hospitals:{cache_params}"
    
    # Try cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Fetch from database if cache miss
    hospitals = Hospital.objects.filter(...)
    data = serialize_hospitals(hospitals)
    
    # Store in cache (30 seconds TTL)
    cache.set(cache_key, data, timeout=30)
    return Response(data)

def invalidate_hospital_cache():
    """Invalidate all hospital search caches"""
    try:
        cache.delete_pattern('nearby_hospitals:*')
    except Exception as e:
        logger.warning(f"Cache invalidation failed: {e}")
```

### Graceful Degradation

If Redis is unavailable:
- App continues working normally
- Requests hit database directly
- Logs warning but doesn't crash
- Cache operations silently fail

### Monitoring Redis

**Check Redis Connection:**
```bash
# From terminal
redis-cli ping  # Should return: PONG

# Check Redis info
redis-cli INFO

# Monitor real-time operations
redis-cli MONITOR
```

**Django Shell Testing:**
```python
from django.core.cache import cache

# Test cache
cache.set('test', 'working', 60)
print(cache.get('test'))  # Should print: working

# Check specific cache key
key = 'nearby_hospitals:22.5726:88.3639:10.0:all'
print(cache.get(key))

# Check all keys matching pattern
from django_redis import get_redis_connection
redis_conn = get_redis_connection("default")
keys = redis_conn.keys('doklink:nearby_hospitals:*')
print(f"Found {len(keys)} cached hospital searches")
```

### Production Deployment

**Install Redis (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
sudo systemctl status redis-server
redis-cli ping  # Should return PONG
```

**Environment Variables:**
```bash
# Development
REDIS_URL=redis://localhost:6379/0

# Production with password
REDIS_URL=redis://:your_password@localhost:6379/0

# Redis cluster
REDIS_URL=redis://redis-master:6379/0
```

**Production Best Practices:**
1. **Enable Redis persistence** (AOF + RDB for durability)
2. **Set memory policy** (`maxmemory-policy allkeys-lru`)
3. **Monitor memory** (`redis-cli INFO memory`)
4. **Use Redis Sentinel** for high availability
5. **Enable authentication** (`requirepass your_password`)
6. **Set appropriate maxmemory** based on your server

### Future Enhancements

**Phase 2 (Recommended):**
- User profile caching
- API rate limiting with Redis
- Real-time notifications (Redis pub/sub)
- Booking queue management

**Phase 3 (Optional):**
- Redis cluster for horizontal scaling
- Cache warming for popular searches
- Dashboard analytics caching

---

## API Usage Examples

### User Registration

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!",
    "phone_number": "+917001467098",
    "dob": "1990-01-15",
    "aadhaar_number": "123456789012",
    "permanent_address": {
      "address": "123 Main Street",
      "state": "Maharashtra",
      "city": "Mumbai",
      "pin": "400001"
    },
    "same_as_permanent": true,
    "language": "English",
    "agreements": {
      "termsConditions": true,
      "privacyPolicy": true,
      "dataConsent": true,
      "notifications": false
    }
  }'
```

### User Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

## Development

### Running Tests

```bash
python manage.py test
```

### Database Migrations

```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

### Debug Mode

When `DEBUG=True` in `.env`, the API provides detailed error messages and debug logging. Set `DEBUG=False` for production.

### CORS Configuration

For React Native/Expo development, ensure your client's IP/port is added to `CORS_ALLOWED_ORIGINS` in `.env`:

```properties
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:8081
```

## Deployment

### Production Settings

1. Set `DEBUG=False` in `.env`
2. Use a strong `SECRET_KEY`
3. Configure proper database credentials
4. Set up static file serving
5. Configure email backend
6. Set appropriate `ALLOWED_HOSTS`

### Environment Variables

All sensitive configuration should be in `.env` file (not committed to git). See `env-example.env` for required variables.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For development support or questions, please contact the development team.

## Changelog

### v1.0.0
- Initial release
- User authentication and registration
- Profile management
- Phone and email verification
- Aadhaar integration
- Address management
- JWT authentication
