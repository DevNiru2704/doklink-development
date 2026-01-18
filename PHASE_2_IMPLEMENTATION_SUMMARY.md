# Phase 2 Implementation Progress - Patient Journey & Expense Tracking

## Overview
Implemented Phase 2 features for patient journey tracking, daily expense monitoring, and payment gateway integration as per founder requirements.

## Completed Features ✅

### 1. Backend Infrastructure

#### Models Created/Updated
- **EmergencyBooking** (Updated)
  - Added: `discharge_date`, `total_bill_amount`, `insurance_approved_amount`, `out_of_pocket_amount`
  - Purpose: Track complete financial lifecycle of admission

- **DailyExpense** (New Model)
  - Fields: admission, date, expense_type, description, amount, insurance_covered, patient_share, verified
  - 9 Expense Types: room, procedure, medicine, test, doctor_fee, nursing, equipment, therapy, miscellaneous
  - Automatic insurance/patient share calculation
  - Database: 143 dummy expense records created

- **OutOfPocketPayment** (New Model)
  - Fields: total_amount, insurance_covered, out_of_pocket, payment_status, razorpay_order_id, razorpay_payment_id, razorpay_signature
  - Payment Statuses: pending, processing, completed, failed
  - OneToOne relationship with EmergencyBooking
  - Database: 4 payment records created

#### API Endpoints
- `/api/v1/healthcare/expenses/`
  - `GET by_admission/?admission_id={id}` - Get all expenses with summary
  - `GET daily_summary/?admission_id={id}` - Group expenses by date
  - `POST` - Create new expense entry

- `/api/v1/healthcare/out-of-pocket-payments/`
  - `POST create_razorpay_order/` - Create Razorpay order (amount in paise, auto-capture)
  - `POST verify_payment/` - Verify HMAC-SHA256 signature
  - `GET by_admission/?admission_id={id}` - Get payment details

#### Serializers
- `DailyExpenseSerializer` - Validates insurance_covered + patient_share = amount
- `OutOfPocketPaymentSerializer` - Payment details with Razorpay fields
- `CreateRazorpayOrderSerializer` - Order creation with admission validation
- `VerifyRazorpayPaymentSerializer` - Payment signature verification

#### Payment Gateway Integration
- **Razorpay SDK**: Version 2.0.0 installed
- **Configuration**: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in settings
- **Security**: HMAC-SHA256 signature verification for payments
- **Flow**: create_order → collect_payment → verify_signature → update_status

#### Management Commands
- `python manage.py prepare_bookings_for_expenses` - Set bookings to admitted status
- `python manage.py populate_expense_data` - Generate realistic dummy data
  - Creates daily expenses for all admitted bookings
  - Generates 24-53 expense entries per booking (based on admission duration)
  - Calculates insurance coverage (70-90% for general, 60-80% for ICU)
  - Creates OutOfPocketPayment records automatically

#### Admin Interfaces
- `DailyExpenseAdmin` - Date hierarchy, expense_type filter, verified filter
- `OutOfPocketPaymentAdmin` - Payment_status filter, readonly timestamps

### 2. Frontend Dashboard Redesign

#### Dashboard.tsx - Completely Redesigned
**Removed:**
- Upcoming Bookings section
- Ongoing Treatments section
- Upcoming Payments section

**Added:**
- **Patient Journey Section** with timeline visualization
- **Admission Summary Card**:
  - Hospital name and bed type (ICU/General Ward)
  - Admission and discharge dates
  - Status badge (Completed)
  - Financial summary (Total Bill, Insurance Covered, Out-of-Pocket)

- **Daily Expense Timeline**:
  - Vertical timeline with connector dots and lines
  - Day-by-day expense breakdown (Day 1, Day 2, etc.)
  - Each day shows:
    - Date (e.g., "Jan 15")
    - Total amount for the day
    - Number of expenses
    - Insurance covered amount (green)
    - Patient share amount (orange)
  
- **Empty State**: Shows when no admissions exist
- **View Booking History** button with arrow icon

#### Data Integration
- Fetches most recent discharged booking
- Calls `/healthcare/expenses/daily_summary/` API
- Displays real expense data with proper formatting
- Supports dark mode theming

## Database Statistics
```
Total Bookings: 6
  - Admitted/Discharged: 4
  - Cancelled: 2

Total Expenses: 143 entries
  - Booking #5: 53 expenses, ₹320,628.60 (7 days)
  - Booking #4: 29 expenses, ₹103,968.67 (5 days)
  - Booking #3: 24 expenses, ₹84,314.07 (4 days)
  - Booking #2: 37 expenses, ₹126,817.54 (6 days)

Total Payments: 4 (all pending)
  - Average out-of-pocket: ₹39,733 (25% of total bill)
  - Average insurance coverage: 75%
```

## Sample Data Structure

### Daily Expense Example
```json
{
  "date": "2026-01-11",
  "expense_type": "room",
  "description": "Day 1: Room charges",
  "amount": "13639.48",
  "insurance_covered": "10147.85",
  "patient_share": "3491.63",
  "verified": true
}
```

### Daily Summary Example
```json
{
  "date": "2026-01-11",
  "total_amount": 25849.48,
  "total_insurance_covered": 19135.28,
  "total_patient_share": 6714.20,
  "expense_count": 8
}
```

## Pending Tasks (Next Steps) ⚠️

### 1. Update Booking History Screen
- Remove status filter buttons (All, Reserved, Arrived, etc.)
- Show only past bookings (status='discharged')
- Add columns: Hospital Name, Admission Date, Discharge Date, Duration, Total Cost
- Display admission duration calculation
- Fetch from `/healthcare/emergency/bookings/?status=discharged`

### 2. Create Payment Settlement Screen
File: `client/app/pages/PaymentSettlement.tsx` (NEW)
- Display settled amount (insurance_approved_amount) with checkmark
- Display pending amount (out_of_pocket_amount) with warning
- Breakdown section: Total Bill, Insurance Covered, Your Responsibility
- **Pay Now** button integration with Razorpay
- Payment flow:
  1. Call `/out-of-pocket-payments/create_razorpay_order/`
  2. Open Razorpay checkout modal
  3. On success → Call `/verify_payment/` with signature
  4. Update UI with payment success/failure
- Show payment history (date, amount, status, transaction ID)

### 3. Install Razorpay in React Native Frontend
```bash
cd client
npm install @razorpay/react-native-razorpay
```
- Create `client/services/razorpayService.ts`
- Configure Razorpay key from API response
- Handle payment callbacks (success/failure)
- Update admission status after successful payment

### 4. Add Razorpay Credentials to .env
```bash
# Test credentials for development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyy
```
Get test credentials from: https://dashboard.razorpay.com/app/keys

## Testing Checklist

### Backend Testing
- [x] Migration applied successfully (0011_emergencybooking_discharge_date_and_more)
- [x] DailyExpense model created with 9 expense types
- [x] OutOfPocketPayment model created with Razorpay fields
- [x] Dummy data populated (143 expenses across 4 bookings)
- [x] API endpoints registered and accessible
- [x] Admin interfaces showing data correctly
- [ ] Test Razorpay order creation (requires test credentials)
- [ ] Test payment verification flow

### Frontend Testing
- [x] Dashboard shows Patient Journey timeline
- [x] Daily expenses displayed with correct formatting
- [x] Financial summary shows total/insurance/out-of-pocket
- [x] Dark mode support working
- [x] Empty state displays when no admissions
- [ ] Test API integration with live data
- [ ] Test on iOS device
- [ ] Test on Android device

## Files Modified (Current Session)

### Backend Files (11 files)
1. `server/doklink/healthcare/models.py` - Added 2 models, updated 1 model
2. `server/doklink/healthcare/serializers.py` - Added 4 serializers
3. `server/doklink/healthcare/views.py` - Added 2 viewsets with 5 custom actions
4. `server/doklink/healthcare/urls.py` - Registered 2 new endpoints
5. `server/doklink/healthcare/admin.py` - Added 2 admin classes
6. `server/doklink/healthcare/migrations/0011_emergencybooking_discharge_date_and_more.py` - Created
7. `server/doklink/doklink/settings.py` - Added Razorpay configuration
8. `server/doklink/env-example.env` - Added Razorpay template
9. `server/doklink/healthcare/management/commands/populate_expense_data.py` - Created
10. `server/doklink/healthcare/management/commands/prepare_bookings_for_expenses.py` - Created
11. `server/doklink/requirements.txt` - (razorpay==2.0.0 installed via pip)

### Frontend Files (1 file)
1. `client/app/(tabs)/Dashboard.tsx` - Complete redesign with Patient Journey timeline

## Technical Decisions

### Why OneToOneField for OutOfPocketPayment?
- Each admission should have only one final payment settlement
- Prevents duplicate payment records
- Simplifies payment tracking and retrieval

### Why 75% Insurance Coverage?
- Industry standard for most health insurance policies in India
- Provides realistic financial projections
- Can be adjusted per admission based on insurance policy

### Why HMAC-SHA256 for Signature Verification?
- Razorpay's standard verification method
- Ensures payment authenticity
- Prevents tampering with payment responses

### Why Daily Summary Endpoint?
- Reduces frontend processing load
- Database-level aggregation is more efficient
- Provides consistent data format for timeline visualization

## API Response Examples

### Daily Summary Response
```json
[
  {
    "date": "2026-01-11",
    "total_amount": 25849.48,
    "total_insurance_covered": 19135.28,
    "total_patient_share": 6714.20,
    "expense_count": 8
  },
  {
    "date": "2026-01-12",
    "total_amount": 42128.63,
    "total_insurance_covered": 31248.12,
    "total_patient_share": 10880.51,
    "expense_count": 7
  }
]
```

### Create Razorpay Order Response
```json
{
  "order_id": "order_NdxxxxxxxxxxxX",
  "key_id": "rzp_test_xxxxxxxxxxxxxxxx",
  "amount": 8015715,
  "currency": "INR"
}
```

### Verify Payment Response
```json
{
  "id": 1,
  "admission": 5,
  "total_amount": "80157.15",
  "insurance_covered": "60117.86",
  "out_of_pocket": "20039.29",
  "payment_status": "completed",
  "razorpay_order_id": "order_NdxxxxxxxxxxxX",
  "razorpay_payment_id": "pay_NdxxxxxxxxxxxX",
  "razorpay_signature": "abcdef1234567890...",
  "payment_date": "2026-01-18T10:30:45.123456Z"
}
```

## Security Considerations

1. **Payment Verification**: Always verify Razorpay signature on server-side
2. **User Authorization**: All endpoints check `admission.user == request.user`
3. **Admission Validation**: Can only create payment order for discharged admissions
4. **Amount Conversion**: Frontend displays in rupees, backend stores in paise
5. **Sensitive Data**: Razorpay keys stored in environment variables

## Next Session Priorities

1. **High Priority**: Update Booking History screen (required for navigation flow)
2. **High Priority**: Create Payment Settlement screen with Razorpay integration
3. **Medium Priority**: Add Razorpay test credentials to .env
4. **Medium Priority**: Install Razorpay SDK in React Native
5. **Low Priority**: Add unit tests for payment verification logic

---

**Last Updated**: January 18, 2026
**Phase**: 2 (Patient Journey & Payments)
**Status**: Backend Complete, Dashboard Complete, History & Payment screens Pending
