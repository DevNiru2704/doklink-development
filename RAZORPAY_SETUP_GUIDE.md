# Razorpay Integration Setup Guide

## Overview
The payment system now uses **production Razorpay integration** with support for multiple payment methods:
- **Card** (Credit/Debit)
- **UPI** (PhonePe, GPay, Paytm, etc.)
- **Net Banking**
- **Wallets** (Paytm, PhonePe, Freecharge, etc.)

## Setup Steps

### 1. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Complete KYC verification (required for live mode)
3. Navigate to **Settings → API Keys**
4. Generate API Keys (you'll get Key ID and Key Secret)

### 2. Configure Backend (.env)

Update the following in `/server/doklink/.env`:

```bash
# Razorpay Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX      # Replace with your Key ID
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXX # Replace with your Key Secret
```

**Important:** 
- Use `rzp_test_` prefix for testing
- Use `rzp_live_` prefix for production
- **NEVER** commit the Key Secret to version control

### 3. Configure Frontend

Update `/client/config/razorpay.ts`:

```typescript
export const RAZORPAY_KEY_ID = 'rzp_live_XXXXXXXXXXXXX'; // Same as backend Key ID
```

### 4. Restart Services

```bash
# Backend
cd server/doklink
source .venv/bin/activate
python manage.py runserver

# Frontend
cd client
npm start
```

## Payment Flow

1. **User selects payment method** (All Methods/UPI Only/Card Only)
2. **Click "Pay Now"** → Backend creates Razorpay order
3. **Razorpay checkout opens** with selected payment options
4. **User completes payment** via their preferred method
5. **Payment verified** → Status updated to "Completed"

## Testing

### Test Mode (Sandbox)
1. Use test API keys (`rzp_test_`)
2. Use test card numbers from [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
3. Test UPI: Use any UPI ID with `success@razorpay` format

### Test Cards
- **Success**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Security Notes

1. ✅ **Key Secret** is only used on backend (never exposed)
2. ✅ **Payment signature** is verified on backend
3. ✅ **Order creation** happens on backend with authentication
4. ✅ **Amount tampering** is prevented by backend validation

## Features

### Payment Method Selection
- **All Methods**: Shows all available payment options (recommended)
- **UPI Only**: Direct UPI payment for faster checkout
- **Card Only**: Card-only checkout for corporate payments

### Payment Status Tracking
- **Pending**: Payment not yet initiated
- **Processing**: Payment in progress
- **Completed**: Payment successful
- **Failed**: Payment failed (can retry)

## Troubleshooting

### "Payment Failed" Error
- Check internet connection
- Verify Razorpay credentials are correct
- Ensure KYC is completed (for live mode)
- Check Django server logs for backend errors

### "Network Error"
- Verify backend server is running
- Check API_BASE_URL in `/client/config/api.ts`
- Ensure CORS is configured properly

### Payment Verification Failed
- Check backend logs for signature mismatch
- Verify Key Secret is correct in backend .env
- Ensure webhook signature verification is working

## Production Checklist

- [ ] KYC verification completed on Razorpay
- [ ] Live API keys configured in backend .env
- [ ] Live Key ID configured in frontend razorpay.ts
- [ ] Test mode disabled
- [ ] Payment webhooks configured (optional)
- [ ] SSL certificate installed on domain
- [ ] Error monitoring setup (Sentry, etc.)

## Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Support Portal](https://razorpay.com/support/)
- Email: support@razorpay.com

For integration issues, check:
- Backend logs: `server/doklink/` (Django console)
- Frontend logs: Metro bundler console
- Network tab: Chrome DevTools / React Native Debugger
