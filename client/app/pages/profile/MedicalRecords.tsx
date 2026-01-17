import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../../config/api';
import { authService } from '../../../services/authService';
import type { User } from '../../../config/api';

interface MedicalFormValues {
    medical_allergies: string;
    current_medications: string;
    medical_conditions: string;
    previous_surgeries: string;
}

const medicalValidationSchema = Yup.object().shape({
    medical_allergies: Yup.string()
        .max(1000, 'Allergies description must be less than 1000 characters'),
    current_medications: Yup.string()
        .max(1000, 'Medications list must be less than 1000 characters'),
    medical_conditions: Yup.string()
        .max(1000, 'Medical conditions must be less than 1000 characters'),
    previous_surgeries: Yup.string()
        .max(1000, 'Surgery history must be less than 1000 characters'),
});

export default function MedicalRecords() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<MedicalFormValues>({
        medical_allergies: '',
        current_medications: '',
        medical_conditions: '',
        previous_surgeries: '',
    });

    useEffect(() => {
        fetchMedicalRecords();
    }, []);

    const fetchMedicalRecords = async () => {
        try {
            setLoading(true);
            const user = await authService.getStoredUser();

            if (user?.profile) {
                setInitialValues({
                    medical_allergies: user.profile.medical_allergies || '',
                    current_medications: user.profile.current_medications || '',
                    medical_conditions: user.profile.medical_conditions || '',
                    previous_surgeries: user.profile.previous_surgeries || '',
                });
            }
        } catch (error) {
            console.error('Error fetching medical records:', error);
            Alert.alert('Error', 'Failed to load medical records');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: MedicalFormValues, { setSubmitting }: any) => {
        try {
            // Update medical records via API
            const response = await apiClient.put<User>('/auth/profile/', values);

            // Update stored user with the full response (which includes updated profile)
            await authService.storeUser(response.data);

            Alert.alert('Success', 'Medical records updated successfully');
            router.back();
        } catch (error: any) {
            console.error('Error updating medical records:', error);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.error
                || 'Failed to update medical records';
            Alert.alert('Error', errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Medical Records
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <Formik
                initialValues={initialValues}
                validationSchema={medicalValidationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                    <ScrollView style={styles.content}>
                        {/* Important Notice */}
                        <View style={[styles.notice, { backgroundColor: isDark ? '#1f2937' : '#fef3c7' }]}>
                            <Ionicons name="information-circle" size={24} color="#f59e0b" />
                            <Text style={[styles.noticeText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                                This information helps medical professionals provide better emergency care. Please keep it updated.
                            </Text>
                        </View>

                        {/* Allergies Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="warning-outline" size={24} color="#ef4444" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Allergies
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                List any known allergies (medications, food, environmental)
                            </Text>

                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.medical_allergies && errors.medical_allergies ? '#ef4444' : 'transparent',
                                        borderWidth: touched.medical_allergies && errors.medical_allergies ? 1 : 0,
                                    }
                                ]}
                                value={values.medical_allergies}
                                onChangeText={handleChange('medical_allergies')}
                                onBlur={handleBlur('medical_allergies')}
                                placeholder="e.g., Penicillin, Peanuts, Pollen, Latex..."
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                multiline
                                numberOfLines={4}
                            />
                            {touched.medical_allergies && errors.medical_allergies && (
                                <Text style={styles.errorText}>{errors.medical_allergies}</Text>
                            )}
                        </View>

                        {/* Current Medications Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="medical-outline" size={24} color="#3b82f6" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Current Medications
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                List all medications you are currently taking (include dosage if possible)
                            </Text>

                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.current_medications && errors.current_medications ? '#ef4444' : 'transparent',
                                        borderWidth: touched.current_medications && errors.current_medications ? 1 : 0,
                                    }
                                ]}
                                value={values.current_medications}
                                onChangeText={handleChange('current_medications')}
                                onBlur={handleBlur('current_medications')}
                                placeholder="e.g., Aspirin 100mg daily, Metformin 500mg twice daily..."
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                multiline
                                numberOfLines={4}
                            />
                            {touched.current_medications && errors.current_medications && (
                                <Text style={styles.errorText}>{errors.current_medications}</Text>
                            )}
                        </View>

                        {/* Medical Conditions Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="fitness-outline" size={24} color="#10b981" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Medical Conditions
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                List any chronic or current medical conditions
                            </Text>

                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.medical_conditions && errors.medical_conditions ? '#ef4444' : 'transparent',
                                        borderWidth: touched.medical_conditions && errors.medical_conditions ? 1 : 0,
                                    }
                                ]}
                                value={values.medical_conditions}
                                onChangeText={handleChange('medical_conditions')}
                                onBlur={handleBlur('medical_conditions')}
                                placeholder="e.g., Type 2 Diabetes, Hypertension, Asthma..."
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                multiline
                                numberOfLines={4}
                            />
                            {touched.medical_conditions && errors.medical_conditions && (
                                <Text style={styles.errorText}>{errors.medical_conditions}</Text>
                            )}
                        </View>

                        {/* Previous Surgeries Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="bandage-outline" size={24} color="#8b5cf6" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Previous Surgeries
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                List any surgeries or major medical procedures (include approximate dates if possible)
                            </Text>

                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.previous_surgeries && errors.previous_surgeries ? '#ef4444' : 'transparent',
                                        borderWidth: touched.previous_surgeries && errors.previous_surgeries ? 1 : 0,
                                    }
                                ]}
                                value={values.previous_surgeries}
                                onChangeText={handleChange('previous_surgeries')}
                                onBlur={handleBlur('previous_surgeries')}
                                placeholder="e.g., Appendectomy (2020), Knee Surgery (2018)..."
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                multiline
                                numberOfLines={4}
                            />
                            {touched.previous_surgeries && errors.previous_surgeries && (
                                <Text style={styles.errorText}>{errors.previous_surgeries}</Text>
                            )}
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                            onPress={() => handleSubmit()}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="#ffffff" />
                                    <Text style={styles.saveButtonText}>Save Medical Records</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </Formik>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    noticeText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    textArea: {
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 24,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
