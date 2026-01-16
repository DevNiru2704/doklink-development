// Home.tsx - Emergency Landing Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LogoSVGDark from '@/assets/images/just_the_logo_dark.svg';
import LogoSVGLight from '@/assets/images/just_the_logo_light.svg';
import { emergencyService } from '@/services/emergencyService';
import { EmergencyBooking } from '@/utils/emergency/types';

export default function Home() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const styles = getStyles(isDark);

  const [loading, setLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<EmergencyBooking | null>(null);
  const [recentHospitals, setRecentHospitals] = useState<any[]>([]);

  useEffect(() => {
    loadActiveBooking();
    loadRecentHospitals();
  }, []);

  const loadActiveBooking = async () => {
    try {
      const booking = await emergencyService.getActiveBooking();
      setActiveBooking(booking);
    } catch (error) {
      console.error('Error loading active booking:', error);
    }
  };

  const loadRecentHospitals = async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_hospitals');
      if (stored) {
        setRecentHospitals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent hospitals:', error);
    }
  };

  const handleEmergency = async () => {
    setLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Please enable location services to find nearby hospitals.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Navigate to hospital selection with location
      router.push({
        pathname: '/pages/HospitalSelection',
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          isEmergency: 'true',
        },
      });
    } catch (error: any) {
      console.error('Emergency trigger error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to get your location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlannedAdmission = () => {
    Alert.alert(
      'Coming Soon',
      'Planned admission feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleViewActiveBooking = () => {
    if (activeBooking) {
      Alert.alert(
        'Active Booking',
        `You have an active booking at ${activeBooking.hospital.name}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a2332' : '#ffffff'}
      />
      <LinearGradient
        colors={
          isDark
            ? ['#020a0e', '#0a1520', '#020a0e']
            : ['#f8fafc', '#ffffff', '#f1f5f9']
        }
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            {isDark ? (
              <LogoSVGDark width={80} height={80} />
            ) : (
              <LogoSVGLight width={80} height={80} />
            )}
            <Text style={styles.headerTitle}>DokLink</Text>
          </View>

          {/* Active Booking Banner */}
          {activeBooking && (
            <TouchableOpacity
              style={styles.activeBookingBanner}
              onPress={handleViewActiveBooking}
            >
              <View style={styles.activeBookingContent}>
                <Ionicons
                  name="medical"
                  size={24}
                  color="#10B981"
                  style={styles.activeBookingIcon}
                />
                <View style={styles.activeBookingText}>
                  <Text style={styles.activeBookingTitle}>
                    Active Booking
                  </Text>
                  <Text style={styles.activeBookingSubtitle}>
                    {activeBooking.hospital.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#10B981" />
              </View>
            </TouchableOpacity>
          )}

          {/* Main Emergency Button */}
          <View style={styles.mainButtonSection}>
            <Text style={styles.sectionTitle}>Need Immediate Care?</Text>
            <TouchableOpacity
              style={[styles.emergencyButton, loading && styles.emergencyButtonDisabled]}
              onPress={handleEmergency}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626', '#B91C1C']}
                style={styles.emergencyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="medical"
                      size={60}
                      color="#FFFFFF"
                      style={styles.emergencyIcon}
                    />
                    <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
                    <Text style={styles.emergencyButtonSubtext}>
                      Find Hospital Now
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.emergencyHint}>
              Tap to find nearby hospitals with available beds
            </Text>
          </View>

          {/* Planned Admission Button */}
          <View style={styles.secondaryButtonSection}>
            <TouchableOpacity
              style={styles.plannedButton}
              onPress={handlePlannedAdmission}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={28}
                color={isDark ? '#60A5FA' : '#3B82F6'}
                style={styles.plannedIcon}
              />
              <View style={styles.plannedTextContainer}>
                <Text style={styles.plannedButtonText}>
                  Planned Admission
                </Text>
                <Text style={styles.plannedButtonSubtext}>
                  Schedule your hospital visit
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
            </TouchableOpacity>
          </View>

          {/* Recent Hospitals Section */}
          {recentHospitals.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Hospitals</Text>
              {recentHospitals.slice(0, 3).map((hospital, index) => (
                <TouchableOpacity
                  key={hospital.id || index}
                  style={styles.recentHospitalCard}
                  onPress={() => {
                    Alert.alert('Hospital Details', `View details for ${hospital.name}`);
                  }}
                >
                  <Ionicons
                    name="business-outline"
                    size={24}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <View style={styles.recentHospitalInfo}>
                    <Text style={styles.recentHospitalName}>
                      {hospital.name}
                    </Text>
                    <Text style={styles.recentHospitalCity}>
                      {hospital.city}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/Dashboard')}
              >
                <Ionicons
                  name="grid-outline"
                  size={32}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text style={styles.quickActionText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/MySpace')}
              >
                <Ionicons
                  name="person-outline"
                  size={32}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text style={styles.quickActionText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/Search')}
              >
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text style={styles.quickActionText}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  Alert.alert('Settings', 'Settings page coming soon');
                }}
              >
                <Ionicons
                  name="settings-outline"
                  size={32}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text style={styles.quickActionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginLeft: 12,
      color: isDark ? '#7F929E' : '#005F99',
    },
    activeBookingBanner: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#10B981',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    activeBookingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    activeBookingIcon: {
      marginRight: 12,
    },
    activeBookingText: {
      flex: 1,
    },
    activeBookingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 4,
    },
    activeBookingSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    mainButtonSection: {
      paddingHorizontal: 20,
      marginTop: 20,
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 20,
      textAlign: 'center',
    },
    emergencyButton: {
      width: '100%',
      aspectRatio: 1,
      maxWidth: 320,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    emergencyButtonDisabled: {
      opacity: 0.7,
    },
    emergencyButtonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emergencyIcon: {
      marginBottom: 12,
    },
    emergencyButtonText: {
      fontSize: 36,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 2,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    emergencyButtonSubtext: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 8,
      textAlign: 'center',
    },
    emergencyHint: {
      marginTop: 16,
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    secondaryButtonSection: {
      paddingHorizontal: 20,
      marginTop: 32,
    },
    plannedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    plannedIcon: {
      marginRight: 16,
    },
    plannedTextContainer: {
      flex: 1,
    },
    plannedButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 4,
    },
    plannedButtonSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    recentSection: {
      paddingHorizontal: 20,
      marginTop: 32,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 12,
    },
    recentHospitalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    recentHospitalInfo: {
      flex: 1,
      marginLeft: 12,
    },
    recentHospitalName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 4,
    },
    recentHospitalCity: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    quickActionsSection: {
      paddingHorizontal: 20,
      marginTop: 32,
    },
    quickActionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionCard: {
      width: '48%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    quickActionText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      textAlign: 'center',
    },
  });