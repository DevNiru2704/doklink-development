/**
 * ProcedureSelection.tsx - Procedure Selection Screen
 * Step 2: Select specific procedure or search
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useColorScheme,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import plannedAdmissionService, { MedicalProcedure, ProcedureCategory } from '../../../services/plannedAdmissionService';

// Category icons mapping
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    cardiac: 'heart',
    orthopedic: 'body',
    general_surgery: 'cut',
    neurology: 'cellular',
    gastroenterology: 'nutrition',
    urology: 'water',
    gynecology: 'female',
    oncology: 'ribbon',
    ent: 'ear',
    ophthalmology: 'eye',
    dermatology: 'hand-left',
    diagnostic: 'analytics',
    other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
    cardiac: '#EF4444',
    orthopedic: '#3B82F6',
    general_surgery: '#10B981',
    neurology: '#8B5CF6',
    gastroenterology: '#F59E0B',
    urology: '#06B6D4',
    gynecology: '#EC4899',
    oncology: '#6366F1',
    ent: '#14B8A6',
    ophthalmology: '#6B7280',
    dermatology: '#F97316',
    diagnostic: '#84CC16',
    other: '#9CA3AF',
};

export default function ProcedureSelection() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{ careType: string; symptoms: string }>();

    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<ProcedureCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
    const [selectedProcedure, setSelectedProcedure] = useState<MedicalProcedure | null>(null);
    const [customProcedure, setCustomProcedure] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            // For now, use static categories since backend might not have procedures yet
            const staticCategories: ProcedureCategory[] = [
                { value: 'cardiac', label: 'Cardiac Procedures', count: 0 },
                { value: 'orthopedic', label: 'Orthopedic', count: 0 },
                { value: 'general_surgery', label: 'General Surgery', count: 0 },
                { value: 'neurology', label: 'Neurology', count: 0 },
                { value: 'gastroenterology', label: 'Gastroenterology', count: 0 },
                { value: 'urology', label: 'Urology', count: 0 },
                { value: 'gynecology', label: 'Gynecology', count: 0 },
                { value: 'oncology', label: 'Oncology', count: 0 },
                { value: 'ent', label: 'ENT', count: 0 },
                { value: 'ophthalmology', label: 'Ophthalmology', count: 0 },
                { value: 'dermatology', label: 'Dermatology', count: 0 },
                { value: 'diagnostic', label: 'Diagnostic', count: 0 },
                { value: 'other', label: 'Other', count: 0 },
            ];
            setCategories(staticCategories);
            setLoading(false);
        } catch (error) {
            console.error('Error loading categories:', error);
            setLoading(false);
        }
    };

    const loadProcedures = async (category: string) => {
        try {
            setSearchLoading(true);
            // Try to fetch from API, fallback to empty
            try {
                const data = await plannedAdmissionService.getProceduresByCategory(category);
                setProcedures(data);
            } catch {
                // Use dummy procedures if API fails
                setProcedures(getDummyProcedures(category));
            }
        } catch (error) {
            console.error('Error loading procedures:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const getDummyProcedures = (category: string): MedicalProcedure[] => {
        const dummyData: Record<string, MedicalProcedure[]> = {
            cardiac: [
                { id: 1, name: 'Coronary Angioplasty', category: 'cardiac', category_display: 'Cardiac', description: 'Minimally invasive procedure to open blocked arteries', typical_duration: '1-2 hours', recovery_time: '1-2 weeks', estimated_cost_min: 150000, estimated_cost_max: 300000, cost_range: '₹1,50,000 - ₹3,00,000', requires_overnight_stay: true, pre_requirements: 'Fasting 8 hours, blood tests', is_active: true },
                { id: 2, name: 'Pacemaker Implantation', category: 'cardiac', category_display: 'Cardiac', description: 'Implanting a device to regulate heartbeat', typical_duration: '1-3 hours', recovery_time: '2-4 weeks', estimated_cost_min: 200000, estimated_cost_max: 500000, cost_range: '₹2,00,000 - ₹5,00,000', requires_overnight_stay: true, pre_requirements: 'ECG, blood tests', is_active: true },
            ],
            orthopedic: [
                { id: 3, name: 'Knee Replacement', category: 'orthopedic', category_display: 'Orthopedic', description: 'Total or partial knee joint replacement', typical_duration: '2-3 hours', recovery_time: '6-12 weeks', estimated_cost_min: 200000, estimated_cost_max: 400000, cost_range: '₹2,00,000 - ₹4,00,000', requires_overnight_stay: true, pre_requirements: 'X-ray, MRI, blood tests', is_active: true },
                { id: 4, name: 'Hip Replacement', category: 'orthopedic', category_display: 'Orthopedic', description: 'Hip joint replacement surgery', typical_duration: '2-3 hours', recovery_time: '6-12 weeks', estimated_cost_min: 250000, estimated_cost_max: 500000, cost_range: '₹2,50,000 - ₹5,00,000', requires_overnight_stay: true, pre_requirements: 'X-ray, CT scan, blood tests', is_active: true },
                { id: 5, name: 'ACL Reconstruction', category: 'orthopedic', category_display: 'Orthopedic', description: 'Anterior cruciate ligament repair', typical_duration: '1-2 hours', recovery_time: '6-9 months', estimated_cost_min: 100000, estimated_cost_max: 200000, cost_range: '₹1,00,000 - ₹2,00,000', requires_overnight_stay: true, pre_requirements: 'MRI, blood tests', is_active: true },
            ],
            general_surgery: [
                { id: 6, name: 'Appendectomy', category: 'general_surgery', category_display: 'General Surgery', description: 'Surgical removal of appendix', typical_duration: '1-2 hours', recovery_time: '1-3 weeks', estimated_cost_min: 50000, estimated_cost_max: 100000, cost_range: '₹50,000 - ₹1,00,000', requires_overnight_stay: true, pre_requirements: 'Fasting, blood tests', is_active: true },
                { id: 7, name: 'Hernia Repair', category: 'general_surgery', category_display: 'General Surgery', description: 'Repair of inguinal or umbilical hernia', typical_duration: '1-2 hours', recovery_time: '2-4 weeks', estimated_cost_min: 60000, estimated_cost_max: 120000, cost_range: '₹60,000 - ₹1,20,000', requires_overnight_stay: true, pre_requirements: 'Fasting, blood tests', is_active: true },
            ],
            diagnostic: [
                { id: 8, name: 'Full Body Health Checkup', category: 'diagnostic', category_display: 'Diagnostic', description: 'Comprehensive health screening', typical_duration: '4-6 hours', recovery_time: 'Same day', estimated_cost_min: 5000, estimated_cost_max: 25000, cost_range: '₹5,000 - ₹25,000', requires_overnight_stay: false, pre_requirements: 'Fasting 12 hours', is_active: true },
                { id: 9, name: 'CT Scan', category: 'diagnostic', category_display: 'Diagnostic', description: 'Computed tomography imaging', typical_duration: '30-60 min', recovery_time: 'Same day', estimated_cost_min: 3000, estimated_cost_max: 15000, cost_range: '₹3,000 - ₹15,000', requires_overnight_stay: false, pre_requirements: 'May require fasting', is_active: true },
                { id: 10, name: 'MRI Scan', category: 'diagnostic', category_display: 'Diagnostic', description: 'Magnetic resonance imaging', typical_duration: '30-90 min', recovery_time: 'Same day', estimated_cost_min: 5000, estimated_cost_max: 20000, cost_range: '₹5,000 - ₹20,000', requires_overnight_stay: false, pre_requirements: 'Remove metal objects', is_active: true },
            ],
        };
        return dummyData[category] || [];
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setSelectedProcedure(null);
        loadProcedures(category);
    };

    const handleProcedureSelect = (procedure: MedicalProcedure) => {
        setSelectedProcedure(procedure);
        setCustomProcedure('');
    };

    const handleContinue = () => {
        const procedureName = selectedProcedure?.name || customProcedure;
        const procedureCategory = selectedCategory || 'other';

        router.push({
            pathname: '/pages/planned/HospitalComparison',
            params: {
                careType: params.careType,
                symptoms: params.symptoms,
                procedureCategory,
                procedureName,
            }
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
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
                    Select Procedure
                </Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <Ionicons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                <TextInput
                    style={[styles.searchInput, { color: isDark ? '#ffffff' : '#111827' }]}
                    placeholder="Search procedures..."
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Categories */}
                {!selectedCategory && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Select Category
                        </Text>
                        <View style={styles.categoriesGrid}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.value}
                                    style={[
                                        styles.categoryCard,
                                        {
                                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                            borderColor: isDark ? '#374151' : '#e5e7eb',
                                        }
                                    ]}
                                    onPress={() => handleCategorySelect(category.value)}
                                >
                                    <View style={[
                                        styles.categoryIcon,
                                        { backgroundColor: `${CATEGORY_COLORS[category.value] || '#6B7280'}20` }
                                    ]}>
                                        <Ionicons
                                            name={CATEGORY_ICONS[category.value] || 'medical'}
                                            size={24}
                                            color={CATEGORY_COLORS[category.value] || '#6B7280'}
                                        />
                                    </View>
                                    <Text style={[styles.categoryLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Procedures in Category */}
                {selectedCategory && (
                    <>
                        <TouchableOpacity
                            style={styles.backToCategories}
                            onPress={() => {
                                setSelectedCategory(null);
                                setProcedures([]);
                            }}
                        >
                            <Ionicons name="arrow-back" size={16} color="#3b82f6" />
                            <Text style={styles.backToCategoriesText}>Back to Categories</Text>
                        </TouchableOpacity>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                {categories.find(c => c.value === selectedCategory)?.label || 'Procedures'}
                            </Text>

                            {searchLoading ? (
                                <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />
                            ) : procedures.length > 0 ? (
                                procedures.map((procedure) => (
                                    <TouchableOpacity
                                        key={procedure.id}
                                        style={[
                                            styles.procedureCard,
                                            {
                                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                                borderColor: selectedProcedure?.id === procedure.id
                                                    ? '#3b82f6'
                                                    : isDark ? '#374151' : '#e5e7eb',
                                                borderWidth: selectedProcedure?.id === procedure.id ? 2 : 1,
                                            }
                                        ]}
                                        onPress={() => handleProcedureSelect(procedure)}
                                    >
                                        <View style={styles.procedureHeader}>
                                            <Text style={[styles.procedureName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                {procedure.name}
                                            </Text>
                                            {selectedProcedure?.id === procedure.id && (
                                                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                                            )}
                                        </View>
                                        <Text style={[styles.procedureDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            {procedure.description}
                                        </Text>
                                        <View style={styles.procedureDetails}>
                                            <View style={styles.procedureDetail}>
                                                <Ionicons name="time-outline" size={14} color="#6b7280" />
                                                <Text style={[styles.procedureDetailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {procedure.typical_duration}
                                                </Text>
                                            </View>
                                            <View style={styles.procedureDetail}>
                                                <Ionicons name="fitness-outline" size={14} color="#6b7280" />
                                                <Text style={[styles.procedureDetailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    Recovery: {procedure.recovery_time}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.procedureCost, { color: '#10b981' }]}>
                                            {procedure.cost_range}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.noResults, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    No procedures found in this category
                                </Text>
                            )}

                            {/* Custom Procedure Input */}
                            <View style={[styles.customInputContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                                <Text style={[styles.customInputLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Or enter your procedure manually:
                                </Text>
                                <TextInput
                                    style={[
                                        styles.customInput,
                                        {
                                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                            color: isDark ? '#ffffff' : '#111827',
                                        }
                                    ]}
                                    placeholder="E.g., Knee arthroscopy"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    value={customProcedure}
                                    onChangeText={(text) => {
                                        setCustomProcedure(text);
                                        setSelectedProcedure(null);
                                    }}
                                />
                            </View>
                        </View>
                    </>
                )}

                {/* Continue Button */}
                {selectedCategory && (selectedProcedure || customProcedure.length > 0) && (
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Continue to Hospital Selection</Text>
                        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </TouchableOpacity>
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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    categoryCard: {
        width: '31%',
        marginHorizontal: '1%',
        marginBottom: 12,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryLabel: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    backToCategories: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 4,
    },
    backToCategoriesText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '500',
    },
    procedureCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    procedureHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    procedureName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    procedureDescription: {
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 18,
    },
    procedureDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    procedureDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    procedureDetailText: {
        fontSize: 12,
    },
    procedureCost: {
        fontSize: 14,
        fontWeight: '600',
    },
    noResults: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
    customInputContainer: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
    },
    customInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    customInput: {
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
