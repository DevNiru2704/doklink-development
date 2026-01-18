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
    TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { emergencyService } from '@/services/emergencyService';
import { NearbyHospitalResponse, InsuranceProvider } from '@/utils/emergency/types';
import LogoSVGDark from '@/assets/images/just_the_logo_dark.svg';
import LogoSVGLight from '@/assets/images/just_the_logo_light.svg';

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
    const [radiusInput, setRadiusInput] = useState('50'); // String for TextInput
    const [showAll, setShowAll] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState<number | undefined>();
    const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProvider[]>([]);
    const [insuranceVisibleCount, setInsuranceVisibleCount] = useState<{ [key: number]: number }>({});

    const latitude = parseFloat(params.latitude as string);
    const longitude = parseFloat(params.longitude as string);
    const isEmergency = params.isEmergency === 'true';

    useEffect(() => {
        if (isNaN(latitude) || isNaN(longitude)) {
            Alert.alert('Error', 'Invalid location coordinates');
            router.back();
            return;
        }
        loadNearbyHospitals();
        loadInsuranceProviders();
    }, []);

    useEffect(() => {
        if (!loading) {
            loadNearbyHospitals();
        }
    }, [searchRadius, showAll, selectedInsurance]);

    const loadInsuranceProviders = async () => {
        try {
            const providers = await emergencyService.getInsuranceProviders();
            setInsuranceProviders(providers.results || []);
        } catch (error) {
            console.error('Error loading insurance providers:', error);
        }
    };

    const loadNearbyHospitals = async () => {
        try {
            setLoading(true);

            // Round to 6 decimal places as required by backend
            const roundedLat = Math.round(latitude * 1000000) / 1000000;
            const roundedLon = Math.round(longitude * 1000000) / 1000000;

            console.log('Loading hospitals with params:', {
                latitude: roundedLat,
                longitude: roundedLon,
                searchRadius,
                showAll,
                selectedInsurance
            });

            const nearbyHospitals = await emergencyService.getNearbyHospitals(
                roundedLat,
                roundedLon,
                searchRadius,
                'all',
                showAll,
                selectedInsurance
            );

            console.log('Received hospitals:', nearbyHospitals.length);
            setHospitals(nearbyHospitals);
        } catch (error: any) {
            console.error('Error loading hospitals:', error);
            console.error('Error response:', error?.response?.data);
            Alert.alert(
                'Error',
                JSON.stringify(error?.response?.data) ||
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

        // Warn if not booking the recommended hospital
        if (!hospital.recommended && hospitals.length > 0) {
            const recommendedHospital = hospitals.find(h => h.recommended);

            if (recommendedHospital) {
                const reasons = [];

                // Compare priority scores
                const scoreDiff = ((recommendedHospital.priority_score - hospital.priority_score) * 100).toFixed(1);
                reasons.push(`The recommended hospital has a ${scoreDiff}% higher priority score based on our weighted algorithm.`);

                // Compare distances
                if (recommendedHospital.distance < hospital.distance) {
                    const distDiff = (hospital.distance - recommendedHospital.distance).toFixed(1);
                    reasons.push(`It is ${distDiff} km closer to your location.`);
                }

                // Compare bed availability
                if (recommendedHospital.total_vacancy > hospital.total_vacancy) {
                    const bedDiff = recommendedHospital.total_vacancy - hospital.total_vacancy;
                    reasons.push(`It has ${bedDiff} more available beds.`);
                }

                // Insurance match
                if (recommendedHospital.insurance_match && !hospital.insurance_match && selectedInsurance) {
                    reasons.push(`It accepts your selected insurance provider.`);
                }

                Alert.alert(
                    'Are you sure?',
                    `You are not booking the recommended hospital.\n\n${recommendedHospital.name} is recommended because:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}\n\nDo you still want to proceed with ${hospital.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Proceed Anyway',
                            style: 'destructive',
                            onPress: () => proceedWithBooking(hospital)
                        }
                    ]
                );
                return;
            }
        }

        proceedWithBooking(hospital);
    };

    const proceedWithBooking = (hospital: NearbyHospitalResponse) => {
        setSelectedHospital(hospital.id);

        try {
            // Navigate to booking confirmation with hospital details
            router.push({
                pathname: '/pages/dashboard/BookingDetails',
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
            pathname: '/pages/dashboard/HospitalDetails',
            params: { hospitalId: hospital.id.toString() },
        });
    };

    const renderHospitalCard = (hospital: NearbyHospitalResponse) => {
        const hasBedsAvailable = emergencyService.hasAvailableBeds(hospital);
        const totalBeds = emergencyService.getTotalAvailableBeds(hospital);
        const isSelected = selectedHospital === hospital.id;

        // Initialize visible count for this hospital if not set
        const visibleCount = insuranceVisibleCount[hospital.id] || 3;

        const handleLoadMoreInsurance = () => {
            setInsuranceVisibleCount(prev => ({
                ...prev,
                [hospital.id]: (prev[hospital.id] || 3) + 3
            }));
        };

        return (
            <View key={hospital.id} style={styles.hospitalCard}>
                {/* Recommended Badge */}
                {hospital.recommended && (
                    <View style={styles.recommendedBadge}>
                        {isDark ? (
                            <LogoSVGDark width={20} height={20} />
                        ) : (
                            <LogoSVGLight width={20} height={20} />
                        )}
                        <Text style={styles.recommendedText}>Recommended By DokLink</Text>
                    </View>
                )}

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
                            <View style={styles.hospitalNameRow}>
                                <Text style={styles.hospitalName}>{hospital.name}</Text>
                                {hospital.insurance_match && (
                                    <View style={styles.insuranceMatchBadge}>
                                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                                        <Text style={styles.insuranceMatchText}>Insurance</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.hospitalAddress}>
                                {hospital.city}, {hospital.state}
                            </Text>
                            <Text style={styles.priorityScore}>
                                Priority Score: {(hospital.priority_score * 100).toFixed(1)}%
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
                    <View style={styles.insuranceSection}>
                        <View style={styles.insuranceHeader}>
                            <Ionicons
                                name={hospital.accepts_insurance ? 'shield-checkmark' : 'close-circle'}
                                size={20}
                                color={hospital.accepts_insurance ? '#10B981' : '#EF4444'}
                            />
                            <Text
                                style={[
                                    styles.insuranceHeaderText,
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

                        {/* Display accepted insurance providers */}
                        {hospital.accepts_insurance && hospital.accepted_insurance_providers && hospital.accepted_insurance_providers.length > 0 && (
                            <View style={styles.insuranceBadgesContainer}>
                                {hospital.accepted_insurance_providers
                                    .slice(0, visibleCount)
                                    .sort((a, b) => {
                                        // Sort by in-network status alternating to distribute colors
                                        if (a.is_in_network === b.is_in_network) return 0;
                                        // Alternate: in-network, out-of-network, in-network, out-of-network
                                        return 0; // Keep original order for mixed display
                                    })
                                    .map((provider, index) => (
                                        <View
                                            key={provider.id}
                                            style={[
                                                styles.insuranceBadge,
                                                provider.is_in_network
                                                    ? styles.insuranceBadgeInNetwork
                                                    : styles.insuranceBadgeOutOfNetwork
                                            ]}
                                        >
                                            <Text style={styles.insuranceBadgeText}>
                                                {provider.name.length > 20
                                                    ? provider.name.substring(0, 20) + '...'
                                                    : provider.name}
                                            </Text>
                                            {provider.is_in_network && (
                                                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={styles.badgeIcon} />
                                            )}
                                        </View>
                                    ))}
                                {hospital.accepted_insurance_providers.length > visibleCount && (
                                    <TouchableOpacity
                                        style={styles.insuranceBadgeLoadMore}
                                        onPress={handleLoadMoreInsurance}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.insuranceBadgeLoadMoreText}>
                                            +{hospital.accepted_insurance_providers.length - visibleCount} more
                                        </Text>
                                        <Ionicons name="chevron-down" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Display estimated costs if available */}
                        {hospital.estimated_emergency_cost && hospital.estimated_emergency_cost > 0 && (
                            <View style={styles.costRow}>
                                <Ionicons name="cash-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={styles.costText}>
                                    Est. Cost: ₹{hospital.estimated_emergency_cost.toLocaleString()}
                                </Text>
                            </View>
                        )}
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

                {/* Filters Section */}
                <View style={styles.filtersContainer}>
                    {/* Radius Input */}
                    <View style={styles.filterRow}>
                        <Ionicons name="location" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                        <Text style={styles.filterLabel}>Radius (km):</Text>
                        <TextInput
                            style={[styles.radiusInput, showAll && styles.radiusInputDisabled]}
                            value={radiusInput}
                            onChangeText={(text) => {
                                if (showAll) return; // Prevent editing when Show All is enabled
                                setRadiusInput(text);
                                const num = parseInt(text);
                                if (!isNaN(num) && num > 0 && num <= 500) {
                                    setSearchRadius(num);
                                }
                            }}
                            keyboardType="numeric"
                            maxLength={3}
                            placeholder="50"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            editable={!showAll}
                        />
                    </View>

                    {/* Show All Checkbox */}
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setShowAll(!showAll)}
                    >
                        <View style={[styles.checkbox, showAll && styles.checkboxChecked]}>
                            {showAll && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Show All (Ignore Radius)</Text>
                    </TouchableOpacity>

                    {/* Insurance Filter */}
                    <View style={styles.filterRow}>
                        <Ionicons name="shield-checkmark" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                        <Text style={styles.filterLabel}>Filter by Insurance:</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedInsurance}
                                onValueChange={(value) => setSelectedInsurance(value)}
                                style={styles.picker}
                                dropdownIconColor={isDark ? '#FFFFFF' : '#000000'}
                            >
                                <Picker.Item
                                    label="All Insurances"
                                    value={undefined}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                />
                                {insuranceProviders.map((provider) => (
                                    <Picker.Item
                                        key={provider.id}
                                        label={provider.name}
                                        value={provider.id}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Radius Slider - COMMENTED OUT (replaced by TextInput in filters)
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
                */}

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
        insuranceSection: {
            marginBottom: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
        insuranceHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        insuranceHeaderText: {
            marginLeft: 8,
            fontSize: 14,
            fontWeight: '600',
        },
        insuranceBadgesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 8,
        },
        insuranceBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 16,
            borderWidth: 1,
        },
        insuranceBadgeInNetwork: {
            backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
            borderColor: '#10B981',
        },
        insuranceBadgeOutOfNetwork: {
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderColor: isDark ? '#4B5563' : '#D1D5DB',
        },
        insuranceBadgeText: {
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        badgeIcon: {
            marginLeft: 4,
        },
        insuranceBadgeLoadMore: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 16,
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderWidth: 1,
            borderColor: isDark ? '#4B5563' : '#D1D5DB',
        },
        insuranceBadgeLoadMoreText: {
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
            marginRight: 4,
        },
        costRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
        },
        costText: {
            marginLeft: 6,
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
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
        filtersContainer: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#E5E7EB',
            gap: 12,
        },
        filterRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        filterLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        radiusInput: {
            flex: 1,
            height: 40,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#D1D5DB',
            borderRadius: 8,
            paddingHorizontal: 12,
            fontSize: 14,
            color: isDark ? '#FFFFFF' : '#1F2937',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
        },
        radiusInputDisabled: {
            backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
            opacity: 0.6,
        },
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        checkbox: {
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: isDark ? '#60A5FA' : '#3B82F6',
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
        },
        checkboxChecked: {
            backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
        },
        checkboxLabel: {
            fontSize: 14,
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        pickerWrapper: {
            flex: 1,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#D1D5DB',
            borderRadius: 8,
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            justifyContent: 'center',
            minHeight: 44,
        },
        picker: {
            height: 50,
            width: '100%',
            color: isDark ? '#FFFFFF' : '#000000',
            fontSize: 14,
        },
        recommendedBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 16,
            gap: 6,
            marginBottom: 12,
            alignSelf: 'flex-start',
            borderWidth: 2,
            borderColor: isDark ? '#3B82F6' : '#60A5FA',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        recommendedLogo: {
            width: 20,
            height: 20,
        },
        recommendedText: {
            fontSize: 11,
            fontWeight: '700',
            color: isDark ? '#60A5FA' : '#3B82F6',
        },
        hospitalNameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
        },
        insuranceMatchBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#D1FAE5',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            gap: 4,
        },
        insuranceMatchText: {
            fontSize: 10,
            fontWeight: '600',
            color: '#10B981',
        },
        priorityScore: {
            fontSize: 12,
            color: isDark ? '#9CA3AF' : '#6B7280',
            marginTop: 4,
        },
    });
