// components/ConnectionTestButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { testBackendConnection, runCompleteTest } from '../../utils/debug/connectionTest';

interface ConnectionTestButtonProps {
  style?: any;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({ style }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      const result = await testBackendConnection();
      
      if (result.success) {
        setLastResult('✅ Connected');
        Alert.alert(
          'Connection Successful! 🎉',
          `Your app can connect to the Django backend!\n\nStatus: ${result.status}\nURL: ${result.url}`,
          [{ text: 'Great!' }]
        );
      } else {
        setLastResult('❌ Failed');
        Alert.alert(
          'Connection Failed',
          result.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setLastResult('❌ Error');
      Alert.alert(
        'Test Error',
        error.message || 'Something went wrong',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTest = async () => {
    setIsLoading(true);
    
    try {
      const results = await runCompleteTest();
      
      const message = results.apiConnection 
        ? `✅ All tests passed!\n\nAPI Connection: Working\nEndpoints tested: ${results.endpoints.length}\nReady for SignUp integration!`
        : `❌ Some tests failed.\n\nAPI Connection: ${results.apiConnection ? 'Working' : 'Failed'}\n\nCheck console for details.`;
      
      Alert.alert(
        'Complete Test Results',
        message,
        [{ text: 'OK' }]
      );
      
      setLastResult(results.apiConnection ? '✅ All OK' : '❌ Issues');
    } catch (error: any) {
      setLastResult('❌ Error');
      Alert.alert(
        'Test Error',
        error.message || 'Something went wrong',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Backend Connection Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleTestConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleCompleteTest}
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          {isLoading ? 'Testing...' : 'Run Complete Test'}
        </Text>
      </TouchableOpacity>
      
      {lastResult && (
        <Text style={styles.result}>{lastResult}</Text>
      )}
      
      <Text style={styles.hint}>
        Django server should be running on: http://127.0.0.1:8000
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: 'white',
  },
  result: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default ConnectionTestButton;
