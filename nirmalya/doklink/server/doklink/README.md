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
