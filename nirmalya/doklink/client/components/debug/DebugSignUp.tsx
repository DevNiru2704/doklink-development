// components/DebugSignUp.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet, View } from 'react-native';
import { authService } from '../../services/authService';

export const DebugSignUp = () => {
  const [testing, setTesting] = useState(false);

  const testSignUpData = async () => {
    setTesting(true);
    
    try {
      // Create test data exactly like your form would
      const testFormValues = {
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        password: "Test123!@#",
        confirmPassword: "Test123!@#",
        dob: "01/01/1990",
        phoneNumber: "9876543210", // 10 digit number like in your form
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
        agreements: {
          termsConditions: true,
          privacyPolicy: true,
          dataConsent: true,
          notifications: false
        }
      };

      console.log('🔍 Original form values:', JSON.stringify(testFormValues, null, 2));

      // Transform data like your signup does
      const transformedData = authService.transformSignUpData(testFormValues);
      
      console.log('🔄 Transformed API data:', JSON.stringify(transformedData, null, 2));
      
      // Try the API call
      const response = await authService.signUp(transformedData);
      
      console.log('✅ SignUp successful:', response);
      
      Alert.alert(
        '✅ Success!', 
        `User created successfully!\nEmail: ${response.user.email}\nPhone: ${response.user.profile.phone_number}`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ SignUp failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = error.message || 'Unknown error';
      
      // Check for specific phone number errors
      if (error.message.includes('phone') || error.message.includes('Phone')) {
        errorMessage = `Phone Number Error: ${error.message}\n\nThis will help us debug the phone format issue.`;
      }
      
      Alert.alert(
        '❌ Debug Info',
        `Error: ${errorMessage}\n\nCheck console for detailed logs.`,
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={testSignUpData}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? '🔍 Testing SignUp...' : '🧪 Debug SignUp Data'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.description}>
        This will test signup with sample data and show detailed logs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default DebugSignUp;
