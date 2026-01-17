// app/pages/profile/HelpSupport.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Linking,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpSupport() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const contactMethods = [
        {
            icon: 'mail',
            title: 'Email Support',
            description: 'support@doklink.in',
            action: () => Linking.openURL('mailto:support@doklink.in'),
            color: '#3b82f6',
        },
        {
            icon: 'call',
            title: 'Phone Support',
            description: '+91 1800-123-4567 (Toll Free)',
            action: () => Linking.openURL('tel:18001234567'),
            color: '#10b981',
        },
        {
            icon: 'chatbubbles',
            title: 'Live Chat',
            description: 'Available 24/7',
            action: () => Alert.alert('Live Chat', 'Live chat feature coming soon!'),
            color: '#8b5cf6',
        },
        {
            icon: 'logo-whatsapp',
            title: 'WhatsApp',
            description: '+91 98765-43210',
            action: () => Linking.openURL('https://wa.me/919876543210'),
            color: '#25d366',
        },
    ];

    const faqItems = [
        {
            question: 'How do I book an emergency bed?',
            answer: 'Go to the Home screen, tap the "Emergency Booking" button, select your location, choose a hospital with available beds, fill in the patient details, and confirm your booking. You will receive a confirmation with a countdown timer.',
        },
        {
            question: 'How long is my bed reservation valid?',
            answer: 'Your bed reservation is valid for 30 minutes to 3 hours 45 minutes depending on the distance to the hospital. A countdown timer will show you exactly how much time you have left.',
        },
        {
            question: 'Can I cancel my booking?',
            answer: 'Yes, you can cancel your booking anytime before arrival by going to your active booking and tapping the "Cancel Booking" button. Please cancel as soon as possible so the bed becomes available for others.',
        },
        {
            question: 'How do I update my medical records?',
            answer: 'Go to MySpace → Medical Records. Here you can add or update your allergies, current medications, medical conditions, and previous surgeries.',
        },
        {
            question: 'How does insurance verification work?',
            answer: 'When selecting a hospital, you will see insurance badges showing which providers are accepted. Green badges indicate in-network (lower cost) and gray badges indicate out-of-network coverage.',
        },
        {
            question: 'Is my data secure?',
            answer: 'Yes, we use industry-standard encryption and follow strict data protection regulations. Your medical information is stored securely and only shared with hospitals you choose to book with.',
        },
        {
            question: 'What if I can\'t find a hospital nearby?',
            answer: 'Use the radius slider on the hospital search screen to expand your search area up to 200km. The app will show you the nearest available hospitals with beds.',
        },
        {
            question: 'How do I add or manage insurance policies?',
            answer: 'Go to MySpace → Insurance. You can add new policies, edit existing ones, and view which policies are active or expired.',
        },
        {
            question: 'What should I do if I arrive at the hospital?',
            answer: 'Once you arrive, tap the "I\'ve Arrived" button in your active booking. This will notify the hospital and update your booking status.',
        },
        {
            question: 'How can I change my notification settings?',
            answer: 'Go to MySpace → Notifications to customize what notifications you receive and how you receive them (push, email, SMS).',
        },
    ];

    const quickActions = [
        {
            icon: 'book',
            title: 'User Guide',
            description: 'Learn how to use DokLink',
            action: () => Alert.alert('User Guide', 'User guide will be available soon!'),
        },
        {
            icon: 'videocam',
            title: 'Video Tutorials',
            description: 'Watch step-by-step tutorials',
            action: () => Alert.alert('Video Tutorials', 'Video tutorials coming soon!'),
        },
        {
            icon: 'bug',
            title: 'Report a Bug',
            description: 'Help us improve the app',
            action: () => Alert.alert('Report Bug', 'Please email bugs to support@doklink.in'),
        },
        {
            icon: 'star',
            title: 'Rate Our App',
            description: 'Share your feedback',
            action: () => Alert.alert('Rate App', 'Thank you for your feedback!'),
        },
    ];

    const toggleFaq = (index: number) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Help & Support
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Emergency Notice */}
                <View style={styles.emergencyNotice}>
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                    <View style={styles.emergencyText}>
                        <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
                        <Text style={styles.emergencyDescription}>
                            Call 108 (India) or your local emergency number immediately
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.emergencyButton}
                        onPress={() => Linking.openURL('tel:108')}
                    >
                        <Ionicons name="call" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* Contact Methods */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Contact Us
                    </Text>
                    <View style={styles.contactGrid}>
                        {contactMethods.map((method, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.contactCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                                onPress={method.action}
                            >
                                <View style={[styles.contactIcon, { backgroundColor: `${method.color}20` }]}>
                                    <Ionicons name={method.icon as any} size={28} color={method.color} />
                                </View>
                                <Text style={[styles.contactTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {method.title}
                                </Text>
                                <Text style={[styles.contactDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {method.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Quick Actions
                    </Text>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        {quickActions.map((action, index) => (
                            <View key={index}>
                                <TouchableOpacity style={styles.actionItem} onPress={action.action}>
                                    <View style={styles.actionLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                            <Ionicons name={action.icon as any} size={24} color="#3b82f6" />
                                        </View>
                                        <View style={styles.actionText}>
                                            <Text style={[styles.actionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {action.title}
                                            </Text>
                                            <Text style={[styles.actionDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                {action.description}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </TouchableOpacity>
                                {index < quickActions.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Frequently Asked Questions
                    </Text>
                    <View style={styles.faqContainer}>
                        {faqItems.map((faq, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.faqItem, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                                onPress={() => toggleFaq(index)}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={[styles.faqQuestion, { color: isDark ? '#ffffff' : '#111827' }]}>
                                        {faq.question}
                                    </Text>
                                    <Ionicons
                                        name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={isDark ? '#9ca3af' : '#6b7280'}
                                    />
                                </View>
                                {expandedFaq === index && (
                                    <Text style={[styles.faqAnswer, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {faq.answer}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={[styles.appInfo, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.appInfoTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        DokLink
                    </Text>
                    <Text style={[styles.appInfoText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Version 1.0.0
                    </Text>
                    <Text style={[styles.appInfoText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        © 2026 DokLink. All rights reserved.
                    </Text>
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
    emergencyNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    emergencyText: {
        flex: 1,
        marginLeft: 12,
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
        marginBottom: 2,
    },
    emergencyDescription: {
        fontSize: 13,
        color: '#991b1b',
    },
    emergencyButton: {
        backgroundColor: '#ef4444',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    contactGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8,
    },
    contactCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    contactIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    contactDescription: {
        fontSize: 11,
        textAlign: 'center',
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
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 13,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    faqContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    faqItem: {
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
    },
    appInfo: {
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
    appInfoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    appInfoText: {
        fontSize: 13,
        marginBottom: 4,
    },
    bottomSpacing: {
        height: 32,
    },
});
