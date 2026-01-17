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

interface ProfileFormValues {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    secondary_email: string;
    secondary_phone: string;
    current_address: string;
    current_address_city: string;
    current_address_state: string;
    current_address_pin: string;
}

const profileValidationSchema = Yup.object().shape({
    emergency_contact_name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    emergency_contact_phone: Yup.string()
        .matches(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
    secondary_email: Yup.string()
        .email('Please enter a valid email address'),
    secondary_phone: Yup.string()
        .matches(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
    current_address: Yup.string()
        .max(500, 'Address must be less than 500 characters'),
    current_address_city: Yup.string()
        .max(100, 'City must be less than 100 characters'),
    current_address_state: Yup.string()
        .max(100, 'State must be less than 100 characters'),
    current_address_pin: Yup.string()
        .matches(/^[1-9]\d{5}$/, 'PIN must be 6 digits and cannot start with 0'),
});

export default function ProfileSettings() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<ProfileFormValues>({
        emergency_contact_name: '',
        emergency_contact_phone: '',
        secondary_email: '',
        secondary_phone: '',
        current_address: '',
        current_address_city: '',
        current_address_state: '',
        current_address_pin: '',
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
                    secondary_email: user.profile.secondary_email || '',
                    secondary_phone: user.profile.secondary_phone || '',
                    current_address: user.profile.current_address?.address || '',
                    current_address_city: user.profile.current_address?.city || '',
                    current_address_state: user.profile.current_address?.state || '',
                    current_address_pin: user.profile.current_address?.pin || '',
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
            console.log('Submitting values:', values);

            // Prepare the data payload
            const payload: any = {
                emergency_contact_name: values.emergency_contact_name || null,
                emergency_contact_phone: values.emergency_contact_phone || null,
                secondary_email: values.secondary_email || null,
                secondary_phone: values.secondary_phone || null,
            };

            // Only include current_address if at least one field is filled
            if (values.current_address || values.current_address_city || values.current_address_state || values.current_address_pin) {
                payload.current_address = {
                    address: values.current_address || '',
                    city: values.current_address_city || '',
                    state: values.current_address_state || '',
                    pin: values.current_address_pin || '',
                };
            }

            console.log('Sending payload:', payload);

            // Update profile via API
            const response = await apiClient.put<User>('/auth/profile/', payload);

            console.log('Response:', response.data);

            // Update stored user with the full response (which includes updated profile)
            await authService.storeUser(response.data);

            Alert.alert('Success', 'Profile updated successfully');
            // Reload profile to show updated values
            await fetchProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.error
                || JSON.stringify(error.response?.data)
                || 'Failed to update profile';
            Alert.alert('Error', errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Change Password',
            'You will be redirected to change your password',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: () => {
                        // Navigate to starting screen
                        router.push('/pages/auth/StartingScreen');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Are you absolutely sure?',
                            'Type DELETE to confirm account deletion',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Confirm',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            // TODO: Implement delete account API
                                            await apiClient.delete('/auth/profile/');
                                            await authService.logout();
                                            router.replace('/');
                                        } catch (error) {
                                            Alert.alert('Error', 'Failed to delete account');
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
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

                        {/* Additional Details Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="add-circle-outline" size={24} color="#10b981" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Additional Details
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Optional contact information for backup purposes
                            </Text>

                            <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Secondary Email
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.secondary_email && errors.secondary_email ? '#ef4444' : 'transparent',
                                        borderWidth: touched.secondary_email && errors.secondary_email ? 1 : 0,
                                    }
                                ]}
                                value={values.secondary_email}
                                onChangeText={handleChange('secondary_email')}
                                onBlur={handleBlur('secondary_email')}
                                placeholder="secondary@email.com"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {touched.secondary_email && errors.secondary_email && (
                                <Text style={styles.errorText}>{errors.secondary_email}</Text>
                            )}

                            <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Secondary Phone
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.secondary_phone && errors.secondary_phone ? '#ef4444' : 'transparent',
                                        borderWidth: touched.secondary_phone && errors.secondary_phone ? 1 : 0,
                                    }
                                ]}
                                value={values.secondary_phone}
                                onChangeText={handleChange('secondary_phone')}
                                onBlur={handleBlur('secondary_phone')}
                                placeholder="+91XXXXXXXXXX"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                keyboardType="phone-pad"
                            />
                            {touched.secondary_phone && errors.secondary_phone && (
                                <Text style={styles.errorText}>{errors.secondary_phone}</Text>
                            )}
                        </View>

                        {/* Current Address Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="location-outline" size={24} color="#8b5cf6" />
                                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Current Address
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Your current residential address (not your Aadhaar address)
                            </Text>

                            <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Full Address
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                        borderColor: touched.current_address && errors.current_address ? '#ef4444' : 'transparent',
                                        borderWidth: touched.current_address && errors.current_address ? 1 : 0,
                                    }
                                ]}
                                value={values.current_address}
                                onChangeText={handleChange('current_address')}
                                onBlur={handleBlur('current_address')}
                                placeholder="House/Flat number, Street name, Locality"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                multiline
                                numberOfLines={3}
                            />
                            {touched.current_address && errors.current_address && (
                                <Text style={styles.errorText}>{errors.current_address}</Text>
                            )}

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        City
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                color: isDark ? '#ffffff' : '#111827',
                                                borderColor: touched.current_address_city && errors.current_address_city ? '#ef4444' : 'transparent',
                                                borderWidth: touched.current_address_city && errors.current_address_city ? 1 : 0,
                                            }
                                        ]}
                                        value={values.current_address_city}
                                        onChangeText={handleChange('current_address_city')}
                                        onBlur={handleBlur('current_address_city')}
                                        placeholder="City"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    />
                                    {touched.current_address_city && errors.current_address_city && (
                                        <Text style={styles.errorText}>{errors.current_address_city}</Text>
                                    )}
                                </View>

                                <View style={styles.halfWidth}>
                                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        State
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                color: isDark ? '#ffffff' : '#111827',
                                                borderColor: touched.current_address_state && errors.current_address_state ? '#ef4444' : 'transparent',
                                                borderWidth: touched.current_address_state && errors.current_address_state ? 1 : 0,
                                            }
                                        ]}
                                        value={values.current_address_state}
                                        onChangeText={handleChange('current_address_state')}
                                        onBlur={handleBlur('current_address_state')}
                                        placeholder="State"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    />
                                    {touched.current_address_state && errors.current_address_state && (
                                        <Text style={styles.errorText}>{errors.current_address_state}</Text>
                                    )}
                                </View>

                                <View style={styles.halfWidth}>
                                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        PIN Code
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                color: isDark ? '#ffffff' : '#111827',
                                                borderColor: touched.current_address_pin && errors.current_address_pin ? '#ef4444' : 'transparent',
                                                borderWidth: touched.current_address_pin && errors.current_address_pin ? 1 : 0,
                                            }
                                        ]}
                                        value={values.current_address_pin}
                                        onChangeText={handleChange('current_address_pin')}
                                        onBlur={handleBlur('current_address_pin')}
                                        placeholder="6-digit PIN"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        keyboardType="numeric"
                                        maxLength={6}
                                    />
                                    {touched.current_address_pin && errors.current_address_pin && (
                                        <Text style={styles.errorText}>{errors.current_address_pin}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Danger Zone */}
                        <View style={[styles.dangerZone, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: '#ef4444' }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="warning-outline" size={24} color="#ef4444" />
                                <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                                    Danger Zone
                                </Text>
                            </View>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Critical settings - These actions cannot be undone
                            </Text>

                            <TouchableOpacity
                                style={[styles.dangerButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
                                onPress={handleChangePassword}
                            >
                                <View style={styles.dangerButtonContent}>
                                    <View style={styles.dangerButtonLeft}>
                                        <Ionicons name="key-outline" size={20} color={isDark ? '#ffffff' : '#111827'} />
                                        <View style={styles.dangerButtonText}>
                                            <Text style={[styles.dangerButtonTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                Change Password
                                            </Text>
                                            <Text style={[styles.dangerButtonSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                Update your account password
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.dangerButton, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                                onPress={handleDeleteAccount}
                            >
                                <View style={styles.dangerButtonContent}>
                                    <View style={styles.dangerButtonLeft}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        <View style={styles.dangerButtonText}>
                                            <Text style={[styles.dangerButtonTitle, { color: '#ef4444' }]}>
                                                Delete Account
                                            </Text>
                                            <Text style={[styles.dangerButtonSubtitle, { color: '#991b1b' }]}>
                                                Permanently delete your account and all data
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                                </View>
                            </TouchableOpacity>
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
        marginTop: 24,
        marginBottom: 32,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    dangerZone: {
        borderWidth: 2,
        borderColor: '#ef4444',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    dangerButton: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dangerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dangerButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    dangerButtonText: {
        flex: 1,
    },
    dangerButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    dangerButtonSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
});
