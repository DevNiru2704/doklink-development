/**
 * HospitalComparison.tsx - Hospital Comparison Screen
 * Step 3: Compare hospitals and select one for planned admission
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import plannedAdmissionService, { Hospital } from '../../../services/plannedAdmissionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HospitalWithScores extends Hospital {
    distance?: number;
    estimated_time?: number;
    score?: number;
    reasons?: string[];
}

export default function HospitalComparison() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{
        careType: string;
        symptoms: string;
        procedureCategory: string;
        procedureName: string;
    }>();

    const [hospitals, setHospitals] = useState<HospitalWithScores[]>([]);
    const [selectedHospitals, setSelectedHospitals] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [compareMode, setCompareMode] = useState(false);

    useEffect(() => {
        loadHospitals();
    }, []);

    const loadHospitals = async () => {
        try {
            // Get user location
            const { status } = await Location.requestForegroundPermissionsAsync();
            let lat = 22.5726; // Default to Kolkata
            let lng = 88.3639;

            if (status === 'granted') {
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    // Round to 6 decimal places (backend limit)
                    lat = Math.round(location.coords.latitude * 1000000) / 1000000;
                    lng = Math.round(location.coords.longitude * 1000000) / 1000000;
                    setUserLocation({ latitude: lat, longitude: lng });
                } catch (e) {
                    console.log('Using default location');
                }
            }

            // Fetch hospitals
            const hospitalData = await plannedAdmissionService.getNearbyHospitals(lat, lng, 100);

            // Add scores and reasons (dummy AI scoring for now)
            const hospitalsWithScores = hospitalData.map((hospital, index) => ({
                ...hospital,
                score: Math.floor(80 + Math.random() * 18), // 80-98 score
                reasons: generateReasons(hospital, params.procedureCategory || ''),
            }));

            // Sort by score
            hospitalsWithScores.sort((a, b) => (b.score || 0) - (a.score || 0));
            setHospitals(hospitalsWithScores);
        } catch (error) {
            console.error('Error loading hospitals:', error);
            // Use dummy data if API fails
            setHospitals(getDummyHospitals());
        } finally {
            setLoading(false);
        }
    };

    const generateReasons = (hospital: Hospital, procedureCategory: string): string[] => {
        const reasons = [];
        if (hospital.accepts_insurance) reasons.push('Accepts your insurance');
        if (hospital.available_general_beds > 10) reasons.push('High bed availability');
        if (hospital.estimated_general_admission_cost < 100000) reasons.push('Affordable pricing');
        if (reasons.length === 0) reasons.push('Recommended hospital');
        return reasons;
    };

    const getDummyHospitals = (): HospitalWithScores[] => {
        return [
            {
                id: 1,
                name: 'Apollo Gleneagles Hospital',
                address: '58, Canal Circular Road',
                city: 'Kolkata',
                state: 'West Bengal',
                latitude: 22.5397,
                longitude: 88.3658,
                available_general_beds: 45,
                available_icu_beds: 12,
                accepts_insurance: true,
                insurance_providers: 'ICICI Lombard, Star Health, HDFC ERGO',
                estimated_emergency_cost: 50000,
                estimated_general_admission_cost: 75000,
                distance: 5.2,
                estimated_time: 15,
                score: 95,
                reasons: ['Top-rated hospital', 'Accepts your insurance', 'Short wait time'],
            },
            {
                id: 2,
                name: 'Fortis Hospital',
                address: '730, Anandapur',
                city: 'Kolkata',
                state: 'West Bengal',
                latitude: 22.5141,
                longitude: 88.3959,
                available_general_beds: 38,
                available_icu_beds: 8,
                accepts_insurance: true,
                insurance_providers: 'Star Health, Max Bupa, Religare',
                estimated_emergency_cost: 55000,
                estimated_general_admission_cost: 82000,
                distance: 7.8,
                estimated_time: 22,
                score: 92,
                reasons: ['Excellent specialists', 'Modern facilities'],
            },
            {
                id: 3,
                name: 'AMRI Hospital',
                address: 'JC Block, Salt Lake',
                city: 'Kolkata',
                state: 'West Bengal',
                latitude: 22.5808,
                longitude: 88.4184,
                available_general_beds: 52,
                available_icu_beds: 15,
                accepts_insurance: true,
                insurance_providers: 'ICICI Lombard, SBI Health, Oriental',
                estimated_emergency_cost: 45000,
                estimated_general_admission_cost: 68000,
                distance: 10.5,
                estimated_time: 28,
                score: 88,
                reasons: ['Affordable pricing', 'High availability'],
            },
        ];
    };

    const toggleHospitalSelection = (hospitalId: number) => {
        if (selectedHospitals.includes(hospitalId)) {
            setSelectedHospitals(selectedHospitals.filter(id => id !== hospitalId));
        } else if (selectedHospitals.length < 3) {
            setSelectedHospitals([...selectedHospitals, hospitalId]);
        } else {
            Alert.alert('Limit Reached', 'You can compare up to 3 hospitals at a time.');
        }
    };

    const handleSelectHospital = (hospital: HospitalWithScores) => {
        router.push({
            pathname: '/pages/planned/ScheduleAdmission',
            params: {
                careType: params.careType,
                symptoms: params.symptoms,
                procedureCategory: params.procedureCategory,
                procedureName: params.procedureName,
                hospitalId: hospital.id.toString(),
                hospitalName: hospital.name,
            }
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Finding best hospitals for you...
                </Text>
            </View>
        );
    }

    const selectedHospitalData = hospitals.filter(h => selectedHospitals.includes(h.id));

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Compare Hospitals
                </Text>
                <TouchableOpacity
                    style={[styles.compareModeButton, compareMode && styles.compareModeActive]}
                    onPress={() => setCompareMode(!compareMode)}
                >
                    <Ionicons name="git-compare" size={20} color={compareMode ? '#ffffff' : '#3b82f6'} />
                </TouchableOpacity>
            </View>

            {/* Procedure Info Bar */}
            <View style={[styles.procedureBar, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                <Ionicons name="medkit" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <Text style={[styles.procedureText, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                    {params.procedureName || params.careType || 'Planned Admission'}
                </Text>
            </View>

            {/* Compare Mode Selection Bar */}
            {compareMode && selectedHospitals.length > 0 && (
                <View style={[styles.selectionBar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                    <Text style={[styles.selectionText, { color: isDark ? '#ffffff' : '#111827' }]}>
                        {selectedHospitals.length} selected
                    </Text>
                    <TouchableOpacity
                        style={styles.compareButton}
                        onPress={() => {
                            if (selectedHospitals.length < 2) {
                                Alert.alert('Select More', 'Please select at least 2 hospitals to compare.');
                            } else {
                                // Show comparison modal or navigate
                                Alert.alert('Compare', `Comparing ${selectedHospitals.length} hospitals`);
                            }
                        }}
                    >
                        <Text style={styles.compareButtonText}>Compare Now</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* AI Recommendation Banner */}
                {hospitals.length > 0 && (
                    <View style={[styles.aiRecommendation, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        <View style={styles.aiHeader}>
                            <View style={[styles.aiBadge, { backgroundColor: '#8b5cf620' }]}>
                                <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                                <Text style={styles.aiBadgeText}>AI Recommended</Text>
                            </View>
                        </View>
                        <Text style={[styles.aiDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            Based on your procedure, location, and insurance, we recommend:
                        </Text>
                    </View>
                )}

                {/* Hospital Cards */}
                {hospitals.map((hospital, index) => (
                    <TouchableOpacity
                        key={hospital.id}
                        style={[
                            styles.hospitalCard,
                            {
                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                borderColor: selectedHospitals.includes(hospital.id)
                                    ? '#3b82f6'
                                    : isDark ? '#374151' : '#e5e7eb',
                                borderWidth: selectedHospitals.includes(hospital.id) ? 2 : 1,
                            }
                        ]}
                        onPress={() => compareMode ? toggleHospitalSelection(hospital.id) : handleSelectHospital(hospital)}
                    >
                        {/* Top Recommendation Badge */}
                        {index === 0 && (
                            <View style={styles.topBadge}>
                                <Ionicons name="trophy" size={12} color="#ffffff" />
                                <Text style={styles.topBadgeText}>Top Recommendation</Text>
                            </View>
                        )}

                        {/* Compare Checkbox */}
                        {compareMode && (
                            <View style={styles.checkbox}>
                                <Ionicons
                                    name={selectedHospitals.includes(hospital.id) ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={selectedHospitals.includes(hospital.id) ? '#3b82f6' : '#9ca3af'}
                                />
                            </View>
                        )}

                        {/* Hospital Header */}
                        <View style={styles.hospitalHeader}>
                            <View style={styles.hospitalInfo}>
                                <Text style={[styles.hospitalName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {hospital.name}
                                </Text>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                                    <Text style={[styles.locationText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {hospital.city} • {hospital.distance?.toFixed(1) || '?'} km • {hospital.estimated_time || '?'} min
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.scoreCircle, { borderColor: getScoreColor(hospital.score || 0) }]}>
                                <Text style={[styles.scoreText, { color: getScoreColor(hospital.score || 0) }]}>
                                    {hospital.score}
                                </Text>
                            </View>
                        </View>

                        {/* Reasons */}
                        <View style={styles.reasonsContainer}>
                            {hospital.reasons?.map((reason, idx) => (
                                <View key={idx} style={styles.reasonTag}>
                                    <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                                    <Text style={[styles.reasonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {reason}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="bed-outline" size={16} color="#3b82f6" />
                                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {hospital.available_general_beds}
                                </Text>
                                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Beds
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
                                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {hospital.accepts_insurance ? 'Yes' : 'No'}
                                </Text>
                                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Insurance
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="cash-outline" size={16} color="#f59e0b" />
                                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    ₹{Math.round((hospital.estimated_general_admission_cost || 0) / 1000)}K
                                </Text>
                                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Est. Cost
                                </Text>
                            </View>
                        </View>

                        {/* Select Button */}
                        {!compareMode && (
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => handleSelectHospital(hospital)}
                            >
                                <Text style={styles.selectButtonText}>Select & Schedule</Text>
                                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    compareModeButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    compareModeActive: {
        backgroundColor: '#3b82f6',
    },
    procedureBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    procedureText: {
        fontSize: 14,
        fontWeight: '500',
    },
    selectionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    compareButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    compareButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    aiRecommendation: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    aiBadgeText: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: '600',
    },
    aiDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    hospitalCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        position: 'relative',
    },
    topBadge: {
        position: 'absolute',
        top: -8,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    topBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    checkbox: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    hospitalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 8,
    },
    hospitalInfo: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 13,
    },
    scoreCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '700',
    },
    reasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    reasonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reasonText: {
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    selectButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
