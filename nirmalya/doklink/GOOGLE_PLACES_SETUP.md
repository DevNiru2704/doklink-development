# Google Places API Setup Guide

## Step 1: Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Places API" in APIs & Services
4. Go to "Credentials" and create an API key
5. Restrict the API key to "Places API" only
6. **Important:** Add IP restrictions for your server

## Step 2: Add API Key to Backend (Secure!)

Add your API key to `server/doklink/.env`:

```env
GOOGLE_PLACES_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Note:** The API key is stored securely on the backend and never exposed to the frontend!

## Step 3: Test the Feature

1. Open the app
2. Go to "Search" tab
3. Grant location permission
4. Tap "Search Nearby Hospitals"
5. View hospitals sorted by distance

## Features Implemented

✅ Search nearby hospitals using Google Places API
✅ Sort hospitals by distance (nearest first)
✅ Show distance in km
✅ Show ratings and reviews
✅ Show open/closed status
✅ "Get Directions" button (opens Google Maps)
✅ Dark mode support
✅ Location permission handling

## API Architecture

**Secure Backend Proxy:**
```
Frontend → Backend Proxy → Google Places API
```

The frontend calls:
```
GET /api/v1/healthcare/hospitals/search_google/?latitude=X&longitude=Y&radius=5000
```

The backend:
1. Validates the request
2. Calls Google Places API with the secure API key
3. Returns the results to frontend

**Benefits:**
- ✅ API key never exposed to frontend
- ✅ Can add rate limiting on backend
- ✅ Can cache results
- ✅ Can add additional filtering/processing

## API Usage

The app uses Google Places Nearby Search API:
- Radius: 5km (5000 meters)
- Type: hospital
- Sorted by: distance

No embedded maps - just clean hospital cards!
