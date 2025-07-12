// config/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.101:8000'  // Your computer's IP for Expo Go. 
  : 'https://your-production-domain.com';  // Production
  
// Alternative URLs for different environments:
// const API_BASE_URL = 'http://127.0.0.1:8000';  // Only works with emulator/simulator
// const API_BASE_URL = 'http://10.0.2.2:8000';  // Android emulator only
// const API_BASE_URL = 'http://localhost:8000';  // iOS simulator only

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/auth`,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const access = (response.data as any).access;
          await AsyncStorage.setItem('accessToken', access);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface UserProfile {
  phone_number: string;
  date_of_birth?: string;
  profile_picture?: string;
  aadhaar_number: string;
  aadhaar_verified: boolean;
  permanent_address: Address;
  current_address: Address;
  same_as_permanent: boolean;
  preferred_language: string;
  referral_code?: string;
  terms_conditions_accepted: boolean;
  privacy_policy_accepted: boolean;
  data_consent_given: boolean;
  notifications_enabled: boolean;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id?: number;
  address: string;
  state: string;
  city: string;
  pin: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface SignUpRequest {
  // Basic User Info
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  
  // Profile Info
  phone_number: string;
  date_of_birth?: string;
  profile_picture?: string;
  aadhaar_number: string;
  
  // Address Info
  permanent_address: {
    address: string;
    state: string;
    city: string;
    pin: string;
  };
  current_address: {
    address: string;
    state: string;
    city: string;
    pin: string;
  };
  same_as_permanent: boolean;
  
  // Preferences
  preferred_language: string;
  referral_code?: string;
  
  // Agreements
  terms_conditions_accepted: boolean;
  privacy_policy_accepted: boolean;
  data_consent_given: boolean;
  notifications_enabled: boolean;
}

export interface SignUpResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  email_verification_required: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface OTPRequest {
  otp_code: string;
}

export interface OTPResponse {
  message: string;
  otp_code?: string; // For testing purposes
}

export interface VerificationStatus {
  email_verified: boolean;
  phone_verified: boolean;
  is_verified: boolean;
  aadhaar_verified: boolean;
}

// Indian States for dropdown
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Legacy API endpoints for compatibility
export const API_ENDPOINTS = {
  // Authentication
  SIGNUP: '/signup/',
  LOGIN: '/login/',
  PROFILE: '/profile/',
  
  // Email/Phone Verification
  VERIFY_EMAIL: '/verify-email/',
  VERIFY_PHONE: '/verify-phone/',
  SEND_PHONE_OTP: '/send-phone-otp/',
  CHECK_VERIFICATION_STATUS: '/check-verification-status/',
  
  // Password Reset
  RESET_PASSWORD_REQUEST: '/reset-password-request/',
  RESET_PASSWORD_CONFIRM: '/reset-password-confirm/',
};

export default apiClient;
