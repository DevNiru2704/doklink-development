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
import { Formik } from 'formik';
import * as Yup from 'yup';
import { emergencyService } from '@/services/emergencyService';
import { EMERGENCY_TYPES } from '@/utils/emergency/types';

// Validation schema
const bookingValidationSchema = Yup.object().shape({
    emergencyTypes: Yup.array()
        .of(Yup.string())
        .min(1, 'Please select at least one emergency type')
        .required('Emergency type is required'),
    bedType: Yup.string()
        .oneOf(['general', 'icu'], 'Invalid bed type')
        .required('Bed type is required'),
    patientCondition: Yup.string()
        .max(500, 'Patient condition must be at most 500 characters'),
    contactPerson: Yup.string()
        .required('Contact person name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
    contactPhone: Yup.string()
        .required('Contact phone is required')
        .matches(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
    notes: Yup.string()
        .max(500, 'Notes must be at most 500 characters'),
});

export default function BookingDetails() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams();
    const styles = getStyles(isDark);

    const [loading, setLoading] = useState(false);

    const hospitalId = parseInt(params.hospitalId as string);
    const hospitalName = params.hospitalName as string;
    const distance = parseFloat(params.distance as string);
    const estimatedTime = parseInt(params.estimatedTime as string);
    const availableBeds = parseInt(params.availableBeds as string);
    const isEmergency = params.isEmergency === 'true';

    // Calculate dynamic reservation time based on distance
    const reservationMinutes = Math.max(30, Math.ceil(estimatedTime * 1.5));

    const initialValues = {
        emergencyTypes: [] as string[],
        bedType: 'general' as 'general' | 'icu',
        patientCondition: '',
        contactPerson: '',
        contactPhone: '',
        notes: '',
    };

    const handleConfirmBooking = async (values: typeof initialValues) => {
        setLoading(true);
        try {
            const booking = await emergencyService.bookEmergencyBed({
                hospital_id: hospitalId,
                emergency_type: values.emergencyTypes.join(', '),
                bed_type: values.bedType,
                patient_condition: values.patientCondition,
                contact_person: values.contactPerson,
                contact_phone: values.contactPhone,
                notes: values.notes,
                estimated_arrival_minutes: estimatedTime,
            });

            const reservationMinutes = Math.max(30, Math.ceil(estimatedTime * 1.5));
            Alert.alert(
                'Booking Confirmed!',
                `Your bed has been reserved at ${hospitalName}. Please arrive within ${reservationMinutes} minutes.`,
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

                <Formik
                    initialValues={initialValues}
                    validationSchema={bookingValidationSchema}
                    onSubmit={handleConfirmBooking}
                >
                    {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
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
                                <Text style={styles.label}>Emergency Type * (Select all that apply)</Text>
                                <View style={styles.emergencyTypeGrid}>
                                    {EMERGENCY_TYPES.map((type) => {
                                        const isSelected = values.emergencyTypes.includes(type);
                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.emergencyTypeButton,
                                                    isSelected && styles.emergencyTypeButtonActive,
                                                ]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setFieldValue('emergencyTypes', values.emergencyTypes.filter(t => t !== type));
                                                    } else {
                                                        setFieldValue('emergencyTypes', [...values.emergencyTypes, type]);
                                                    }
                                                }}
                                            >
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                                                )}
                                                <Text
                                                    style={[
                                                        styles.emergencyTypeText,
                                                        isSelected && styles.emergencyTypeTextActive,
                                                    ]}
                                                >
                                                    {type}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {touched.emergencyTypes && errors.emergencyTypes && (
                                    <Text style={styles.errorText}>{errors.emergencyTypes}</Text>
                                )}

                                {/* Bed Type Selection */}
                                <Text style={styles.label}>Bed Type *</Text>
                                <View style={styles.bedTypeContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.bedTypeButton,
                                            values.bedType === 'general' && styles.bedTypeButtonActive,
                                        ]}
                                        onPress={() => setFieldValue('bedType', 'general')}
                                    >
                                        <Ionicons
                                            name="bed-outline"
                                            size={20}
                                            color={values.bedType === 'general' ? '#FFF' : '#666'}
                                        />
                                        <Text
                                            style={[
                                                styles.bedTypeText,
                                                values.bedType === 'general' && styles.bedTypeTextActive,
                                            ]}
                                        >
                                            General Bed
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.bedTypeButton,
                                            values.bedType === 'icu' && styles.bedTypeButtonActive,
                                        ]}
                                        onPress={() => setFieldValue('bedType', 'icu')}
                                    >
                                        <Ionicons
                                            name="pulse-outline"
                                            size={20}
                                            color={values.bedType === 'icu' ? '#FFF' : '#666'}
                                        />
                                        <Text
                                            style={[
                                                styles.bedTypeText,
                                                values.bedType === 'icu' && styles.bedTypeTextActive,
                                            ]}
                                        >
                                            ICU Bed
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Patient Condition */}
                                <Text style={styles.label}>Patient Condition (Optional)</Text>
                                <TextInput
                                    style={[
                                        styles.textArea,
                                        touched.patientCondition && errors.patientCondition && { borderColor: '#ef4444', borderWidth: 1 }
                                    ]}
                                    value={values.patientCondition}
                                    onChangeText={handleChange('patientCondition')}
                                    placeholder="Describe the condition..."
                                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                    multiline
                                    numberOfLines={3}
                                />
                                {touched.patientCondition && errors.patientCondition && (
                                    <Text style={styles.errorText}>{errors.patientCondition}</Text>
                                )}

                                {/* Contact Person */}
                                <Text style={styles.label}>Contact Person *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        touched.contactPerson && errors.contactPerson && { borderColor: '#ef4444', borderWidth: 1 }
                                    ]}
                                    value={values.contactPerson}
                                    onChangeText={handleChange('contactPerson')}
                                    placeholder="Full name (required)"
                                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                />
                                {touched.contactPerson && errors.contactPerson && (
                                    <Text style={styles.errorText}>{errors.contactPerson}</Text>
                                )}

                                {/* Contact Phone */}
                                <Text style={styles.label}>Contact Phone *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        touched.contactPhone && errors.contactPhone && { borderColor: '#ef4444', borderWidth: 1 }
                                    ]}
                                    value={values.contactPhone}
                                    onChangeText={handleChange('contactPhone')}
                                    placeholder="Phone number (required)"
                                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                    keyboardType="phone-pad"
                                />
                                {touched.contactPhone && errors.contactPhone && (
                                    <Text style={styles.errorText}>{errors.contactPhone}</Text>
                                )}

                                {/* Additional Notes */}
                                <Text style={styles.label}>Additional Notes (Optional)</Text>
                                <TextInput
                                    style={[
                                        styles.textArea,
                                        touched.notes && errors.notes && { borderColor: '#ef4444', borderWidth: 1 }
                                    ]}
                                    value={values.notes}
                                    onChangeText={handleChange('notes')}
                                    placeholder="Any additional information..."
                                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                    multiline
                                    numberOfLines={3}
                                />
                                {touched.notes && errors.notes && (
                                    <Text style={styles.errorText}>{errors.notes}</Text>
                                )}
                            </View>

                            {/* Confirm Button */}
                            <TouchableOpacity
                                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                                onPress={() => handleSubmit()}
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
                                    Your bed will be reserved for {reservationMinutes} minutes ({emergencyService.formatTime(reservationMinutes)}). Please arrive at the
                                    hospital as soon as possible.
                                </Text>
                            </View>
                        </ScrollView>
                    )}
                </Formik>
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
        errorText: {
            color: '#ef4444',
            fontSize: 12,
            marginTop: 4,
            marginBottom: 8,
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
            flexDirection: 'row',
            alignItems: 'center',
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
            fontWeight: '700',
        },
        bedTypeContainer: {
            flexDirection: 'row',
            gap: 12,
        },
        bedTypeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 12,
            borderWidth: 2,
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
            gap: 8,
        },
        bedTypeButtonActive: {
            backgroundColor: '#EF4444',
            borderColor: '#DC2626',
        },
        bedTypeText: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#D1D5DB' : '#6B7280',
        },
        bedTypeTextActive: {
            color: '#FFFFFF',
            fontWeight: '700',
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
