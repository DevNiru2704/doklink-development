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

interface ProfileFormValues {
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

const profileValidationSchema = Yup.object().shape({
    emergency_contact_name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    emergency_contact_phone: Yup.string()
        .matches(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
});

export default function ProfileSettings() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<ProfileFormValues>({
        emergency_contact_name: '',
        emergency_contact_phone: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const user = await authService.getStoredUser();

            if (user?.profile) {
                setInitialValues({
                    emergency_contact_name: user.profile.emergency_contact_name || '',
                    emergency_contact_phone: user.profile.emergency_contact_phone || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: ProfileFormValues, { setSubmitting }: any) => {
        try {
            // Update profile via API
            const response = await apiClient.patch('/auth/profile/update/', values);

            // Update stored user
            const user = await authService.getStoredUser();
            if (user?.profile) {
                user.profile = Object.assign({}, user.profile, response.data);
                await authService.storeUser(user);
            }

            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.error
                || 'Failed to update profile';
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
                    Profile Settings
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <Formik
                initialValues={initialValues}
                validationSchema={profileValidationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                    <ScrollView style={styles.content}>
                        {/* Emergency Contact Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="call-outline" size={24} color="#3b82f6" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Emergency Contact
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                This person will be contacted in case of medical emergencies
                            </Text>

                            <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Contact Name
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.emergency_contact_name && errors.emergency_contact_name ? '#ef4444' : 'transparent',
                                        borderWidth: touched.emergency_contact_name && errors.emergency_contact_name ? 1 : 0,
                                    }
                                ]}
                                value={values.emergency_contact_name}
                                onChangeText={handleChange('emergency_contact_name')}
                                onBlur={handleBlur('emergency_contact_name')}
                                placeholder="e.g., John Doe"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                            />
                            {touched.emergency_contact_name && errors.emergency_contact_name && (
                                <Text style={styles.errorText}>{errors.emergency_contact_name}</Text>
                            )}

                            <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Contact Phone
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.emergency_contact_phone && errors.emergency_contact_phone ? '#ef4444' : 'transparent',
                                        borderWidth: touched.emergency_contact_phone && errors.emergency_contact_phone ? 1 : 0,
                                    }
                                ]}
                                value={values.emergency_contact_phone}
                                onChangeText={handleChange('emergency_contact_phone')}
                                onBlur={handleBlur('emergency_contact_phone')}
                                placeholder="+91XXXXXXXXXX"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                keyboardType="phone-pad"
                            />
                            {touched.emergency_contact_phone && errors.emergency_contact_phone && (
                                <Text style={styles.errorText}>{errors.emergency_contact_phone}</Text>
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
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
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
        marginBottom: 16,
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
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
