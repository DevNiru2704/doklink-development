// config/env.ts
// Single source of truth for environment-specific configuration.
// Import API_BASE_URL from here instead of defining it in each file.

export const API_BASE_URL = __DEV__
    ? 'http://10.25.246.230:8000'  // Your computer's LAN IP for Expo Go
    : 'https://your-production-domain.com';  // Production

// Alternative URLs (swap the above line when needed):
// 'http://127.0.0.1:8000'  — only works with iOS simulator
// 'http://10.0.2.2:8000'   — only works with Android emulator
// 'http://localhost:8000'   — only works with iOS simulator
