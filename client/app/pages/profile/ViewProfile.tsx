import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../../services/authService';
import type { User } from '../../../config/api';

export default function ViewProfile() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const storedUser = await authService.getStoredUser();
            setUser(storedUser);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
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
                    View Profile
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Picture Section */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.profilePictureContainer}>
                        <Image
                            source={
                                user?.profile?.profile_picture
                                    ? { uri: user.profile.profile_picture }
                                    : require('../../../assets/images/default.png')
                            }
                            style={styles.profilePicture}
                        />
                    </View>
                </View>

                {/* Basic Information */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={24} color="#3b82f6" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Basic Information
                        </Text>
                    </View>

                    <InfoRow
                        label="Full Name"
                        value={`${user?.first_name || ''} ${user?.last_name || ''}`}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Email"
                        value={user?.email || 'N/A'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Username"
                        value={user?.username || 'N/A'}
                        isDark={isDark}
                    />
                </View>

                {/* Personal Information */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar-outline" size={24} color="#10b981" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Personal Information
                        </Text>
                    </View>

                    <InfoRow
                        label="Date of Birth"
                        value={user?.profile?.date_of_birth || 'N/A'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Phone Number"
                        value={user?.profile?.phone_number || 'N/A'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Aadhaar Number"
                        value={user?.profile?.aadhaar_number || 'N/A'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Aadhaar Verified"
                        value={user?.profile?.aadhaar_verified ? 'Yes' : 'No'}
                        isDark={isDark}
                    />
                </View>

                {/* Permanent Address */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="home-outline" size={24} color="#8b5cf6" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Permanent Address
                        </Text>
                    </View>

                    {user?.profile?.permanent_address ? (
                        <>
                            <InfoRow
                                label="Address"
                                value={user.profile.permanent_address.address || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="City"
                                value={user.profile.permanent_address.city || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="State"
                                value={user.profile.permanent_address.state || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="PIN Code"
                                value={user.profile.permanent_address.pin || 'N/A'}
                                isDark={isDark}
                            />
                        </>
                    ) : (
                        <Text style={[styles.noData, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            No permanent address on record
                        </Text>
                    )}
                </View>

                {/* Current Address */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={24} color="#f59e0b" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Current Address
                        </Text>
                    </View>

                    {user?.profile?.current_address ? (
                        <>
                            <InfoRow
                                label="Address"
                                value={user.profile.current_address.address || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="City"
                                value={user.profile.current_address.city || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="State"
                                value={user.profile.current_address.state || 'N/A'}
                                isDark={isDark}
                            />
                            <InfoRow
                                label="PIN Code"
                                value={user.profile.current_address.pin || 'N/A'}
                                isDark={isDark}
                            />
                        </>
                    ) : (
                        <Text style={[styles.noData, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            No current address on record
                        </Text>
                    )}
                </View>

                {/* Preferences */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings-outline" size={24} color="#06b6d4" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Preferences
                        </Text>
                    </View>

                    <InfoRow
                        label="Preferred Language"
                        value={user?.profile?.preferred_language || 'N/A'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Referral Code"
                        value={user?.profile?.referral_code || 'None'}
                        isDark={isDark}
                    />
                </View>

                {/* Account Status */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Account Status
                        </Text>
                    </View>

                    <InfoRow
                        label="Account Active"
                        value={user?.is_active ? 'Yes' : 'No'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Email Verified"
                        value={user?.profile?.email_verified ? 'Yes' : 'No'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Phone Verified"
                        value={user?.profile?.phone_verified ? 'Yes' : 'No'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Profile Verified"
                        value={user?.profile?.is_verified ? 'Yes' : 'No'}
                        isDark={isDark}
                    />
                    <InfoRow
                        label="Member Since"
                        value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                        isDark={isDark}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

// Helper component for displaying information rows
interface InfoRowProps {
    label: string;
    value: string;
    isDark: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isDark }) => (
    <View style={styles.infoRow}>
        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {label}
        </Text>
        <Text style={[styles.value, { color: isDark ? '#ffffff' : '#111827' }]}>
            {value}
        </Text>
    </View>
);

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
    profilePictureContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#3b82f6',
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
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionDescription: {
        fontSize: 13,
        marginBottom: 12,
        marginTop: -8,
    },
    infoRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
    },
    noData: {
        fontSize: 14,
        fontStyle: 'italic',
        paddingVertical: 12,
    },
});
