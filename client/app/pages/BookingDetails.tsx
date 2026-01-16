// app/pages/BookingDetails.tsx
// Screen for entering patient details and confirming bed booking

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useColorScheme,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { emergencyService } from '@/services/emergencyService';
import { EMERGENCY_TYPES } from '@/utils/emergency/types';

export default function BookingDetails() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams();
    const styles = getStyles(isDark);

    const [emergencyType, setEmergencyType] = useState('');
    const [patientCondition, setPatientCondition] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const hospitalId = parseInt(params.hospitalId as string);
    const hospitalName = params.hospitalName as string;
    const distance = parseFloat(params.distance as string);
    const estimatedTime = parseInt(params.estimatedTime as string);
    const availableBeds = parseInt(params.availableBeds as string);
    const isEmergency = params.isEmergency === 'true';

    const handleConfirmBooking = async () => {
        if (!emergencyType) {
            Alert.alert('Required', 'Please select emergency type');
            return;
        }

        setLoading(true);
        try {
            const booking = await emergencyService.bookEmergencyBed({
                hospital_id: hospitalId,
                emergency_type: emergencyType,
                patient_condition: patientCondition,
                contact_person: contactPerson,
                contact_phone: contactPhone,
                notes: notes,
            });

            Alert.alert(
                'Booking Confirmed!',
                `Your bed has been reserved at ${hospitalName}. Please arrive within 30 minutes.`,
                [
                    {
                        text: 'View Booking',
                        onPress: () => {
                            router.replace('/(tabs)/Dashboard');
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert(
                'Booking Failed',
                error?.response?.data?.message || 'Failed to book bed. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
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
                    <Text style={styles.headerTitle}>Confirm Booking</Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Hospital Info Card */}
                    <View style={styles.hospitalCard}>
                        <Ionicons
                            name="business"
                            size={32}
                            color={isDark ? '#60A5FA' : '#3B82F6'}
                        />
                        <View style={styles.hospitalInfo}>
                            <Text style={styles.hospitalName}>{hospitalName}</Text>
                            <Text style={styles.hospitalDetails}>
                                {emergencyService.formatDistance(distance)} • {emergencyService.formatTime(estimatedTime)}
                            </Text>
                            <Text style={styles.hospitalBeds}>
                                {availableBeds} bed(s) available
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Patient Information</Text>

                        {/* Emergency Type */}
                        <Text style={styles.label}>Emergency Type *</Text>
                        <View style={styles.emergencyTypeGrid}>
                            {EMERGENCY_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.emergencyTypeButton,
                                        emergencyType === type && styles.emergencyTypeButtonActive,
                                    ]}
                                    onPress={() => setEmergencyType(type)}
                                >
                                    <Text
                                        style={[
                                            styles.emergencyTypeText,
                                            emergencyType === type && styles.emergencyTypeTextActive,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Patient Condition */}
                        <Text style={styles.label}>Patient Condition (Optional)</Text>
                        <TextInput
                            style={styles.textArea}
                            value={patientCondition}
                            onChangeText={setPatientCondition}
                            placeholder="Describe the condition..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Contact Person */}
                        <Text style={styles.label}>Contact Person (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={contactPerson}
                            onChangeText={setContactPerson}
                            placeholder="Full name"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                        />

                        {/* Contact Phone */}
                        <Text style={styles.label}>Contact Phone (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            placeholder="Phone number"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            keyboardType="phone-pad"
                        />

                        {/* Additional Notes */}
                        <Text style={styles.label}>Additional Notes (Optional)</Text>
                        <TextInput
                            style={styles.textArea}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Any additional information..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                        onPress={handleConfirmBooking}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.confirmButtonText}>CONFIRM BOOKING</Text>
                        )}
                    </TouchableOpacity>

                    {/* Info Note */}
                    <View style={styles.infoNote}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={styles.infoNoteText}>
                            Your bed will be reserved for 30 minutes. Please arrive at the
                            hospital as soon as possible.
                        </Text>
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
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 40,
        },
        hospitalCard: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#E5E7EB',
        },
        hospitalInfo: {
            flex: 1,
            marginLeft: 12,
        },
        hospitalName: {
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 6,
        },
        hospitalDetails: {
            fontSize: 14,
            color: isDark ? '#9CA3AF' : '#6B7280',
            marginBottom: 4,
        },
        hospitalBeds: {
            fontSize: 14,
            fontWeight: '600',
            color: '#10B981',
        },
        formSection: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 16,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 8,
            marginTop: 16,
        },
        input: {
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: isDark ? '#FFFFFF' : '#1F2937',
            borderWidth: 1,
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
        },
        textArea: {
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: isDark ? '#FFFFFF' : '#1F2937',
            borderWidth: 1,
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
            minHeight: 80,
            textAlignVertical: 'top',
        },
        emergencyTypeGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
        },
        emergencyTypeButton: {
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            margin: 4,
            borderWidth: 1,
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
        },
        emergencyTypeButtonActive: {
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
        },
        emergencyTypeText: {
            fontSize: 14,
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        emergencyTypeTextActive: {
            color: '#FFFFFF',
            fontWeight: '600',
        },
        confirmButton: {
            backgroundColor: '#10B981',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 16,
        },
        confirmButtonDisabled: {
            opacity: 0.7,
        },
        confirmButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        infoNote: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
            borderRadius: 12,
            padding: 16,
            alignItems: 'flex-start',
        },
        infoNoteText: {
            flex: 1,
            marginLeft: 12,
            fontSize: 14,
            color: isDark ? '#93C5FD' : '#1E40AF',
            lineHeight: 20,
        },
    });
