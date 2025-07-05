import React from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const DoklinkScreen = () => {
  const handleAllow = () => {
    console.log('Allow pressed');
    // TODO: Implement file permission logic
    Alert.alert('Permission Granted', 'Doklink can now access your files.');
  };

  const handleContinue = () => {
    console.log('Continue pressed');
    // TODO: Navigate to next screen
    Alert.alert('Continue', 'Proceeding without file access.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('./assets/doctor-icon.png')} // Updated path
              style={styles.doctorImage}
              resizeMode="contain"
              accessibilityLabel="Doctor icon"
            />
          </View>
          <Text style={styles.appName}>Doklink</Text>
        </View>

        {/* Permission Request Section */}
        <View style={styles.permissionSection}>
          <Text style={styles.permissionTitle}>File Access Required</Text>
          <Text style={styles.permissionText}>
            Allow Doklink to access your files and folders to provide better healthcare document management.
          </Text>
          
          <View style={styles.folderContainer}>
            <Icon 
              name="folder-open" 
              size={80} 
              color="#6B7280" 
              accessibilityLabel="Folder icon"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllow}
            activeOpacity={0.8}
            accessibilityLabel="Allow file access"
            accessibilityHint="Grant Doklink permission to access your files"
          >
            <Text style={styles.allowButtonText}>ALLOW ACCESS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
            accessibilityLabel="Continue without access"
            accessibilityHint="Proceed without granting file access"
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F9FAFB',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica-Bold' : 'Roboto-Bold',
    letterSpacing: 2,
  },
  permissionSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  folderContainer: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  allowButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  continueButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  continueButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default DoklinkScreen;