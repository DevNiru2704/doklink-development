// app/pages/profile/PrivacySecurity.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import the actual policy pages
import PrivacyPolicy from '../auth/PrivacyPolicy';
import DataCollectionConsentForm from '../auth/DataCollectionConsentForm';
import TermsAndCondition from '../auth/TermsAndCondition';

export default function PrivacySecurity() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [currentView, setCurrentView] = useState<'main' | 'privacy' | 'data' | 'terms'>('main');

    const [settings, setSettings] = useState({
        shareLocation: true,
        shareWithDoctors: true,
        anonymousAnalytics: true,
        biometricAuth: false,
        twoFactorAuth: false,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleViewPrivacyPolicy = () => {
        setCurrentView('privacy');
    };

    const handleViewDataPolicy = () => {
        setCurrentView('data');
    };

    const handleViewTerms = () => {
        setCurrentView('terms');
    };

    const handleBackToMain = () => {
        setCurrentView('main');
    };

    const handleDownloadData = () => {
        Alert.alert(
            'Download Your Data',
            'We will prepare a copy of your data and send it to your registered email address within 48 hours.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Request', onPress: () => Alert.alert('Success', 'Data download request submitted') },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Final Confirmation',
                            'This will permanently delete your account and all associated data. Type DELETE to confirm.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Confirm Deletion', style: 'destructive' },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const privacyItems = [
        {
            icon: 'location',
            title: 'Location Sharing',
            description: 'Share your location for hospital search',
            key: 'shareLocation' as keyof typeof settings,
            hasToggle: true,
        },
        {
            icon: 'medical',
            title: 'Share with Healthcare Providers',
            description: 'Allow hospitals to access your medical records',
            key: 'shareWithDoctors' as keyof typeof settings,
            hasToggle: true,
        },
        {
            icon: 'analytics',
            title: 'Anonymous Analytics',
            description: 'Help improve the app with usage data',
            key: 'anonymousAnalytics' as keyof typeof settings,
            hasToggle: true,
        },
    ];

    const securityItems = [
        {
            icon: 'finger-print',
            title: 'Biometric Authentication',
            description: 'Use fingerprint or face ID to login',
            key: 'biometricAuth' as keyof typeof settings,
            hasToggle: true,
        },
        {
            icon: 'shield-checkmark',
            title: 'Two-Factor Authentication',
            description: 'Add an extra layer of security',
            key: 'twoFactorAuth' as keyof typeof settings,
            hasToggle: true,
        },
    ];

    const documentItems = [
        {
            icon: 'document-text',
            title: 'Privacy Policy',
            description: 'View our privacy policy',
            onPress: handleViewPrivacyPolicy,
        },
        {
            icon: 'document-lock',
            title: 'Data Collection Consent',
            description: 'Review what data we collect',
            onPress: handleViewDataPolicy,
        },
        {
            icon: 'document',
            title: 'Terms & Conditions',
            description: 'Read our terms of service',
            onPress: handleViewTerms,
        },
    ];

    const dataManagementItems = [
        {
            icon: 'download',
            title: 'Download My Data',
            description: 'Get a copy of all your data',
            onPress: handleDownloadData,
            color: '#3b82f6',
        },
        {
            icon: 'trash',
            title: 'Delete My Account',
            description: 'Permanently delete your account',
            onPress: handleDeleteAccount,
            color: '#ef4444',
        },
    ];

    // Show the policy pages when selected
    if (currentView === 'privacy') {
        return <PrivacyPolicy onBack={handleBackToMain} />;
    }

    if (currentView === 'data') {
        return <DataCollectionConsentForm onBack={handleBackToMain} />;
    }

    if (currentView === 'terms') {
        return <TermsAndCondition onBack={handleBackToMain} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Privacy & Security
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Privacy Settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield" size={24} color="#3b82f6" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Privacy Settings
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        {privacyItems.map((item, index) => (
                            <View key={item.key}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                            <Ionicons name={item.icon as any} size={24} color="#3b82f6" />
                                        </View>
                                        <View style={styles.settingText}>
                                            <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    {item.hasToggle && (
                                        <Switch
                                            value={settings[item.key]}
                                            onValueChange={() => handleToggle(item.key)}
                                            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                                            thumbColor={settings[item.key] ? '#3b82f6' : '#f3f4f6'}
                                        />
                                    )}
                                </View>
                                {index < privacyItems.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Security Settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="lock-closed" size={24} color="#10b981" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Security Settings
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        {securityItems.map((item, index) => (
                            <View key={item.key}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                            <Ionicons name={item.icon as any} size={24} color="#10b981" />
                                        </View>
                                        <View style={styles.settingText}>
                                            <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    {item.hasToggle && (
                                        <Switch
                                            value={settings[item.key]}
                                            onValueChange={() => handleToggle(item.key)}
                                            trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                            thumbColor={settings[item.key] ? '#10b981' : '#f3f4f6'}
                                        />
                                    )}
                                </View>
                                {index < securityItems.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Legal Documents */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={24} color="#8b5cf6" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Legal & Policies
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        {documentItems.map((item, index) => (
                            <View key={index}>
                                <TouchableOpacity style={styles.settingItem} onPress={item.onPress}>
                                    <View style={styles.settingLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                            <Ionicons name={item.icon as any} size={24} color="#8b5cf6" />
                                        </View>
                                        <View style={styles.settingText}>
                                            <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </TouchableOpacity>
                                {index < documentItems.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Data Management */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="server" size={24} color="#f59e0b" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Data Management
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        {dataManagementItems.map((item, index) => (
                            <View key={index}>
                                <TouchableOpacity style={styles.settingItem} onPress={item.onPress}>
                                    <View style={styles.settingLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                                        </View>
                                        <View style={styles.settingText}>
                                            <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </TouchableOpacity>
                                {index < dataManagementItems.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
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
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
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
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    bottomSpacing: {
        height: 32,
    },
});
