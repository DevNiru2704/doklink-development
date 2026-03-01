// utils/testConnection.ts
import apiClient from '../../config/api';

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
        message: 'Cannot connect to backend. Make sure Django server is running on http://127.0.0.1:8000' 
      };
    }
    
    return { 
      success: false, 
      message: `Connection test failed: ${error.message}` 
    };
  }
};

/**
 * Test specific API endpoints
 */
export const testAPIEndpoints = async () => {
  console.log('🔍 Testing API Endpoints...');
  
  const endpoints = [
    { name: 'SignUp', path: '/signup/' },
    { name: 'Login', path: '/login/' },
    { name: 'Profile', path: '/profile/' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint.path, {
        validateStatus: function (status: any) {
          return status < 500; // Accept 4xx errors as valid responses
        }
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status}`);
      results.push({ ...endpoint, status: response.status, success: true });
      
    } catch (error: any) {
      console.error(`❌ ${endpoint.name}: ${error.message}`);
      results.push({ ...endpoint, status: 'Error', success: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * Run complete connection test
 */
export const runCompleteTest = async () => {
  console.log('\n🚀 RUNNING COMPLETE API CONNECTION TEST');
  console.log('='.repeat(50));
  
  const results = {
    apiConnection: false,
    endpoints: [] as any[]
  };
  
  // Test 1: Basic API connection
  console.log('\n1️⃣ Testing basic API connection...');
  const connectionResult = await testBackendConnection();
  results.apiConnection = connectionResult.success;
  
  if (connectionResult.success) {
    // Test 2: API endpoints
    console.log('\n2️⃣ Testing API endpoints...');
    results.endpoints = await testAPIEndpoints();
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`API Connection: ${results.apiConnection ? '✅' : '❌'}`);
  
  if (results.endpoints.length > 0) {
    console.log(`Endpoints tested: ${results.endpoints.length}`);
    console.log(`Endpoints working: ${results.endpoints.filter(e => e.success).length}`);
  }
  
  if (results.apiConnection) {
    console.log('\n🎉 Your React Native app can connect to Django backend!');
    console.log('Ready for SignUp integration!');
    console.log('\nNext steps:');
    console.log('  1. Update SignUp.tsx handleSignUp function');
    console.log('  2. Test the signup flow');
    console.log('  3. Handle success/error responses');
  } else {
    console.log('\n⚠️ Connection issues detected. Please check:');
    console.log('  - Django server is running on http://127.0.0.1:8000');
    console.log('  - CORS is properly configured');
    console.log('  - Network connectivity');
  }
  
  return results;
};

export default {
  testBackendConnection,
  testAPIEndpoints,
  runCompleteTest
};
