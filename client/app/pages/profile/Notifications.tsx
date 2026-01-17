// app/pages/profile/Notifications.tsx
import React, { useState, useEffect } from 'react';
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
import { authService } from '@/services/authService';

interface NotificationSettings {
    emergencyAlerts: boolean;
    bookingUpdates: boolean;
    appointmentReminders: boolean;
    healthTips: boolean;
    promotions: boolean;
    systemUpdates: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
}

export default function Notifications() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [settings, setSettings] = useState<NotificationSettings>({
        emergencyAlerts: true,
        bookingUpdates: true,
        appointmentReminders: true,
        healthTips: false,
        promotions: false,
        systemUpdates: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const user = await authService.getStoredUser();
            if (user?.profile) {
                // Load from user profile if available
                setSettings(prev => ({
                    ...prev,
                    pushNotifications: user.profile.notifications_enabled || false,
                }));
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const handleToggle = (key: keyof NotificationSettings) => {
        // Prevent disabling critical notifications
        if (key === 'emergencyAlerts' && settings[key]) {
            Alert.alert(
                'Emergency Alerts',
                'Emergency alerts cannot be disabled for your safety.',
                [{ text: 'OK' }]
            );
            return;
        }

        setSettings(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            // Here you would save to backend
            // await authService.updateNotificationSettings(settings);
            Alert.alert('Success', 'Notification preferences saved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save notification preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const notificationSections = [
        {
            title: 'Critical Notifications',
            description: 'Important updates that affect your health and safety',
            items: [
                {
                    key: 'emergencyAlerts' as keyof NotificationSettings,
                    icon: 'alert-circle',
                    title: 'Emergency Alerts',
                    description: 'Urgent notifications about emergency situations',
                    critical: true,
                },
                {
                    key: 'bookingUpdates' as keyof NotificationSettings,
                    icon: 'bed',
                    title: 'Booking Updates',
                    description: 'Status updates for your bed bookings',
                    critical: false,
                },
            ],
        },
        {
            title: 'General Notifications',
            description: 'Stay informed about your health and appointments',
            items: [
                {
                    key: 'appointmentReminders' as keyof NotificationSettings,
                    icon: 'calendar',
                    title: 'Appointment Reminders',
                    description: 'Reminders for upcoming appointments',
                    critical: false,
                },
                {
                    key: 'healthTips' as keyof NotificationSettings,
                    icon: 'fitness',
                    title: 'Health Tips',
                    description: 'Personalized health tips and wellness advice',
                    critical: false,
                },
                {
                    key: 'systemUpdates' as keyof NotificationSettings,
                    icon: 'information-circle',
                    title: 'System Updates',
                    description: 'Updates about new features and improvements',
                    critical: false,
                },
            ],
        },
        {
            title: 'Marketing',
            description: 'Optional promotional content',
            items: [
                {
                    key: 'promotions' as keyof NotificationSettings,
                    icon: 'pricetag',
                    title: 'Promotions & Offers',
                    description: 'Special offers and promotional content',
                    critical: false,
                },
            ],
        },
        {
            title: 'Notification Channels',
            description: 'Choose how you want to receive notifications',
            items: [
                {
                    key: 'pushNotifications' as keyof NotificationSettings,
                    icon: 'phone-portrait',
                    title: 'Push Notifications',
                    description: 'In-app notifications on your device',
                    critical: false,
                },
                {
                    key: 'emailNotifications' as keyof NotificationSettings,
                    icon: 'mail',
                    title: 'Email Notifications',
                    description: 'Receive notifications via email',
                    critical: false,
                },
                {
                    key: 'smsNotifications' as keyof NotificationSettings,
                    icon: 'chatbox',
                    title: 'SMS Notifications',
                    description: 'Receive notifications via text message',
                    critical: false,
                },
            ],
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Notifications
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Description */}
                <View style={[styles.descriptionCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Ionicons name="notifications-outline" size={32} color="#3b82f6" />
                    <Text style={[styles.descriptionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Manage Your Notifications
                    </Text>
                    <Text style={[styles.descriptionText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Control what notifications you receive and how you receive them. Some critical
                        notifications cannot be disabled for your safety.
                    </Text>
                </View>

                {/* Notification Sections */}
                {notificationSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                {section.title}
                            </Text>
                            <Text style={[styles.sectionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {section.description}
                            </Text>
                        </View>

                        <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            {section.items.map((item, itemIndex) => (
                                <View key={item.key}>
                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationLeft}>
                                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                                <Ionicons
                                                    name={item.icon as any}
                                                    size={24}
                                                    color={item.critical ? '#ef4444' : '#3b82f6'}
                                                />
                                            </View>
                                            <View style={styles.notificationText}>
                                                <View style={styles.titleRow}>
                                                    <Text style={[styles.notificationTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                        {item.title}
                                                    </Text>
                                                    {item.critical && (
                                                        <View style={styles.criticalBadge}>
                                                            <Text style={styles.criticalText}>Required</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[styles.notificationDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {item.description}
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={settings[item.key]}
                                            onValueChange={() => handleToggle(item.key)}
                                            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                                            thumbColor={settings[item.key] ? '#3b82f6' : '#f3f4f6'}
                                            disabled={item.critical}
                                        />
                                    </View>
                                    {itemIndex < section.items.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSaveSettings}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </Text>
                </TouchableOpacity>

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
    descriptionCard: {
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    descriptionText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 13,
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
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    notificationLeft: {
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
    notificationText: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    criticalBadge: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    criticalText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#ef4444',
    },
    notificationDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 32,
    },
});
