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

## 🔧 Detailed Setup Guides

### Backend Setup (Django)

#### Prerequisites
- Python 3.11+
- PostgreSQL (or SQLite for development)
- Redis (optional, for caching)

#### Installation Steps

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

# Edit .env file with your credentials
```

#### Environment Configuration (.env)

```bash
# Database Settings
DATABASE_NAME=doklink_db
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.107

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Settings (optional - defaults provided)
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Email Settings (for OTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SMS Settings (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

#### Database Migration

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Populate test data
python manage.py populate_test_hospitals
```

#### Running the Server

```bash
# Development server
python manage.py runserver 0.0.0.0:8000

# Or using the VS Code task
# Press Ctrl+Shift+P -> Tasks: Run Task -> Start Django Development Server
```

#### Redis Caching (Optional)

The backend uses Redis for caching hospital search results (30-second TTL). To enable:

```bash
# Install Redis
# Ubuntu/Debian:
sudo apt-get install redis-server
# macOS:
brew install redis

# Start Redis
redis-server

# Add to .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### Frontend Setup (React Native + Expo)

#### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your mobile device

#### Installation Steps

```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Update API configuration
# Edit config/api.ts and change the IP address to your computer's local IP
```

#### API Configuration

**Important:** You must update the API URL in `client/config/api.ts` every time your computer's IP address changes.

```typescript
// config/api.ts
const API_BASE_URL = 'http://192.168.1.107:8000/api/v1';
//                          ^^^^^^^^^^^^^^^^
//                          Replace with YOUR computer's IP address
```

To find your IP address:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **macOS/Linux:** `ifconfig` or `ip addr`

#### Running the App

```bash
# Start Expo development server
npx expo start

# Scan QR code with Expo Go app
# Make sure both devices are on the same WiFi network
```

#### Permission System

The app uses a custom permission management system. See the architecture below:

**Permission Store (Zustand):**
```typescript
// store/permissionStore.ts
{
  permissions: {
    location: 'granted' | 'denied' | 'undetermined',
    files: 'granted' | 'denied' | 'undetermined',
    camera: 'granted' | 'denied' | 'undetermined',
    notifications: 'granted' | 'denied' | 'undetermined'
  },
  hasShownPermissionScreen: boolean,
  updatePermission: (type, status) => void,
  setHasShownPermissionScreen: (shown) => void
}
```

**Permission Components:**
- `LocationPermissionComponent.tsx` - Handles location permission with fallback to manual city selection
- `FilesPermissionComponent.tsx` - Handles file/media access permissions

For detailed information, see `PERMISSION_SYSTEM_GUIDE.md` in the client folder.

#### Troubleshooting

**Cannot connect to backend:**
1. Verify IP address in `config/api.ts` matches your computer's IP
2. Ensure both devices are on the same WiFi network
3. Check Windows Firewall allows connections on port 8000
4. Try accessing `http://YOUR_IP:8000/admin/` from your phone's browser

**Expo Go crashes:**
1. Clear Expo Go cache
2. Restart development server
3. Check for TypeScript errors: `npm run type-check`

**Permission issues:**
1. Check permissions in phone settings
2. Uninstall and reinstall the app
3. Grant permissions when prompted

---

## 📧 OTP System Setup

### Gmail App Password Configuration

The OTP system supports both email and SMS. For email-based OTP, you need to configure Gmail with an app password.

#### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", select **2-Step Verification**
3. Follow the setup process if not already enabled

#### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other** as the device and name it "Doklink Backend"
4. Click **Generate**
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

#### Step 3: Configure Backend

Add to your `.env` file:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # The app password from step 2
```

#### Step 4: Test OTP System

Run the test script:

```bash
cd server/doklink
python test_otp_system.py
```

Expected output:
```
Testing OTP System...
✓ Email configuration verified
✓ Test OTP sent successfully
✓ OTP verification successful
All tests passed!
```

### SMS Configuration (Optional)

For SMS-based OTP, configure Twilio:

```bash
# Install Twilio SDK
pip install twilio

# Add to .env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### OTP Service Architecture

```python
# app_auth/otp_service.py
class OTPService:
    def generate_otp(user, method='email')  # Generate 6-digit OTP
    def verify_otp(user, otp_code)          # Verify OTP within 10 minutes
    def send_email_otp(email, otp_code)     # Send via email
    def send_sms_otp(phone, otp_code)       # Send via SMS (if configured)
```

---

## 🏥 Hospital Ranking Algorithm (Weighted Scoring)

### Overview

The emergency booking system uses a sophisticated weighted scoring algorithm to rank nearby hospitals based on multiple factors. This ensures patients are directed to the most suitable hospital for their emergency.

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 40% | Proximity to patient location |
| Bed Availability | 30% | Available beds of required type |
| Cost | 20% | Estimated emergency treatment cost |
| Insurance Match | 10% | Accepts patient's insurance |

### Distance Scoring

```python
def calculate_distance_score(distance_km):
    """
    - 0-5 km: 100 points (excellent)
    - 5-10 km: 80 points (very good)
    - 10-20 km: 60 points (good)
    - 20-50 km: 40 points (acceptable)
    - >50 km: 20 points (far)
    """
    if distance_km <= 5:
        return 100
    elif distance_km <= 10:
        return 80
    elif distance_km <= 20:
        return 60
    elif distance_km <= 50:
        return 40
    else:
        return 20
```

### Bed Availability Scoring

```python
def calculate_bed_score(available_beds):
    """
    Linear scaling: More beds = better score
    - 10+ beds: 100 points
    - 0 beds: 0 points
    """
    return min(available_beds * 10, 100)
```

### Cost Scoring

```python
def calculate_cost_score(cost):
    """
    Inverse relationship: Lower cost = better score
    - ₹0-5,000: 100 points
    - ₹5,000-10,000: 80 points
    - ₹10,000-20,000: 60 points
    - ₹20,000+: 40 points
    """
    if cost <= 5000:
        return 100
    elif cost <= 10000:
        return 80
    elif cost <= 20000:
        return 60
    else:
        return 40
```

### Insurance Scoring

```python
def calculate_insurance_score(accepts_insurance):
    """
    Binary: Accepts insurance = 100, doesn't = 0
    """
    return 100 if accepts_insurance else 0
```

### Final Score Calculation

```python
final_score = (
    distance_score * 0.40 +
    bed_score * 0.30 +
    cost_score * 0.20 +
    insurance_score * 0.10
)
```

### Example Ranking

Given 3 hospitals for an emergency 8km away:

| Hospital | Distance | Beds | Cost | Insurance | Final Score |
|----------|----------|------|------|-----------|-------------|
| Apollo | 8km (80) | 5 (50) | ₹8k (80) | Yes (100) | **74** |
| Fortis | 12km (60) | 10 (100) | ₹6k (100) | No (0) | **74** |
| AMRI | 6km (80) | 3 (30) | ₹15k (60) | Yes (100) | **71** |

**Result:** Apollo and Fortis tie at 74 points, ranked by distance (Apollo closer).

### ChatGPT's Critique & Recommendations

**Strengths:**
✓ Clear weight distribution (40-30-20-10)
✓ Distance prioritization makes sense for emergencies
✓ Simple, interpretable scoring
✓ Easy to explain to users

**Weaknesses & Improvements:**
1. **Non-linear distance penalty:** Should increase exponentially beyond 20km
2. **Cost normalization:** Use min-max normalization instead of fixed brackets
3. **Emergency type consideration:** Different weights for different emergency types
4. **Historical data:** Include success rates, wait times, specializations
5. **User preferences:** Allow customizable weights (cost vs distance priority)

**Proposed Enhancements:**
```python
# Dynamic weight adjustment based on emergency type
EMERGENCY_WEIGHTS = {
    'accident': {'distance': 0.50, 'bed': 0.30, 'cost': 0.10, 'insurance': 0.10},
    'cardiac': {'distance': 0.40, 'bed': 0.25, 'specialization': 0.20, 'cost': 0.15},
    'pregnancy': {'distance': 0.35, 'bed': 0.25, 'maternity_ward': 0.25, 'cost': 0.15},
}

# Exponential distance penalty
def calculate_distance_score_v2(distance_km):
    return max(100 - (distance_km ** 1.5), 0)

# Normalized cost scoring
def calculate_cost_score_v2(cost, min_cost, max_cost):
    normalized = (cost - min_cost) / (max_cost - min_cost)
    return (1 - normalized) * 100
```

---

## 🧪 Testing & Quality Assurance

### Test Files

All test files are located in `server/doklink/tests/`:

- `test_backend.py` - Backend API integration tests
- `test_dashboard_api.py` - Dashboard endpoint tests
- `test_audit_system.py` - Audit logging tests
- `test_otp_system.py` - OTP generation and verification tests
- `test_api_call.py` - General API call tests

### Running Tests

```bash
# Run all tests
cd server/doklink
python manage.py test

# Run specific test file
python test_otp_system.py

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
```

### Management Commands

#### Expire Reservations

Automatically expires old emergency bed reservations:

```bash
# Run manually
python manage.py expire_reservations

# Automate with cron (every 5 minutes)
*/5 * * * * cd /path/to/doklink/server/doklink && python manage.py expire_reservations >> /var/log/doklink/expire.log 2>&1
```

#### Populate Test Hospitals

```bash
python manage.py populate_test_hospitals
```

---

**Last Updated:** January 17, 2026  
**Status:** Emergency Booking System - MVP COMPLETE ✅  
**Next Phase:** Planned Admission & Doctor Appointments
