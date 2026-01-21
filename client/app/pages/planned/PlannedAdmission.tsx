/**
 * PlannedAdmission.tsx - Planned Admission Landing Screen
 * Step 1: Select care type and enter symptoms
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useColorScheme,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type CareType = 'surgery' | 'treatment' | 'diagnostic' | 'specialist' | 'other';

interface CareTypeOption {
    value: CareType;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const CARE_TYPES: CareTypeOption[] = [
    {
        value: 'surgery',
        label: 'Surgery/Procedure',
        description: 'Planned surgical operations',
        icon: 'medkit',
        color: '#EF4444',
    },
    {
        value: 'treatment',
        label: 'Medical Treatment',
        description: 'Ongoing medical care',
        icon: 'pulse',
        color: '#3B82F6',
    },
    {
        value: 'diagnostic',
        label: 'Diagnostic Tests',
        description: 'Lab tests, scans, imaging',
        icon: 'analytics',
        color: '#10B981',
    },
    {
        value: 'specialist',
        label: 'Specialist Care',
        description: 'Consultation with specialists',
        icon: 'person',
        color: '#8B5CF6',
    },
    {
        value: 'other',
        label: 'Other',
        description: 'Other medical needs',
        icon: 'ellipsis-horizontal',
        color: '#6B7280',
    },
];

export default function PlannedAdmission() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [selectedCareType, setSelectedCareType] = useState<CareType | null>(null);
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selectedCareType) {
            Alert.alert('Selection Required', 'Please select the type of care you need.');
            return;
        }

        setLoading(true);
        try {
            // Navigate to procedure selection with care type and symptoms
            router.push({
                pathname: '/pages/planned/ProcedureSelection',
                params: {
                    careType: selectedCareType,
                    symptoms: symptoms,
                }
            });
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleHelpDecide = () => {
        // Navigate to AI triage screen
        router.push({
            pathname: '/pages/planned/AITriage',
            params: { symptoms }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Planned Admission
                </Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro Section */}
                <View style={styles.introSection}>
                    <LinearGradient
                        colors={isDark ? ['#1e3a5f', '#1e3a8a'] : ['#dbeafe', '#bfdbfe']}
                        style={styles.introGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="calendar" size={40} color={isDark ? '#60a5fa' : '#3b82f6'} />
                        <Text style={[styles.introTitle, { color: isDark ? '#ffffff' : '#1e40af' }]}>
                            Schedule Your Hospital Visit
                        </Text>
                        <Text style={[styles.introText, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            Plan ahead for non-emergency care. Compare hospitals, costs, and schedule at your convenience.
                        </Text>
                    </LinearGradient>
                </View>

                {/* Care Type Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        What type of care do you need?
                    </Text>
                    <View style={styles.careTypeGrid}>
                        {CARE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.careTypeCard,
                                    {
                                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                        borderColor: selectedCareType === type.value
                                            ? type.color
                                            : isDark ? '#374151' : '#e5e7eb',
                                        borderWidth: selectedCareType === type.value ? 2 : 1,
                                    }
                                ]}
                                onPress={() => setSelectedCareType(type.value)}
                            >
                                <View style={[styles.careTypeIconContainer, { backgroundColor: `${type.color}20` }]}>
                                    <Ionicons name={type.icon} size={24} color={type.color} />
                                </View>
                                <Text style={[styles.careTypeLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {type.label}
                                </Text>
                                <Text style={[styles.careTypeDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {type.description}
                                </Text>
                                {selectedCareType === type.value && (
                                    <View style={[styles.checkBadge, { backgroundColor: type.color }]}>
                                        <Ionicons name="checkmark" size={14} color="#ffffff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Symptoms Input */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Tell us about your symptoms
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Optional: Describe your symptoms for better recommendations
                    </Text>
                    <TextInput
                        style={[
                            styles.symptomsInput,
                            {
                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                color: isDark ? '#ffffff' : '#111827',
                                borderColor: isDark ? '#374151' : '#e5e7eb',
                            }
                        ]}
                        placeholder="E.g., Knee pain for 3 months, difficulty walking..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={symptoms}
                        onChangeText={setSymptoms}
                    />
                </View>

                {/* AI Help Section */}
                <TouchableOpacity
                    style={[styles.aiHelpCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    onPress={handleHelpDecide}
                >
                    <View style={[styles.aiIconContainer, { backgroundColor: '#8b5cf620' }]}>
                        <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                    </View>
                    <View style={styles.aiHelpContent}>
                        <Text style={[styles.aiHelpTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Not sure what you need?
                        </Text>
                        <Text style={[styles.aiHelpText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            Let our AI help analyze your symptoms and recommend the best care path
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedCareType && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedCareType || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
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
        shadowRadius: 4,
        elevation: 4,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    introSection: {
        marginBottom: 24,
    },
    introGradient: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    introTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 12,
        textAlign: 'center',
    },
    introText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    careTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    careTypeCard: {
        width: '48%',
        marginHorizontal: '1%',
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        position: 'relative',
    },
    careTypeIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    careTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    careTypeDescription: {
        fontSize: 12,
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symptomsInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        minHeight: 120,
    },
    aiHelpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    aiIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    aiHelpContent: {
        flex: 1,
    },
    aiHelpTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    aiHelpText: {
        fontSize: 13,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
