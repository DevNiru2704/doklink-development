# DokLink - Health Management App

React Native + Django REST API application for health management with Aadhaar verification.

## Quick Setup

### 1. Backend Setup (Django)

```bash
# Navigate to server
cd server/doklink

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
cp env-example.env .env

# Edit .env file with your credentials:
# - Database settings
# - Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
# - JWT secret key

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup (React Native + Expo)

```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Update IP address in config/api.ts (line 6)
# Change to your computer's IP address
# NOTE: You'll need to update this IP every time your computer gets a new IP address

# Start Expo development server
npx expo start
```

### 3. Cloudinary Setup

1. Create Cloudinary account
2. Create upload preset: `doklink_upload_preset` (signed mode)
3. Add credentials to backend `.env` file

### 4. Running the App

1. Start backend: `python manage.py runserver 0.0.0.0:8000`
2. Start frontend: `npx expo start`
3. Use Expo Go app to scan QR code

**Note**: If you can't connect to the backend, check that:
- Your IP address in `client/config/api.ts` matches your current computer IP
- Both devices are on the same WiFi network
- Windows Firewall allows the connection

## Features

- User authentication (JWT)
- Profile picture upload (Cloudinary)
- Aadhaar verification
- Form validation
- Dark/Light mode

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Anonymous (100/hour), Authenticated users (1000/hour)
- **CORS Protection**: Configured for cross-origin requests
- **CSRF Protection**: Django's built-in CSRF middleware enabled
- **Clickjacking Protection**: X-Frame-Options header set to DENY
- **Input Validation**: 
  - Aadhaar number format validation (12 digits)
  - PIN code validation (6 digits, no leading zero)
  - Phone number validation with country code
  - Password strength validation
- **Permission-Based Access**: IsAuthenticated/AllowAny controls
- **Cloudinary Signed Uploads**: Secure image upload with time-limited signatures
- **Data Validation**: Comprehensive form validation on frontend and backend
- **Security Headers**: XSS protection, content type sniffing prevention

## Recommended Security Enhancements

**Authentication & Authorization:**
- JWT token rotation and blacklisting
- Two-Factor Authentication (2FA/TOTP)
- Device fingerprinting and tracking
- Session management improvements

**API Security:**
- Request signing with HMAC
- API versioning and deprecation
- Enhanced rate limiting per endpoint
- Input sanitization and XSS protection
- CSRF token validation for state-changing operations
- SQL injection prevention with parameterized queries
- Content Security Policy (CSP) headers
- HTTP security headers (HSTS, X-Frame-Options)

**Data Protection:**
- Field-level encryption for sensitive data
- Database encryption at rest
- Secure storage for mobile tokens
- Certificate pinning for API calls

**Monitoring & Compliance:**
- Comprehensive audit logging
- Security event monitoring
- Suspicious activity detection
- GDPR/HIPAA compliance features
- Intrusion detection and prevention
- Vulnerability scanning and assessment
- Security incident response procedures

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Django, Django REST Framework, PostgreSQL
- **Cloud**: Cloudinary for image storage
- **Auth**: JWT tokens
