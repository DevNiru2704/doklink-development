# Quick Start Guide - DokLink Dashboard

## 🚀 Get Started in 5 Minutes

### Step 1: Start PostgreSQL
```bash
sudo systemctl start postgresql
```

### Step 2: Start Django Backend
```bash
cd server/doklink
source .venv/bin/activate  # or .venv/bin/activate on Linux/Mac
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Start React Native Frontend
```bash
cd client
npx expo start
```

### Step 4: Login
Use the test credentials:
- **Username:** `testuser`
- **Password:** `testpass123`

## 📱 What You'll See

### Dashboard Tab
- **Upcoming Bookings:** Your scheduled appointments and hospital beds
- **Ongoing Treatments:** Active medical treatments
- **Upcoming Payments:** Bills and insurance premiums due

### Search Tab
- Coming soon - search for doctors, hospitals, treatments

### My Space Tab
- Your profile information
- Settings and preferences
- Logout option

## 🔧 Troubleshooting

### Backend not starting?
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Apply migrations if needed
python manage.py migrate

# Create mock data if empty
python manage.py populate_mock_data
```

### Frontend can't connect?
1. Update `client/config/api.ts` with your computer's IP:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP:8000';
   ```
2. Find your IP: `ip addr show` (Linux) or `ipconfig` (Windows)
3. Make sure both devices are on the same network

### No data showing?
```bash
# Populate mock data
cd server/doklink
python manage.py populate_mock_data
```

## 📊 API Endpoints

Test the API directly:
```bash
# Get dashboard data (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/healthcare/dashboard/

# List all endpoints
curl http://localhost:8000/api/v1/
```

## 🎯 Next Steps

1. **Customize the data:** Edit `healthcare/management/commands/populate_mock_data.py`
2. **Add more features:** Check `DASHBOARD_IMPLEMENTATION.md` for architecture details
3. **Deploy:** Follow Django and Expo deployment guides

## 📚 Documentation

- Full implementation details: `DASHBOARD_IMPLEMENTATION.md`
- Backend models: `server/doklink/healthcare/models.py`
- Frontend screens: `client/app/(tabs)/`

## 🐛 Common Issues

**Issue:** "Module not found: django"
**Solution:** Activate virtual environment first

**Issue:** "Connection refused"
**Solution:** Check if backend is running on correct port (8000)

**Issue:** "Authentication failed"
**Solution:** Login first to get access token

**Issue:** "No data in dashboard"
**Solution:** Run `python manage.py populate_mock_data`

## 💡 Tips

- Use **pull-to-refresh** on dashboard to reload data
- Toggle **dark mode** in your device settings
- Check **console logs** for debugging
- Use **Expo Go** app for testing on real devices

## 🎨 Customization

### Change colors:
Edit `client/app/(tabs)/Dashboard.tsx` - look for color codes like `#3b82f6`

### Add more mock data:
Edit `server/doklink/healthcare/management/commands/populate_mock_data.py`

### Modify API response:
Edit `server/doklink/healthcare/views.py` - `DashboardViewSet.summary()`

---

**Need help?** Check the full documentation in `DASHBOARD_IMPLEMENTATION.md`
