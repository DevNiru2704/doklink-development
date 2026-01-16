// app/pages/HospitalSelection.tsx
// Screen to display nearby hospitals with bed availability

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    StatusBar,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { emergencyService } from '@/services/emergencyService';
import { NearbyHospitalResponse } from '@/utils/emergency/types';

export default function HospitalSelection() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams();
    const styles = getStyles(isDark);

    const [hospitals, setHospitals] = useState<NearbyHospitalResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
    const [searchRadius, setSearchRadius] = useState(50); // Default 50km

    const latitude = parseFloat(params.latitude as string);
    const longitude = parseFloat(params.longitude as string);
    const isEmergency = params.isEmergency === 'true';

    useEffect(() => {
        loadNearbyHospitals();
    }, []);

    useEffect(() => {
        if (!loading) {
            loadNearbyHospitals();
        }
    }, [searchRadius]);

    const loadNearbyHospitals = async () => {
        try {
            setLoading(true);
            const nearbyHospitals = await emergencyService.getNearbyHospitals(
                latitude,
                longitude,
                searchRadius
            );

            // Calculate estimated time for each hospital
            const hospitalsWithTime = nearbyHospitals.map((hospital) => ({
                ...hospital,
                estimated_time: emergencyService.calculateEstimatedTime(
                    hospital.distance || 0
                ),
            }));

            // Sort by distance
            hospitalsWithTime.sort((a, b) => (a.distance || 0) - (b.distance || 0));

            setHospitals(hospitalsWithTime);
        } catch (error: any) {
            console.error('Error loading hospitals:', error);
            Alert.alert(
                'Error',
                error?.response?.data?.message ||
                'Failed to load nearby hospitals. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNearbyHospitals();
    };

    const handleBookBed = async (hospital: NearbyHospitalResponse) => {
        // Check if hospital has available beds
        if (!emergencyService.hasAvailableBeds(hospital)) {
            Alert.alert(
                'No Beds Available',
                'This hospital currently has no available beds. Please select another hospital.',
                [{ text: 'OK' }]
            );
            return;
        }

        setSelectedHospital(hospital.id);

        try {
            // Navigate to booking confirmation with hospital details
            router.push({
                pathname: '/pages/emergency/BookingDetails',
                params: {
                    hospitalId: hospital.id.toString(),
                    hospitalName: hospital.name,
                    distance: hospital.distance?.toString() || '0',
                    estimatedTime: hospital.estimated_time?.toString() || '0',
                    availableBeds: emergencyService
                        .getTotalAvailableBeds(hospital)
                        .toString(),
                    isEmergency: isEmergency.toString(),
                },
            });
        } catch (error) {
            console.error('Error navigating to booking:', error);
        } finally {
            setSelectedHospital(null);
        }
    };

    const handleViewDetails = (hospital: NearbyHospitalResponse) => {
        router.push({
            pathname: '/pages/emergency/HospitalDetails',
            params: { hospitalId: hospital.id.toString() },
        });
    };

    const renderHospitalCard = (hospital: NearbyHospitalResponse) => {
        const hasBedsAvailable = emergencyService.hasAvailableBeds(hospital);
        const totalBeds = emergencyService.getTotalAvailableBeds(hospital);
        const isSelected = selectedHospital === hospital.id;

        return (
            <View key={hospital.id} style={styles.hospitalCard}>
                {/* Hospital Header */}
                <TouchableOpacity
                    onPress={() => handleViewDetails(hospital)}
                    activeOpacity={0.7}
                >
                    <View style={styles.hospitalHeader}>
                        <View style={styles.hospitalIconContainer}>
                            <Ionicons
                                name="business"
                                size={32}
                                color={isDark ? '#60A5FA' : '#3B82F6'}
                            />
                        </View>
                        <View style={styles.hospitalInfo}>
                            <Text style={styles.hospitalName}>{hospital.name}</Text>
                            <Text style={styles.hospitalAddress}>
                                {hospital.city}, {hospital.state}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Distance and Time */}
                <View style={styles.distanceRow}>
                    <View style={styles.distanceItem}>
                        <Ionicons
                            name="location"
                            size={18}
                            color={isDark ? '#9CA3AF' : '#6B7280'}
                        />
                        <Text style={styles.distanceText}>
                            {emergencyService.formatDistance(hospital.distance || 0)}
                        </Text>
                    </View>
                    <View style={styles.distanceItem}>
                        <Ionicons
                            name="time"
                            size={18}
                            color={isDark ? '#9CA3AF' : '#6B7280'}
                        />
                        <Text style={styles.distanceText}>
                            {emergencyService.formatTime(hospital.estimated_time || 0)}
                        </Text>
                    </View>
                </View>

                {/* Bed Availability */}
                <View style={styles.bedSection}>
                    <Text style={styles.bedTitle}>Bed Availability</Text>
                    <View style={styles.bedRow}>
                        {/* General Beds */}
                        <View style={styles.bedItem}>
                            <Ionicons
                                name="bed-outline"
                                size={24}
                                color={
                                    (hospital.available_general_beds || 0) > 0
                                        ? '#10B981'
                                        : '#EF4444'
                                }
                            />
                            <Text style={styles.bedLabel}>General</Text>
                            <Text
                                style={[
                                    styles.bedCount,
                                    {
                                        color:
                                            (hospital.available_general_beds || 0) > 0
                                                ? '#10B981'
                                                : '#EF4444',
                                    },
                                ]}
                            >
                                {hospital.available_general_beds || 0} / {hospital.total_general_beds || 0}
                            </Text>
                        </View>

                        {/* ICU Beds */}
                        <View style={styles.bedItem}>
                            <Ionicons
                                name="medical"
                                size={24}
                                color={
                                    (hospital.available_icu_beds || 0) > 0 ? '#10B981' : '#EF4444'
                                }
                            />
                            <Text style={styles.bedLabel}>ICU</Text>
                            <Text
                                style={[
                                    styles.bedCount,
                                    {
                                        color:
                                            (hospital.available_icu_beds || 0) > 0
                                                ? '#10B981'
                                                : '#EF4444',
                                    },
                                ]}
                            >
                                {hospital.available_icu_beds || 0} / {hospital.total_icu_beds || 0}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Insurance Status */}
                {hospital.accepts_insurance !== undefined && (
                    <View style={styles.insuranceRow}>
                        <Ionicons
                            name={hospital.accepts_insurance ? 'checkmark-circle' : 'close-circle'}
                            size={20}
                            color={hospital.accepts_insurance ? '#10B981' : '#EF4444'}
                        />
                        <Text
                            style={[
                                styles.insuranceText,
                                {
                                    color: hospital.accepts_insurance
                                        ? '#10B981'
                                        : isDark
                                            ? '#EF4444'
                                            : '#DC2626',
                                },
                            ]}
                        >
                            {hospital.accepts_insurance
                                ? 'Insurance Accepted'
                                : 'Insurance Not Accepted'}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.detailsButton, { flex: 1, marginRight: 8 }]}
                        onPress={() => handleViewDetails(hospital)}
                    >
                        <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            { flex: 1, marginLeft: 8 },
                            !hasBedsAvailable && styles.bookButtonDisabled,
                        ]}
                        onPress={() => handleBookBed(hospital)}
                        disabled={!hasBedsAvailable || isSelected}
                    >
                        {isSelected ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.bookButtonText}>
                                {hasBedsAvailable ? 'BOOK BED' : 'NO BEDS'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={isDark ? '#FFFFFF' : '#1F2937'}
                        />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>
                            {isEmergency ? 'Emergency Hospitals' : 'Nearby Hospitals'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {hospitals.length} hospitals found
                        </Text>
                    </View>
                </View>

                {/* Radius Slider */}
                <View style={styles.radiusSliderContainer}>
                    <View style={styles.radiusHeader}>
                        <Ionicons name="location" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                        <Text style={styles.radiusLabel}>Search Radius: {searchRadius} km</Text>
                    </View>
                    <View style={styles.sliderWrapper}>
                        <TouchableOpacity
                            style={styles.radiusButton}
                            onPress={() => setSearchRadius(Math.max(5, searchRadius - 10))}
                        >
                            <Ionicons name="remove" size={20} color={isDark ? '#FFF' : '#000'} />
                        </TouchableOpacity>
                        <View style={styles.sliderContainer}>
                            <View style={styles.sliderTrack}>
                                <View
                                    style={[
                                        styles.sliderFill,
                                        { width: `${(searchRadius / 200) * 100}%` }
                                    ]}
                                />
                            </View>
                            <View style={styles.sliderMarkers}>
                                {[25, 50, 100, 150, 200].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        style={[
                                            styles.sliderMarker,
                                            searchRadius === val && styles.sliderMarkerActive
                                        ]}
                                        onPress={() => setSearchRadius(val)}
                                    >
                                        <Text style={[
                                            styles.sliderMarkerText,
                                            searchRadius === val && styles.sliderMarkerTextActive
                                        ]}>{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.radiusButton}
                            onPress={() => setSearchRadius(Math.min(200, searchRadius + 10))}
                        >
                            <Ionicons name="add" size={20} color={isDark ? '#FFF' : '#000'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={isDark ? '#60A5FA' : '#3B82F6'}
                        />
                        <Text style={styles.loadingText}>Finding nearby hospitals...</Text>
                    </View>
                ) : hospitals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="business-outline"
                            size={64}
                            color={isDark ? '#4B5563' : '#9CA3AF'}
                        />
                        <Text style={styles.emptyText}>No hospitals found nearby</Text>
                        <Text style={styles.emptySubtext}>
                            Try expanding your search radius
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={isDark ? '#60A5FA' : '#3B82F6'}
                            />
                        }
                    >
                        {isEmergency && (
                            <View style={styles.emergencyBanner}>
                                <Ionicons name="warning" size={24} color="#EF4444" />
                                <Text style={styles.emergencyBannerText}>
                                    Emergency Mode: Showing hospitals with available beds
                                </Text>
                            </View>
                        )}

                        {hospitals.map((hospital) => renderHospitalCard(hospital))}
                    </ScrollView>
                )}
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
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        headerTitleContainer: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 4,
        },
        headerSubtitle: {
            fontSize: 14,
            color: isDark ? '#9CA3AF' : '#6B7280',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: isDark ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        emptyText: {
            marginTop: 16,
            fontSize: 18,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
            textAlign: 'center',
        },
        emptySubtext: {
            marginTop: 8,
            fontSize: 14,
            color: isDark ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
        },
        retryButton: {
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: isDark ? '#3B82F6' : '#2563EB',
            borderRadius: 8,
        },
        retryButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 40,
        },
        emergencyBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
        },
        emergencyBannerText: {
            flex: 1,
            marginLeft: 12,
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FCA5A5' : '#DC2626',
        },
        hospitalCard: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        hospitalHeader: {
            flexDirection: 'row',
            marginBottom: 12,
        },
        hospitalIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        hospitalInfo: {
            flex: 1,
            justifyContent: 'center',
        },
        hospitalName: {
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 4,
        },
        hospitalAddress: {
            fontSize: 14,
            color: isDark ? '#9CA3AF' : '#6B7280',
        },
        distanceRow: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        distanceItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 20,
        },
        distanceText: {
            marginLeft: 6,
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
        },
        bedSection: {
            marginBottom: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
        bedTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 12,
        },
        bedRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        bedItem: {
            alignItems: 'center',
            flex: 1,
        },
        bedLabel: {
            marginTop: 6,
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
        },
        bedCount: {
            marginTop: 4,
            fontSize: 16,
            fontWeight: '700',
        },
        insuranceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
        insuranceText: {
            marginLeft: 8,
            fontSize: 14,
            fontWeight: '600',
        },
        actionRow: {
            flexDirection: 'row',
            marginTop: 8,
        },
        detailsButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        detailsButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        bookButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: '#10B981',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        bookButtonDisabled: {
            backgroundColor: isDark ? '#4B5563' : '#9CA3AF',
        },
        bookButtonText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        radiusSliderContainer: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        },
        radiusHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        radiusLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginLeft: 8,
        },
        sliderWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        radiusButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? '#374151' : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
        },
        sliderContainer: {
            flex: 1,
        },
        sliderTrack: {
            height: 6,
            backgroundColor: isDark ? '#374151' : '#E5E7EB',
            borderRadius: 3,
            overflow: 'hidden',
        },
        sliderFill: {
            height: '100%',
            backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
            borderRadius: 3,
        },
        sliderMarkers: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
        },
        sliderMarker: {
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 4,
        },
        sliderMarkerActive: {
            backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
        },
        sliderMarkerText: {
            fontSize: 11,
            color: isDark ? '#9CA3AF' : '#6B7280',
            fontWeight: '500',
        },
        sliderMarkerTextActive: {
            color: isDark ? '#60A5FA' : '#3B82F6',
            fontWeight: '700',
        },
    });
