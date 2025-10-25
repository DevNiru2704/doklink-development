# Payment History Implementation

## Overview
Added payment history functionality to track all payments (pending and paid) with detailed information.

## Backend Changes

### 1. Database Updates
- Added `latitude` and `longitude` fields to Hospital model for future map integration
- Migration created: `0002_hospital_latitude_hospital_longitude.py`

### 2. API Endpoints

#### Payment History Endpoint
```
GET /api/v1/healthcare/payments/history/
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Consultation Fee",
    "provider_name": "Dr. Amit Bose",
    "amount": "800.00",
    "due_date": "2025-09-15",
    "paid_date": "2025-09-15",
    "status": "paid",
    "payment_type_display": "Doctor Fee"
  },
  ...
]
```

#### Nearby Hospitals Endpoint (Backend Ready)
```
GET /api/v1/healthcare/hospitals/nearby/?latitude=22.5726&longitude=88.4324&radius=10
```

Returns hospitals within specified radius (in km) with distance calculation.

### 3. Mock Data Added

**Payment History (5 paid payments):**
1. Consultation Fee - ₹800 (Paid: Sep 15, 2025)
2. Blood Test - ₹1,500 (Paid: Sep 22, 2025)
3. Monthly Medicines - ₹3,200 (Paid: Oct 1, 2025)
4. Physiotherapy Session - ₹2,500 (Paid: Oct 10, 2025)
5. Health Insurance Premium - ₹12,500 (Paid: Aug 10, 2025)

**Upcoming Payments (3 pending):**
1. Mediclaim Premium - ₹12,500 (Due: Nov 12, 2025)
2. Hospital Bill - ₹8,450 (Due: Nov 9, 2025)
3. Insurance Renewal - ₹25,000 (Due: Nov 20, 2025)

**Hospitals with Coordinates (5 hospitals):**
1. Apollo Hospital - Kolkata (22.5726, 88.4324)
2. AMRI Hospital - Dhakuria (22.5099, 88.3629)
3. Narayana Hospital - Howrah (22.5958, 88.2636)
4. Fortis Hospital - Kolkata (22.5126, 88.3976)
5. Peerless Hospital - Kolkata (22.5204, 88.3961)

## Frontend Changes

### 1. Payment History Screen
**File:** `client/app/pages/PaymentHistory.tsx`

**Features:**
- ✅ Full payment history (paid + pending)
- ✅ Color-coded status badges with icons
  - Green (✓) - Paid
  - Yellow (⏱) - Pending
  - Red (!) - Overdue
  - Gray (✕) - Cancelled
- ✅ Shows both due date and paid date
- ✅ Payment type display
- ✅ Amount in ₹ (Indian Rupees)
- ✅ Pull-to-refresh
- ✅ Dark mode support
- ✅ Back navigation
- ✅ Empty state handling

### 2. Dashboard Updates
- Added navigation to Payment History screen
- "View Payment History" button now functional
- Uses expo-router for navigation

## Usage

### View Payment History
1. Login to the app
2. Go to Dashboard tab
3. Scroll to "Upcoming Payments" section
4. Tap "View Payment History" button
5. See all payments (paid and pending)

### API Testing
```bash
# Get payment history (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/healthcare/payments/history/

# Get nearby hospitals
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/healthcare/hospitals/nearby/?latitude=22.5726&longitude=88.4324&radius=10"
```

## Database Schema

### Payment Model Fields
- `id` - Primary key
- `user` - Foreign key to User
- `payment_type` - Type of payment (insurance, hospital bill, etc.)
- `title` - Payment title
- `provider_name` - Who to pay
- `amount` - Amount in decimal
- `due_date` - When payment is due
- `paid_date` - When payment was made (null if pending)
- `status` - pending/paid/overdue/cancelled
- `hospital` - Optional FK to Hospital
- `doctor` - Optional FK to Doctor
- `booking` - Optional FK to Booking

### Hospital Model (Updated)
- Added `latitude` (Decimal, 9 digits, 6 decimal places)
- Added `longitude` (Decimal, 9 digits, 6 decimal places)

## Statistics

For user `nirmalyamandal342`:
- Total Payments: 8
- Paid: 5 (₹20,500 total)
- Pending: 3 (₹45,950 total)
- Hospitals: 5 (with coordinates)
- Doctors: 3
- Treatments: 2
- Bookings: 3

## Future Enhancements

### Payment Features
- [ ] Payment reminders/notifications
- [ ] Export payment history (PDF/CSV)
- [ ] Filter by date range
- [ ] Filter by payment type
- [ ] Search payments
- [ ] Payment analytics/charts
- [ ] Recurring payment setup
- [ ] Payment gateway integration

### Map Features (Backend Ready)
- [ ] Google Maps integration in Search tab
- [ ] Show nearby hospitals on map
- [ ] Get directions to hospital
- [ ] Hospital details view
- [ ] Filter hospitals by specialty
- [ ] Search hospitals by name

## Testing

### Backend Tests
```bash
# Check payment counts
python manage.py shell -c "
from healthcare.models import Payment
from django.contrib.auth.models import User
u = User.objects.get(username='nirmalyamandal342')
print(f'Total: {Payment.objects.filter(user=u).count()}')
print(f'Paid: {Payment.objects.filter(user=u, status=\"paid\").count()}')
print(f'Pending: {Payment.objects.filter(user=u, status=\"pending\").count()}')
"

# Test payment history API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/healthcare/payments/history/
```

### Frontend Tests
1. Navigate to Dashboard
2. Tap "View Payment History"
3. Verify all 8 payments are shown
4. Check status colors and icons
5. Test pull-to-refresh
6. Test back navigation
7. Test in dark mode

## Troubleshooting

**Issue:** Payment history is empty
**Solution:** Run `python manage.py populate_mock_data`

**Issue:** Navigation doesn't work
**Solution:** Make sure expo-router is properly configured

**Issue:** API returns 401
**Solution:** Login first to get authentication token

**Issue:** Dates not showing correctly
**Solution:** Check date format in API response (should be YYYY-MM-DD)

## Files Modified/Created

### Backend
- ✅ `server/doklink/healthcare/models.py` - Added lat/long to Hospital
- ✅ `server/doklink/healthcare/views.py` - Added payment history endpoint
- ✅ `server/doklink/healthcare/serializers.py` - Updated Hospital serializer
- ✅ `server/doklink/healthcare/management/commands/populate_mock_data.py` - Added payment history data
- ✅ `server/doklink/healthcare/migrations/0002_hospital_latitude_hospital_longitude.py` - Migration

### Frontend
- ✅ `client/app/pages/PaymentHistory.tsx` - New payment history screen
- ✅ `client/app/(tabs)/Dashboard.tsx` - Added navigation to payment history

### Documentation
- ✅ `PAYMENT_HISTORY_IMPLEMENTATION.md` - This file

## Conclusion

Payment history functionality is fully implemented and working:
- ✅ Backend API with payment history endpoint
- ✅ Mock data with 5 paid and 3 pending payments
- ✅ Frontend screen with full payment details
- ✅ Status indicators and date tracking
- ✅ Navigation from dashboard
- ✅ Dark mode support
- ✅ Pull-to-refresh

The system is ready for production use. Hospital coordinates are also added for future map integration when needed.
