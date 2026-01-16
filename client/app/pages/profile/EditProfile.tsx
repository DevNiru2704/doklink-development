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
import apiClient from '../../../config/api';
import { authService } from '../../../services/authService';

interface UserProfile {
    phone_number: string;
    date_of_birth: string;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    medical_allergies: string | null;
    current_medications: string | null;
    medical_conditions: string | null;
    previous_surgeries: string | null;
}

export default function EditProfile() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        phone_number: '',
        date_of_birth: '',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_allergies: null,
        current_medications: null,
        medical_conditions: null,
        previous_surgeries: null,
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const user = await authService.getStoredUser();

            if (user?.profile) {
                setProfile({
                    phone_number: user.profile.phone_number || '',
                    date_of_birth: user.profile.date_of_birth || '',
                    emergency_contact_name: user.profile.emergency_contact_name || '',
                    emergency_contact_phone: user.profile.emergency_contact_phone || '',
                    medical_allergies: user.profile.medical_allergies || '',
                    current_medications: user.profile.current_medications || '',
                    medical_conditions: user.profile.medical_conditions || '',
                    previous_surgeries: user.profile.previous_surgeries || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Update profile via API
            const response = await apiClient.patch('/auth/profile/update/', profile);

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
            Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
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
                    Edit Profile
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Emergency Contact Section */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Emergency Contact
                    </Text>

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Contact Name
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.emergency_contact_name || ''}
                        onChangeText={(text) => setProfile({ ...profile, emergency_contact_name: text })}
                        placeholder="e.g., John Doe"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    />

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Contact Phone
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.emergency_contact_phone || ''}
                        onChangeText={(text) => setProfile({ ...profile, emergency_contact_phone: text })}
                        placeholder="+91XXXXXXXXXX"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Medical Information Section */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Medical Information
                    </Text>

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Allergies
                    </Text>
                    <TextInput
                        style={[styles.textArea, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.medical_allergies || ''}
                        onChangeText={(text) => setProfile({ ...profile, medical_allergies: text })}
                        placeholder="List any known allergies (medications, food, environmental)"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Current Medications
                    </Text>
                    <TextInput
                        style={[styles.textArea, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.current_medications || ''}
                        onChangeText={(text) => setProfile({ ...profile, current_medications: text })}
                        placeholder="List medications you are currently taking"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Medical Conditions
                    </Text>
                    <TextInput
                        style={[styles.textArea, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.medical_conditions || ''}
                        onChangeText={(text) => setProfile({ ...profile, medical_conditions: text })}
                        placeholder="List any chronic or current medical conditions"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Previous Surgeries
                    </Text>
                    <TextInput
                        style={[styles.textArea, {
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                        value={profile.previous_surgeries || ''}
                        onChangeText={(text) => setProfile({ ...profile, previous_surgeries: text })}
                        placeholder="List any surgeries or major procedures"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#ffffff" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
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
    textArea: {
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
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
