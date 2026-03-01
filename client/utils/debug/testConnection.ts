// utils/testConnection.ts
import apiClient from '../../config/api';
import { authService } from '../../services/authService';

/**
 * Test function to verify backend connection
 * Call this from your app to test the API connection
 */
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Testing backend connection to http://127.0.0.1:8000...');
    
    // Test basic connectivity by trying to access signup endpoint
    const response = await apiClient.get('/signup/', {
      validateStatus: function (status) {
        // Accept any status code for this test (even 405 Method Not Allowed is fine)
        return status < 500;
      }
    });
    
    console.log('✅ Backend is reachable!');
    console.log(`Status: ${response.status}`);
    console.log(`Base URL: ${apiClient.defaults.baseURL}`);
    
    return { 
      success: true, 
      message: 'Backend connection successful',
      status: response.status,
      url: apiClient.defaults.baseURL
    };
    
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    
    if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
      return { 
        success: false, 
        message: 'Cannot connect to backend. Make sure Django server is running on the correct port.' 
      };
    }
    
    return { 
      success: false, 
      message: `Connection test failed: ${error.message}` 
    };
  }
};

/**
 * Test the complete signup flow with sample data
 * Use this to verify the entire signup process works
 */
export const testSignUpFlow = async () => {
  const testData = {
    name: "Test User",
    email: `test${Date.now()}@example.com`, // Unique email
    username: `testuser${Date.now()}`,
    password: "TestPass123!",
    confirmPassword: "TestPass123!",
    dob: "1990-01-01",
    phoneNumber: "9876543210",
    aadhaarNumber: "234567890123",
    permanentAddress: {
      address: "123 Test Street",
      state: "Maharashtra",
      city: "Mumbai",
      pin: "400001"
    },
    currentAddress: {
      address: "123 Test Street",
      state: "Maharashtra", 
      city: "Mumbai",
      pin: "400001"
    },
    sameAsPermanent: true,
    language: "English",
    referralCode: "",
    termsConditions: true,
    privacyPolicy: true,
    dataConsent: true,
    notifications: false
  };

  try {
    console.log('🧪 Testing signup flow with sample data...');
    
    const response = await authService.signUp(authService.transformSignUpData(testData));
    
    console.log('✅ Signup test successful:', response.message);
    console.log('👤 Created user:', response.user.email);
    
    // Clean up: you might want to delete the test user
    // await authService.logout();
    
    return { success: true, data: response };
    
  } catch (error: any) {
    console.error('❌ Signup test failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default { testBackendConnection, testSignUpFlow };
