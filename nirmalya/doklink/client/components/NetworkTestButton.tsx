// components/NetworkTestButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';

export const NetworkTestButton = () => {
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    
    try {
      console.log('🧪 Testing connection to Django backend...');
      
      // Test basic connectivity to API root
      const response = await fetch('http://192.168.1.100:8000/api/v1/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      Alert.alert(
        '✅ Connection Successful!', 
        `Connected to Django backend!\n\nStatus: ${response.status}\nMessage: ${data.message}\nVersion: ${data.version}`,
        [{ text: 'OK' }]
      );
      
      console.log('✅ Connection test successful:', data);
      
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network Error: Cannot reach Django server.\n\nPossible causes:\n• Django server not running\n• Wrong IP address (192.168.1.100)\n• Firewall blocking connection\n• Not on same WiFi network';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Server might be slow or unreachable.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert(
        '❌ Connection Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={testConnection}
      disabled={testing}
    >
      <Text style={styles.buttonText}>
        {testing ? '🧪 Testing Connection...' : '🔗 Test Backend Connection'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkTestButton;
