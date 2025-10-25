# Hospital Search Implementation - Secure Backend Proxy

## Overview
Implemented secure hospital search using Google Places API with backend proxy to protect API keys.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│  Google Places   │
│  (Search)   │      │   (Proxy)   │      │      API         │
└─────────────┘      └─────────────┘      └──────────────────┘
                           │
                           ▼
                     API Key (Secure)
```

## Security Features

✅ **API Key Protection**
- API key stored in backend `.env` file
- Never exposed to frontend/client
- Can add IP restrictions on Google Cloud

✅ **Backend Validation**
- Validates latitude/longitude
- Checks authentication
- Handles errors gracefully

✅ **Rate Limiting Ready**
- Can add rate limiting on backend
- Can cache results to reduce API calls

## Implementation Details

### Backend (Django)

**File:** `server/doklink/healthcare/views.py`

**Endpoint:**
```python
GET /api/v1/healthcare/hospitals/search_google/
```

**Parameters:**
- `latitude` (required) - User's latitude
- `longitude` (required) - User's longitude  
- `radius` (optional) - Search radius in meters (default: 5000)

**Response:**
```json
{
  "status": "OK",
  "results": [
    {
      "place_id": "...",
      "name": "Hospital Name",
      "vicinity": "Address",
      "geometry": {
        "location": {
          "lat": 22.5726,
          "lng": 88.4324
        }
      },
      "rating": 4.5,
      "user_ratings_total": 100,
      "opening_hours": {
        "open_now": true
      }
    }
  ]
}
```

### Frontend (React Native)

**File:** `client/app/(tabs)/Search.tsx`

**Features:**
- Location permission handling
- Calls backend proxy endpoint
- Calculates distance using Haversine formula
- Sorts hospitals by distance
- Displays as cards (no embedded map)

**Hospital Card Shows:**
- Hospital name
- Address
- Distance (km)
- Rating & reviews
- Open/Closed status
- "Get Directions" button

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable "Places API"
4. Create API key
5. Restrict to "Places API" only
6. Add IP restrictions for your server

### 2. Add to Backend

Edit `server/doklink/.env`:
```env
GOOGLE_PLACES_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### 3. Restart Django Server

```bash
cd server/doklink
.venv/bin/python manage.py runserver
```

### 4. Test

1. Open app
2. Go to Search tab
3. Grant location permission
4. Tap "Search Nearby Hospitals"
5. View results sorted by distance

## API Endpoints

### Search Google Places (Proxy)
```
GET /api/v1/healthcare/hospitals/search_google/
  ?latitude=22.5726
  &longitude=88.4324
  &radius=5000
```

### Search Local Database
```
GET /api/v1/healthcare/hospitals/nearby/
  ?latitude=22.5726
  &longitude=88.4324
  &radius=10
```

## Error Handling

**Backend Errors:**
- Missing API key → 500 error
- Invalid coordinates → 400 error
- Google API error → Returns error message
- Network timeout → 500 error

**Frontend Errors:**
- No location permission → Shows enable button
- API error → Shows alert with message
- Network error → Shows connection error

## Testing

### Test Backend Endpoint
```bash
# Get auth token first
TOKEN="your_jwt_token"

# Test search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/healthcare/hospitals/search_google/?latitude=22.5726&longitude=88.4324&radius=5000"
```

### Test Frontend
1. Login to app
2. Go to Search tab
3. Grant location permission
4. Tap search button
5. Verify hospitals appear sorted by distance

## Performance Optimization

### Current Implementation
- Direct API call to Google Places
- Distance calculated on frontend
- Results sorted by distance

### Future Improvements
- [ ] Cache results on backend (Redis)
- [ ] Rate limiting per user
- [ ] Batch requests
- [ ] Add pagination
- [ ] Store frequently searched hospitals in DB

## Cost Optimization

**Google Places API Pricing:**
- Nearby Search: $32 per 1000 requests
- Free tier: $200 credit/month

**Optimization Strategies:**
1. Cache results for 1 hour
2. Limit radius to 5km
3. Rate limit to 10 searches/hour per user
4. Store popular hospitals in local DB

## Files Modified

### Backend
- ✅ `server/doklink/.env` - Added API key
- ✅ `server/doklink/doklink/settings.py` - Added config
- ✅ `server/doklink/healthcare/views.py` - Added proxy endpoint

### Frontend
- ✅ `client/app/(tabs)/Search.tsx` - Updated to use backend proxy

### Documentation
- ✅ `GOOGLE_PLACES_SETUP.md` - Setup guide
- ✅ `SEARCH_IMPLEMENTATION.md` - This file

## Security Checklist

- ✅ API key in `.env` file (not in code)
- ✅ `.env` in `.gitignore`
- ✅ Backend validates all inputs
- ✅ Authentication required for endpoint
- ✅ Error messages don't expose sensitive info
- ✅ Can add IP restrictions on Google Cloud
- ✅ Can add rate limiting

## Troubleshooting

**Issue:** "Google Places API key not configured"
**Solution:** Add `GOOGLE_PLACES_API_KEY` to `.env` file

**Issue:** "Failed to fetch hospitals"
**Solution:** Check internet connection and API key validity

**Issue:** No results returned
**Solution:** Try increasing radius or check if location is correct

**Issue:** "Location Required"
**Solution:** Grant location permission in app settings

## Conclusion

Hospital search is now fully implemented with:
- ✅ Secure backend proxy (API key protected)
- ✅ Google Places API integration
- ✅ Distance calculation and sorting
- ✅ Clean card-based UI (no embedded maps)
- ✅ Location permission handling
- ✅ Error handling
- ✅ Dark mode support

Just add your Google Places API key to the backend `.env` file and you're ready to go!
