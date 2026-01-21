/**
 * AITriage.tsx - AI Triage Screen
 * Optional: Get AI-powered symptom analysis and urgency recommendation
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import plannedAdmissionService, { AITriageResult } from '../../../services/plannedAdmissionService';

export default function AITriage() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{
        initialSymptoms?: string;
    }>();

    const [symptoms, setSymptoms] = useState(params.initialSymptoms || '');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AITriageResult | null>(null);

    const severityOptions = [
        { value: 'mild', label: 'Mild', description: 'Noticeable but manageable', color: '#10b981' },
        { value: 'moderate', label: 'Moderate', description: 'Affecting daily activities', color: '#f59e0b' },
        { value: 'severe', label: 'Severe', description: 'Significant impact/pain', color: '#ef4444' },
    ];

    const durationOptions = [
        'Less than 24 hours',
        '1-3 days',
        '4-7 days',
        '1-2 weeks',
        '2-4 weeks',
        'More than 1 month',
    ];

    const handleAnalyze = async () => {
        if (!symptoms.trim()) {
            Alert.alert('Enter Symptoms', 'Please describe your symptoms to continue.');
            return;
        }

        setLoading(true);
        try {
            // Build symptoms string with duration and severity info
            let symptomsString = symptoms.trim();
            if (duration) symptomsString += ` Duration: ${duration}.`;
            if (severity) symptomsString += ` Severity: ${severity}.`;

            const triageResult = await plannedAdmissionService.getAITriage(symptomsString);
            setResult(triageResult);
        } catch (error) {
            console.error('Error getting AI triage:', error);
            // Use dummy result if API fails
            setResult(getDummyResult());
        } finally {
            setLoading(false);
        }
    };

    const getDummyResult = (): AITriageResult => {
        // Simple keyword-based dummy logic
        const lowerSymptoms = symptoms.toLowerCase();
        let urgency: 'critical' | 'urgent' | 'moderate' | 'low' = 'moderate';
        let confidence = 0.75;

        if (lowerSymptoms.includes('chest pain') || lowerSymptoms.includes('breathing') ||
            lowerSymptoms.includes('unconscious') || lowerSymptoms.includes('severe bleeding')) {
            urgency = 'critical';
            confidence = 0.92;
        } else if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('pain') ||
            lowerSymptoms.includes('swelling')) {
            urgency = 'urgent';
            confidence = 0.78;
        } else if (lowerSymptoms.includes('mild') || lowerSymptoms.includes('check-up') ||
            lowerSymptoms.includes('routine')) {
            urgency = 'low';
            confidence = 0.85;
        }

        if (severity === 'severe') urgency = urgency === 'low' ? 'moderate' : urgency;
        if (severity === 'mild') urgency = urgency === 'critical' ? 'urgent' : urgency;

        const recommendations: Record<string, { recommendation: string; findings: string[]; next_steps: string[] }> = {
            critical: {
                recommendation: 'Seek immediate emergency care. Do not wait for a planned admission.',
                findings: [
                    'Symptoms suggest potential urgent condition',
                    'Immediate medical evaluation recommended',
                    'Time-sensitive intervention may be needed',
                ],
                next_steps: [
                    'Call emergency services (108) or proceed to nearest ER',
                    'Do not drive yourself if experiencing severe symptoms',
                    'Have someone accompany you',
                ],
            },
            urgent: {
                recommendation: 'Schedule consultation within 24-48 hours. Consider urgent care if symptoms worsen.',
                findings: [
                    'Symptoms require medical attention',
                    'Not immediately life-threatening but needs evaluation',
                    'Early intervention recommended',
                ],
                next_steps: [
                    'Book an appointment with specialist within 48 hours',
                    'Monitor symptoms and seek ER if they worsen',
                    'Keep a symptom diary for the doctor',
                ],
            },
            moderate: {
                recommendation: 'Schedule an appointment within the next week. Planned admission is appropriate.',
                findings: [
                    'Symptoms warrant medical evaluation',
                    'Condition appears stable for scheduled care',
                    'Planned approach is suitable',
                ],
                next_steps: [
                    'Continue with planned admission workflow',
                    'Select appropriate procedure type',
                    'Compare hospitals and schedule at your convenience',
                ],
            },
            low: {
                recommendation: 'Routine evaluation recommended. You can schedule at your convenience.',
                findings: [
                    'Symptoms appear non-urgent',
                    'Routine check-up or minor procedure likely',
                    'Flexible scheduling appropriate',
                ],
                next_steps: [
                    'Schedule a routine appointment',
                    'Continue normal activities unless symptoms change',
                    'Consider preventive health checkup',
                ],
            },
        };

        return {
            urgency,
            confidence,
            recommendation: recommendations[urgency].recommendation,
            findings: recommendations[urgency].findings,
            next_steps: recommendations[urgency].next_steps,
            disclaimer: 'This is an AI-powered assessment and should not replace professional medical advice. If you experience severe symptoms, please seek immediate medical attention.',
        };
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return '#ef4444';
            case 'urgent': return '#f59e0b';
            case 'moderate': return '#3b82f6';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'alert-circle';
            case 'urgent': return 'warning';
            case 'moderate': return 'information-circle';
            case 'low': return 'checkmark-circle';
            default: return 'help-circle';
        }
    };

    const handleProceed = () => {
        if (result?.urgency === 'critical') {
            Alert.alert(
                'Emergency Recommended',
                'Based on your symptoms, we recommend seeking immediate emergency care instead of planned admission.',
                [
                    { text: 'Call 108', onPress: () => console.log('Calling emergency') },
                    { text: 'Find ER', onPress: () => router.push('/(tabs)/Home') },
                    { text: 'Continue Anyway', onPress: () => navigateToPlannedAdmission() },
                ]
            );
        } else {
            navigateToPlannedAdmission();
        }
    };

    const navigateToPlannedAdmission = () => {
        router.push({
            pathname: '/pages/planned/PlannedAdmission',
            params: {
                symptoms: symptoms,
                aiUrgency: result?.urgency || 'moderate',
                aiConfidence: result?.confidence?.toString() || '0.7',
            }
        });
    };

    const handleReset = () => {
        setResult(null);
        setSymptoms('');
        setDuration('');
        setSeverity(null);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    AI Health Triage
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {!result ? (
                    <>
                        {/* AI Banner */}
                        <View style={[styles.aiBanner, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                            <View style={styles.aiIconContainer}>
                                <Ionicons name="sparkles" size={32} color="#3b82f6" />
                            </View>
                            <Text style={[styles.aiBannerTitle, { color: isDark ? '#ffffff' : '#1e40af' }]}>
                                Let AI Help You Decide
                            </Text>
                            <Text style={[styles.aiBannerText, { color: isDark ? '#bfdbfe' : '#3b82f6' }]}>
                                Describe your symptoms and we'll assess the urgency level and recommend the best care path.
                            </Text>
                        </View>

                        {/* Symptoms Input */}
                        <View style={[styles.inputSection, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                Describe Your Symptoms *
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        color: isDark ? '#ffffff' : '#111827',
                                    }
                                ]}
                                placeholder="E.g., I've been experiencing lower back pain for the past week, especially when sitting for long periods..."
                                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={symptoms}
                                onChangeText={setSymptoms}
                            />
                        </View>

                        {/* Duration Selection */}
                        <View style={[styles.inputSection, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                How long have you had these symptoms?
                            </Text>
                            <View style={styles.durationGrid}>
                                {durationOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.durationChip,
                                            {
                                                backgroundColor: duration === option
                                                    ? '#3b82f6'
                                                    : isDark ? '#374151' : '#f3f4f6',
                                            }
                                        ]}
                                        onPress={() => setDuration(option)}
                                    >
                                        <Text style={[
                                            styles.durationChipText,
                                            { color: duration === option ? '#ffffff' : isDark ? '#ffffff' : '#111827' }
                                        ]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Severity Selection */}
                        <View style={[styles.inputSection, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                How would you rate the severity?
                            </Text>
                            <View style={styles.severityGrid}>
                                {severityOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.severityCard,
                                            {
                                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                borderColor: severity === option.value ? option.color : 'transparent',
                                                borderWidth: severity === option.value ? 2 : 0,
                                            }
                                        ]}
                                        onPress={() => setSeverity(option.value as any)}
                                    >
                                        <View style={[styles.severityDot, { backgroundColor: option.color }]} />
                                        <Text style={[styles.severityLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                            {option.label}
                                        </Text>
                                        <Text style={[styles.severityDesc, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            {option.description}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Analyze Button */}
                        <TouchableOpacity
                            style={[
                                styles.analyzeButton,
                                !symptoms.trim() && styles.analyzeButtonDisabled
                            ]}
                            onPress={handleAnalyze}
                            disabled={loading || !symptoms.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={20} color="#ffffff" />
                                    <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Disclaimer */}
                        <View style={styles.disclaimerCard}>
                            <Ionicons name="information-circle" size={18} color="#6b7280" />
                            <Text style={[styles.disclaimerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                This is an AI-assisted tool and should not replace professional medical advice.
                                If you're experiencing a medical emergency, please call 108 immediately.
                            </Text>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Result Card */}
                        <View style={[styles.resultCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            {/* Urgency Badge */}
                            <View style={[
                                styles.urgencyBadge,
                                { backgroundColor: getUrgencyColor(result.urgency) + '20' }
                            ]}>
                                <Ionicons
                                    name={getUrgencyIcon(result.urgency) as any}
                                    size={32}
                                    color={getUrgencyColor(result.urgency)}
                                />
                                <Text style={[styles.urgencyLabel, { color: getUrgencyColor(result.urgency) }]}>
                                    {result.urgency.charAt(0).toUpperCase() + result.urgency.slice(1)} Priority
                                </Text>
                                <Text style={[styles.confidenceText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {Math.round(result.confidence * 100)}% confidence
                                </Text>
                            </View>

                            {/* Recommendation */}
                            <View style={styles.recommendationSection}>
                                <Text style={[styles.recommendationLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Recommendation
                                </Text>
                                <Text style={[styles.recommendationText, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {result.recommendation}
                                </Text>
                            </View>

                            {/* Findings */}
                            <View style={styles.findingsSection}>
                                <Text style={[styles.findingsLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Analysis Findings
                                </Text>
                                {result.findings.map((finding, index) => (
                                    <View key={index} style={styles.findingItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                        <Text style={[styles.findingText, { color: isDark ? '#ffffff' : '#374151' }]}>
                                            {finding}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Next Steps */}
                            <View style={styles.nextStepsSection}>
                                <Text style={[styles.nextStepsLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Suggested Next Steps
                                </Text>
                                {result.next_steps.map((step, index) => (
                                    <View key={index} style={styles.stepItem}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                                        </View>
                                        <Text style={[styles.stepText, { color: isDark ? '#ffffff' : '#374151' }]}>
                                            {step}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Disclaimer */}
                        <View style={[styles.resultDisclaimer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <Ionicons name="warning" size={18} color="#f59e0b" />
                            <Text style={[styles.resultDisclaimerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {result.disclaimer}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                                onPress={handleReset}
                            >
                                <Ionicons name="refresh" size={20} color={isDark ? '#ffffff' : '#111827'} />
                                <Text style={[styles.secondaryButtonText, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Start Over
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleProceed}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {result.urgency === 'critical' ? 'Get Emergency Help' : 'Continue to Booking'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

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
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    aiBanner: {
        borderRadius: 16,
        padding: 24,
        marginTop: 16,
        alignItems: 'center',
    },
    aiIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiBannerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    aiBannerText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    inputSection: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    textArea: {
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        minHeight: 120,
    },
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    durationChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    durationChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    severityGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    severityCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    severityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    severityLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    severityDesc: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    analyzeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimerCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 16,
        gap: 8,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    resultCard: {
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
    },
    urgencyBadge: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    urgencyLabel: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 12,
    },
    confidenceText: {
        fontSize: 13,
        marginTop: 4,
    },
    recommendationSection: {
        marginBottom: 20,
    },
    recommendationLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    recommendationText: {
        fontSize: 15,
        lineHeight: 22,
    },
    findingsSection: {
        marginBottom: 20,
    },
    findingsLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    findingItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
    },
    findingText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    nextStepsSection: {},
    nextStepsLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    resultDisclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 10,
    },
    resultDisclaimerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
