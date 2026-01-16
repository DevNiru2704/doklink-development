# 🏥 DokLink - Emergency Healthcare Platform

**React Native + Django REST API** application for emergency healthcare management with real-time bed booking, patient profiles, and Aadhaar verification.

## 📋 Table of Contents
- [Features](#-features)
- [Emergency Booking System](#-emergency-booking-system)
- [Quick Setup](#-quick-setup)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Security](#-security)
- [Tech Stack](#-tech-stack)
- [Project Status](#-project-status)

---

## 🎯 Features

### ✅ Implemented Features

#### **1. Emergency Bed Booking System** (COMPLETE)
- 🚨 **Real-time Emergency Trigger** - Find nearby hospitals instantly
- 🏥 **Bed Availability Tracking** - Live general & ICU bed counts with auto-updates
- 📍 **Dynamic Location Search** - Adjustable radius (5-200km) with distance calculation
- ⏱️ **Dynamic Reservation Time** - 30min to 3h 45min based on distance (1.5x travel time)
- 🔄 **Multi-select Emergency Types** - Choose multiple conditions (Chest Pain, Difficulty Breathing, etc.)
- 🛏️ **Bed Type Selection** - Choose between General or ICU beds
- 📊 **9 Emergency Types** - Accident, Cardiac, Stroke, Respiratory, Pregnancy, Poisoning, Burns, Pediatric, Other
- 💳 **Insurance Display** - Show accepted insurance providers
- 💰 **Cost Estimates** - Emergency and general admission costs
- 📱 **Status Tracking** - Reserved → Patient On Way → Arrived → Admitted
- ⏰ **Live Countdown Timer** - Real-time reservation expiry tracking
- 📞 **Required Contact Fields** - Emergency contact person details (validated)
- 📍 **Call Hospital / Get Directions** - Direct integration with phone & maps
- 📋 **Booking History** - Filter by status with detailed view
- 🔔 **Active Booking Banner** - Dashboard notification for active emergency
- 🔄 **Automatic Bed Management** - Decrements on booking, releases on cancel/admit/expire
- 🛡️ **Race Condition Protection** - Prevents negative bed counts
- ⚡ **Expiration Management** - Auto-expire and release beds via management command

#### **2. User Authentication & Profile**
- 🔐 JWT token-based authentication
- 📱 OTP verification (email/phone)
- 🔑 Password reset functionality
- 👤 User profile management
- 🪪 Aadhaar verification
- 🖼️ Cloudinary profile picture upload
- 📊 Login audit system

#### **3. Healthcare Management**
- 🏥 Hospital directory
- 👨‍⚕️ Doctor listings
- 💊 Treatment tracking
- 📅 Booking management
- 💵 Payment tracking
- 📊 Dashboard with summary stats

### 🚧 In Development
- Planned admission booking
- Doctor appointment booking
- Hospital dashboard (web - handled by team)

---

## 🚨 Emergency Booking System

### How It Works

**User Flow:**
```
1. User taps EMERGENCY button
2. App requests location permission
3. System finds nearby hospitals (adjustable radius: 5-200km)
4. User sees hospitals sorted by distance with:
   - Available beds (General/ICU)
   - Insurance acceptance
   - Estimated cost
   - Travel time
5. User selects hospital and fills details:
   - Emergency type(s) - multi-select
   - Bed type (General/ICU)
   - Patient condition (optional)
   - Contact person (required)
   - Contact phone (required)
6. Bed reserved dynamically (30min - 3h 45min based on distance)
7. Real-time countdown timer displayed
8. User updates status: On Way → Arrived → Admitted
9. View booking history with status filters
```

**Backend Features:**
- Automatic bed count decrement on booking
- Automatic bed release on cancellation, admission, or expiration
- Distance calculation using Haversine formula
- Dynamic reservation time: max(30min, estimated_arrival × 1.5)
- Race condition protection for bed allocation
- Management command for auto-expiration (`expire_reservations`)
- Database constraints prevent negative bed counts

**Test Hospitals (Kolkata & Durgapur Area):**
1. **Apollo Gleneagles Kolkata** - 18 general beds, 5 ICU beds available
2. **AMRI Salt Lake** - 14 general beds, 4 ICU beds available
3. **Fortis Anandapur** - 22 general beds, 7 ICU beds available
4. **AIIMS Durgapur** - 30 general beds, 8 ICU beds available
5. **Durgapur Steel Plant Hospital** - 25 general beds, 6 ICU beds available

---

---

## 🏗️ Architecture

### System Overview
```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   MOBILE CLIENT  │ ◄─────► │   DJANGO API     │ ◄─────► │   POSTGRESQL DB  │
│  React Native +  │  HTTPS  │ REST Framework   │  ORM    │  Healthcare Data │
│      Expo        │         │   JWT Auth       │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

### Database Models

**Hospital Model** (Extended)
- Basic info: name, address, city, coordinates
- Bed tracking: total_general_beds, available_general_beds, total_icu_beds, available_icu_beds
- Insurance: accepts_insurance, insurance_providers
- Costs: estimated_emergency_cost, estimated_general_admission_cost

**EmergencyBooking Model** (New)
- User & Hospital relationship
- Emergency details: type (9 options), bed_type, patient_condition
- Contact: contact_person, contact_phone
- Status tracking: reserved/patient_on_way/arrived/admitted/cancelled/expired
- Location: booking_latitude, booking_longitude
- Timing: reservation_expires_at, arrival_time, admission_time

### Frontend Structure
```
client/
├── app/
│   ├── (tabs)/
│   │   ├── Home.tsx                    # Emergency landing screen
│   │   ├── Dashboard.tsx               # User dashboard
│   │   ├── Search.tsx                  # Search hospitals/doctors
│   │   └── MySpace.tsx                 # User profile
│   ├── pages/
│   │   ├── HospitalSelection.tsx       # List nearby hospitals
│   │   ├── BookingDetails.tsx          # Emergency booking form
│   │   ├── HospitalDetails.tsx         # Hospital info (placeholder)
│   │   ├── Login.tsx                   # Authentication
│   │   └── SignUp.tsx                  # Registration
│   └── index.tsx                       # Entry point
├── services/
│   ├── emergencyService.ts             # Emergency API integration
│   └── authService.ts                  # Auth API integration
├── utils/
│   └── emergency/
│       └── types.ts                    # TypeScript definitions
└── config/
    └── api.ts                          # API configuration
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login/` - User login (JWT tokens)
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/otp/verify/` - OTP verification
- `POST /api/v1/auth/password/reset/` - Password reset

### Emergency Booking
- `POST /api/v1/healthcare/emergency/trigger/` - Trigger emergency, get nearby hospitals
- `GET /api/v1/healthcare/emergency/hospitals/nearby/` - Search hospitals by location (with radius param)
- `POST /api/v1/healthcare/emergency/book-bed/` - Book emergency bed (supports multi-type, bed selection)
- `GET /api/v1/healthcare/emergency/booking/{id}/` - Get booking details
- `PUT /api/v1/healthcare/emergency/booking/{id}/status/` - Update booking status (arrived/admitted/cancelled/expired)
- `GET /api/v1/healthcare/emergency/active/` - Get user's active booking
- `GET /api/v1/healthcare/emergency/bookings/` - Get all user's emergency bookings (booking history)

### Healthcare Management
- `GET /api/v1/healthcare/hospitals/` - List all hospitals
- `GET /api/v1/healthcare/doctors/` - List all doctors
- `GET /api/v1/healthcare/treatments/` - User's treatments (CRUD)
- `GET /api/v1/healthcare/bookings/` - User's bookings (CRUD)
- `GET /api/v1/healthcare/payments/` - User's payments (CRUD)
- `GET /api/v1/healthcare/dashboard/summary/` - Dashboard statistics

---

## 🧪 Testing

### Test Account Credentials
```
Phone: 7001467098 (or +917001467098)
Password: Nirmalya1#
```

### Quick API Test (Emergency Trigger)

**1. Get JWT Token:**
```bash
curl -X POST http://192.168.1.107:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+917001467098", "password": "Nirmalya1#"}'
```

**2. Trigger Emergency:**
```bash
curl -X POST http://192.168.1.107:8000/api/v1/healthcare/emergency/trigger/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"latitude": 22.5726, "longitude": 88.3639}'
```

**3. Book Emergency Bed:**
```bash
curl -X POST http://192.168.1.107:8000/api/v1/healthcare/emergency/book-bed/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "hospital_id": 1,
    "emergency_type": "accident",
    "bed_type": "general",
    "patient_condition": "Minor head injury",
    "contact_person": "John Doe",
    "contact_phone": "+919876543210",
    "latitude": 22.5726,
    "longitude": 88.3639
  }'
```

### Test Locations (Kolkata)
- **Central Kolkata (Esplanade):** `22.5726, 88.3639`
- **Salt Lake Sector V:** `22.5744, 88.4267`
- **Howrah Station:** `22.5833, 88.3421`
- **Park Street:** `22.5524, 88.3525`

### Management Commands
```bash
# Populate test hospitals
python manage.py populate_test_hospitals

# Expire old reservations (run every 5-10 minutes in production)
python manage.py expire_reservations

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

#### Automated Bed Expiration

For production, set up automated expiration of old reservations:

**Option 1: Cron Job (Linux/macOS)**
```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * cd /path/to/doklink/server/doklink && /path/to/python manage.py expire_reservations >> /var/log/doklink/expire_reservations.log 2>&1
```

**Option 2: Task Scheduler (Celery Beat)**
```python
# In celery.py
from celery import shared_task
from django.core.management import call_command

@shared_task
def expire_old_reservations():
    call_command('expire_reservations')

app.conf.beat_schedule = {
    'expire-reservations-every-5-minutes': {
        'task': 'healthcare.tasks.expire_old_reservations',
        'schedule': 300.0,  # 5 minutes
    },
}
```

**What it does:**
- Finds reservations with status `reserved` or `patient_on_way` that have passed their expiration time
- Updates status to `expired`
- Releases the bed back to hospital inventory
- Logs each expired booking for monitoring

---

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

---

## 🔐 Security Features

**Authentication & Authorization:**
- JWT token-based authentication with rotation
- Rate limiting: Anonymous (100/hour), Authenticated (1000/hour)
- Permission-based access control (IsAuthenticated/AllowAny)

**API Security:**
- CORS protection configured for cross-origin requests
- CSRF protection via Django middleware
- Input validation (Aadhaar, PIN code, phone numbers)
- Parameterized queries for SQL injection prevention
- XSS protection headers

**Data Protection:**
- Cloudinary signed uploads (time-limited signatures)
- Password strength validation
- Secure token storage
- Clickjacking protection (X-Frame-Options: DENY)

**Recommended Enhancements:**
- Two-Factor Authentication (2FA/TOTP)
- Device fingerprinting
- Enhanced rate limiting per endpoint
- Field-level encryption for sensitive data
- Certificate pinning for API calls
- Comprehensive audit logging
- GDPR/HIPAA compliance features

---

## 💻 Tech Stack

**Frontend:**
- React Native 0.79.5
- Expo 53
- TypeScript
- Axios (API client)
- AsyncStorage (local data)
- Expo Router (navigation)
- Expo Location (GPS services)

**Backend:**
- Django 5.2.4
- Django REST Framework
- PostgreSQL (production) / SQLite (dev)
- Redis (caching support)
- JWT Authentication (simplejwt)
- Phonenumber field validation

**Cloud Services:**
- Cloudinary (image storage)

---

## 📊 Project Status

### ✅ Completed (100%)
**Emergency Bed Booking System - MVP COMPLETE**
- Backend: 7 API endpoints, 2 database models, distance calculation, bed management
- Frontend: 5 screens (Home, Hospital Selection, Booking Details, Active Booking, Booking History)
- Features: 
  - Multi-select emergency types
  - General/ICU bed selection
  - Dynamic radius control (5-200km)
  - Dynamic reservation time (30min - 3h 45min)
  - Real-time countdown timer
  - Status tracking with "I've Arrived" button
  - Booking history with filters
  - Active booking dashboard banner
  - Automatic bed count management
  - Race condition protection
  - Auto-expiration system
- Test Data: 16 hospitals (9 Kolkata + 4 Durgapur/Asansol + 3 others)

### 🚧 In Progress (0%)
- Planned admission booking
- Doctor appointment booking
- Hospital dashboard (web - handled by team)

### 📅 Planned
- Doctor appointment booking
- Treatment tracking enhancement
- Payment integration
- Push notifications
- Multi-language support

### Code Statistics
- **Total Files Modified/Created:** 19
- **Total Lines of Code:** ~2,330
  - Backend: ~680 lines
  - Frontend: ~1,050 lines
  - Documentation: ~600 lines

---

## 📁 Project Structure

```
doklink-development/
├── client/                          # React Native mobile app
│   ├── app/                        # Screens and navigation
│   ├── components/                 # Reusable components
│   ├── services/                   # API integration
│   ├── utils/                      # Utilities and types
│   ├── config/                     # Configuration files
│   └── package.json
│
├── server/doklink/                 # Django backend
│   ├── app_auth/                   # Authentication module
│   ├── healthcare/                 # Healthcare module
│   │   ├── models.py              # Database models
│   │   ├── serializers.py         # API serializers
│   │   ├── views.py               # API endpoints
│   │   ├── urls.py                # URL routing
│   │   └── management/            # Management commands
│   ├── doklink/                    # Project settings
│   ├── manage.py
│   └── requirements.txt
│
├── development-files/              # Documentation & planning
│   ├── checklist.md               # MVP implementation checklist
│   ├── Doklink FF.md              # Feature specifications
│   └── Doklink MVP Features.md    # MVP feature list
│
└── README.md                       # This file
```

---

## 🚀 Next Steps

### For Developers

**To continue development:**

1. **Complete Emergency Flow** (1 week)
   - Active booking screen with countdown timer
   - Booking history screen
   - Planned admission booking

2. **Patient Profile Enhancement** (1 week)
   - Medical history form
   - Allergies and medications tracking
   - Insurance card management

3. **Testing & Polish** (1 week)
   - End-to-end testing
   - UI/UX improvements
   - Error handling enhancement

**To deploy:**

1. **Backend Deployment**
   - Setup AWS EC2 or DigitalOcean
   - Configure PostgreSQL production database
   - Setup Nginx + Gunicorn
   - Configure SSL certificate
   - Setup monitoring and logging

2. **Mobile App Deployment**
   - Build Android APK with Expo EAS
   - Test on real devices
   - Prepare for Play Store submission

---

## 📞 Support

For questions or issues:
1. Check existing documentation in `development-files/`
2. Review detailed guides:
   - `EMERGENCY_API_TESTING.md` - API testing guide
   - `ARCHITECTURE.md` - System architecture
   - `PROJECT_STATUS.md` - Detailed project status

---

## 📄 License

[Add your license here]

---

**Last Updated:** January 17, 2026  
**Status:** Emergency Booking System - MVP COMPLETE ✅  
**Next Phase:** Planned Admission & Doctor Appointments

- Both devices are on the same WiFi network
- Windows Firewall allows the connection

## Features

- User authentication (JWT)
- Profile picture upload (Cloudinary)
- Aadhaar verification
- Form validation
- Dark/Light mode

---

## ⚡ Quick Setup

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
