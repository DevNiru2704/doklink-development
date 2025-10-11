import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const DoklinkScreen = () => {
  const handleAllow = () => {
    console.log('Location permission allowed');
    // Handle location permission logic here
  };

  const handleContinue = () => {
    console.log('Continue without location');
    // Handle continue logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <View style={styles.content}>
        {/* Logo and Title Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.doctorIcon}>
              <Text style={styles.doctorEmoji}>👨‍⚕️</Text>
              <View style={styles.stethoscopeIcon}>
                <Text style={styles.stethoscopeEmoji}>🩺</Text>
              </View>
            </View>
          </View>
          <Text style={styles.title}>Doklink</Text>
        </View>

        {/* Permission Request Section */}
        <View style={styles.permissionSection}>
          <Text style={styles.permissionText}>
            ALLOW DOKLINK TO ACCESS{'\n'}YOUR LOCATION!
          </Text>
          
          <View style={styles.iconContainer}>
            <View style={styles.locationIconContainer}>
              <View style={styles.locationPin}>
                <View style={styles.locationPinGradient}>
                  <View style={styles.locationPinInner}>
                    <View style={styles.locationDot} />
                    <View style={styles.locationDotGlow} />
                  </View>
                </View>
                <View style={styles.locationPinTail} />
              </View>
              <View style={styles.locationShadow} />
              <View style={styles.locationRipple1} />
              <View style={styles.locationRipple2} />
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity 
            style={styles.allowButton} 
            onPress={handleAllow}
            activeOpacity={0.7}
          >
            <Text style={styles.allowButtonText}>ALLOW</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            activeOpacity={0.7}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  doctorIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorEmoji: {
    fontSize: 80,
    opacity: 0.8,
  },
  stethoscopeIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  stethoscopeEmoji: {
    fontSize: 24,
    opacity: 0.9,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    color: '#9CA3AF',
    letterSpacing: 2,
    fontFamily: 'System',
  },
  permissionSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 24,
    marginBottom: 60,
    fontFamily: 'System',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  locationIconContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
    height: 120,
    width: 80,
    justifyContent: 'center',
  },
  locationPin: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  locationPinGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  locationPinInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  locationDotGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  locationPinTail: {
    position: 'absolute',
    top: 40,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6366F1',
    transform: [{ rotate: '180deg' }],
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  locationShadow: {
    position: 'absolute',
    bottom: -10,
    width: 35,
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    opacity: 0.6,
  },
  locationRipple1: {
    position: 'absolute',
    top: 10,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#6366F1',
    opacity: 0.3,
  },
  locationRipple2: {
    position: 'absolute',
    top: 5,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    opacity: 0.2,
  },
  buttonsSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  allowButton: {
    backgroundColor: '#4B5563',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  allowButtonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'System',
  },
  continueButton: {
    backgroundColor: '#4B5563',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  continueButtonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'System',
  },
});

export default DoklinkScreen;