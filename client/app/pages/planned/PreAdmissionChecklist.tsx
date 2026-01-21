/**
 * PreAdmissionChecklist.tsx - Pre-Admission Checklist Screen
 * Step 5: View and complete pre-admission checklist items
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import plannedAdmissionService, { ChecklistItem, PlannedAdmission } from '../../../services/plannedAdmissionService';

interface ChecklistSection {
    title: string;
    icon: string;
    color: string;
    items: ChecklistItem[];
    key: 'medical_tests' | 'documents' | 'medications' | 'instructions';
}

export default function PreAdmissionChecklist() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{
        admissionId: string;
        hospitalName: string;
        procedureName: string;
        scheduledDate: string;
    }>();

    const [admission, setAdmission] = useState<PlannedAdmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['medical_tests', 'documents']);

    useEffect(() => {
        loadAdmission();
    }, []);

    const loadAdmission = async () => {
        try {
            if (params.admissionId && params.admissionId !== '1') {
                const data = await plannedAdmissionService.getPlannedAdmission(parseInt(params.admissionId));
                setAdmission(data);
            } else {
                // Use dummy data if no admission ID
                setAdmission(getDummyAdmission());
            }
        } catch (error) {
            console.error('Error loading admission:', error);
            setAdmission(getDummyAdmission());
        } finally {
            setLoading(false);
        }
    };

    const getDummyAdmission = (): PlannedAdmission => ({
        id: 1,
        user_name: 'User',
        hospital: null,
        doctor_name: null,
        admission_type: 'treatment',
        admission_type_display: 'Treatment/Therapy',
        procedure_category: 'general_surgery',
        procedure_category_display: 'General Surgery',
        procedure_name: params.procedureName || 'General Procedure',
        symptoms: '',
        preferred_date: null,
        alternate_date: null,
        flexible_dates: false,
        scheduled_date: params.scheduledDate || null,
        scheduled_time: null,
        status: 'scheduled',
        status_display: 'Scheduled',
        estimated_cost: 75000,
        estimated_insurance_coverage: 60000,
        estimated_out_of_pocket: 15000,
        ai_triage_result: null,
        ai_recommended_urgency: 'moderate',
        ai_confidence_score: null,
        pre_admission_checklist: {
            medical_tests: [
                { name: 'Complete Blood Count (CBC)', completed: false, instruction: 'Fasting not required' },
                { name: 'Blood Sugar Fasting', completed: false, instruction: '8-12 hours fasting required' },
                { name: 'ECG', completed: false, instruction: 'Required for surgery' },
                { name: 'Chest X-Ray', completed: false, instruction: 'Recent within 1 month' },
                { name: 'COVID-19 RT-PCR', completed: false, instruction: 'Within 72 hours of admission' },
            ],
            documents: [
                { name: 'Aadhaar Card', completed: false, instruction: 'Original + photocopy' },
                { name: 'Insurance Card', completed: false, instruction: 'Both sides photocopy' },
                { name: 'Previous Medical Records', completed: false, instruction: 'If any' },
                { name: 'Referral Letter', completed: false, instruction: 'From referring doctor' },
                { name: 'Passport Size Photos', completed: false, instruction: '2 copies' },
            ],
            medications: [
                { name: 'List current medications', completed: false, instruction: 'Include dosage and frequency' },
                { name: 'Blood thinners information', completed: false, instruction: 'If taking any, note last dose' },
                { name: 'Allergy information', completed: false, instruction: 'List all known allergies' },
            ],
            instructions: [
                { name: 'Fasting from midnight', completed: false, instruction: 'Before admission day' },
                { name: 'Arrange companion', completed: false, instruction: 'For post-procedure care' },
                { name: 'Arrange transportation', completed: false, instruction: 'For discharge' },
                { name: 'Inform workplace', completed: false, instruction: 'Plan for recovery leave' },
            ],
        },
        checklist_completion: 0,
        doctor_notes: '',
        patient_notes: '',
        cancellation_reason: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    const getSections = (): ChecklistSection[] => {
        if (!admission) return [];

        return [
            {
                title: 'Medical Tests',
                icon: 'flask',
                color: '#ef4444',
                items: admission.pre_admission_checklist.medical_tests,
                key: 'medical_tests',
            },
            {
                title: 'Documents Required',
                icon: 'document-text',
                color: '#3b82f6',
                items: admission.pre_admission_checklist.documents,
                key: 'documents',
            },
            {
                title: 'Medications',
                icon: 'medical',
                color: '#10b981',
                items: admission.pre_admission_checklist.medications,
                key: 'medications',
            },
            {
                title: 'Instructions',
                icon: 'information-circle',
                color: '#f59e0b',
                items: admission.pre_admission_checklist.instructions,
                key: 'instructions',
            },
        ];
    };

    const toggleSection = (key: string) => {
        if (expandedSections.includes(key)) {
            setExpandedSections(expandedSections.filter(k => k !== key));
        } else {
            setExpandedSections([...expandedSections, key]);
        }
    };

    const handleToggleItem = async (sectionKey: string, itemIndex: number) => {
        if (!admission) return;

        setUpdating(true);

        try {
            // Update local state
            const updatedChecklist = { ...admission.pre_admission_checklist };
            const section = updatedChecklist[sectionKey as keyof typeof updatedChecklist];
            if (section && section[itemIndex]) {
                section[itemIndex].completed = !section[itemIndex].completed;
            }

            // Calculate new completion percentage
            const allItems = [
                ...updatedChecklist.medical_tests,
                ...updatedChecklist.documents,
                ...updatedChecklist.medications,
                ...updatedChecklist.instructions,
            ];
            const completedItems = allItems.filter(item => item.completed).length;
            const completionPercentage = Math.round((completedItems / allItems.length) * 100);

            setAdmission({
                ...admission,
                pre_admission_checklist: updatedChecklist,
                checklist_completion: completionPercentage,
            });

            // Update on server if we have a real admission
            if (params.admissionId && params.admissionId !== '1') {
                await plannedAdmissionService.updateChecklistItem(
                    parseInt(params.admissionId),
                    sectionKey as 'medical_tests' | 'documents' | 'medications' | 'instructions',
                    itemIndex,
                    'completed',
                    section[itemIndex].completed ?? false
                );
            }
        } catch (error) {
            console.error('Error updating checklist item:', error);
        } finally {
            setUpdating(false);
        }
    };

    const getCompletedCount = (items: ChecklistItem[]): number => {
        return items.filter(item => item.completed).length;
    };

    const getTotalProgress = (): number => {
        if (!admission) return 0;
        return admission.checklist_completion || 0;
    };

    const handleDone = () => {
        const progress = getTotalProgress();

        if (progress < 100) {
            Alert.alert(
                'Incomplete Checklist',
                `You've completed ${progress}% of the checklist. Complete all items before admission for a smooth experience.`,
                [
                    { text: 'Continue Later', onPress: () => router.replace('/(tabs)/Dashboard') },
                    { text: 'Keep Checking', style: 'cancel' },
                ]
            );
        } else {
            Alert.alert(
                'Checklist Complete! 🎉',
                'Great job! You\'re all set for your admission. The hospital will contact you to confirm the schedule.',
                [
                    { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/Dashboard') },
                ]
            );
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Loading checklist...
                </Text>
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
                    Pre-Admission Checklist
                </Text>
                <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={[styles.hospitalLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {params.hospitalName || 'Selected Hospital'}
                            </Text>
                            <Text style={[styles.procedureLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                {params.procedureName || 'Planned Admission'}
                            </Text>
                            {params.scheduledDate && (
                                <View style={styles.dateRow}>
                                    <Ionicons name="calendar" size={14} color="#3b82f6" />
                                    <Text style={[styles.dateText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {params.scheduledDate}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressPercent}>{getTotalProgress()}%</Text>
                            <Text style={styles.progressLabel}>Complete</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${getTotalProgress()}%` }
                                ]}
                            />
                        </View>
                    </View>

                    <Text style={[styles.progressHint, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Complete all items before your admission date
                    </Text>
                </View>

                {/* Checklist Sections */}
                {getSections().map((section) => (
                    <View
                        key={section.key}
                        style={[styles.sectionCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    >
                        {/* Section Header */}
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(section.key)}
                        >
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                                    <Ionicons name={section.icon as any} size={20} color={section.color} />
                                </View>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                        {section.title}
                                    </Text>
                                    <Text style={[styles.sectionProgress, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {getCompletedCount(section.items)}/{section.items.length} completed
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name={expandedSections.includes(section.key) ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={isDark ? '#9ca3af' : '#6b7280'}
                            />
                        </TouchableOpacity>

                        {/* Section Items */}
                        {expandedSections.includes(section.key) && (
                            <View style={styles.sectionItems}>
                                {section.items.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.checklistItem}
                                        onPress={() => handleToggleItem(section.key, index)}
                                        disabled={updating}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            item.completed && styles.checkboxCompleted,
                                            { borderColor: item.completed ? section.color : '#9ca3af' }
                                        ]}>
                                            {item.completed && (
                                                <Ionicons name="checkmark" size={14} color="#ffffff" />
                                            )}
                                        </View>
                                        <View style={styles.itemContent}>
                                            <Text style={[
                                                styles.itemName,
                                                { color: isDark ? '#ffffff' : '#111827' },
                                                item.completed && styles.itemNameCompleted
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {item.instruction && (
                                                <Text style={[styles.itemNotes, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {item.instruction}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ))}

                {/* Tips Card */}
                <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb" size={20} color="#3b82f6" />
                        <Text style={[styles.tipsTitle, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            Tips for Smooth Admission
                        </Text>
                    </View>
                    <View style={styles.tipsList}>
                        <Text style={[styles.tipItem, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            • Get tests done 3-5 days before admission
                        </Text>
                        <Text style={[styles.tipItem, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            • Carry original documents along with copies
                        </Text>
                        <Text style={[styles.tipItem, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            • List all allergies and current medications
                        </Text>
                        <Text style={[styles.tipItem, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                            • Reach hospital at least 30 mins early
                        </Text>
                    </View>
                </View>

                {/* Contact Card */}
                <View style={[styles.contactCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.contactTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Need Help?
                    </Text>
                    <Text style={[styles.contactText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Contact hospital admission desk for any queries
                    </Text>
                    <TouchableOpacity style={styles.contactButton}>
                        <Ionicons name="call" size={18} color="#3b82f6" />
                        <Text style={styles.contactButtonText}>Call Hospital</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
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
    doneButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    doneButtonText: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    progressCard: {
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    hospitalLabel: {
        fontSize: 13,
    },
    procedureLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    dateText: {
        fontSize: 13,
    },
    progressCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressPercent: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#bfdbfe',
        fontSize: 10,
    },
    progressBarContainer: {
        marginTop: 20,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
    },
    progressHint: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    sectionCard: {
        borderRadius: 16,
        marginTop: 16,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionProgress: {
        fontSize: 12,
        marginTop: 2,
    },
    sectionItems: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    checkboxCompleted: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
    },
    itemNameCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    itemNotes: {
        fontSize: 12,
        marginTop: 4,
    },
    tipsCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    tipsList: {
        gap: 6,
    },
    tipItem: {
        fontSize: 13,
        lineHeight: 18,
    },
    contactCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    contactText: {
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    contactButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
});
