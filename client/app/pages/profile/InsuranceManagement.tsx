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
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../../config/api';

interface InsuranceDependent {
    id: number;
    name: string;
    relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
    date_of_birth: string;
    age: number;
    is_covered: boolean;
}

interface Insurance {
    id: number;
    provider_name: string;
    policy_number: string;
    policy_expiry: string;
    coverage_type: 'individual' | 'family' | 'employer' | 'government';
    coverage_amount: string;
    is_active: boolean;
    is_expired: boolean;
    days_until_expiry: number;
    dependents: InsuranceDependent[];
}

interface DependentForm {
    name: string;
    relationship: string;
    date_of_birth: string;
    is_covered: boolean;
}

interface InsuranceForm {
    provider_name: string;
    policy_number: string;
    policy_expiry: string;
    coverage_type: string;
    coverage_amount: string;
    dependents_data?: DependentForm[];
}

// Validation schema
const insuranceValidationSchema = Yup.object().shape({
    provider_name: Yup.string()
        .required('Provider name is required')
        .min(2, 'Provider name must be at least 2 characters')
        .max(100, 'Provider name must be at most 100 characters'),
    policy_number: Yup.string()
        .required('Policy number is required')
        .min(5, 'Policy number must be at least 5 characters')
        .max(50, 'Policy number must be at most 50 characters'),
    policy_expiry: Yup.string()
        .required('Policy expiry date is required')
        .matches(
            /^\d{4}-\d{2}-\d{2}$/,
            'Date must be in YYYY-MM-DD format'
        )
        .test('is-future-date', 'Expiry date must be in the future', function (value) {
            if (!value) return false;
            const expiryDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return expiryDate >= today;
        }),
    coverage_type: Yup.string()
        .required('Coverage type is required')
        .oneOf(['individual', 'family', 'employer', 'government'], 'Invalid coverage type'),
    coverage_amount: Yup.string()
        .required('Coverage amount is required')
        .matches(/^\d+$/, 'Coverage amount must be a valid number')
        .test('min-amount', 'Coverage amount must be at least ₹1,000', function (value) {
            if (!value) return false;
            return parseInt(value) >= 1000;
        }),
    dependents_data: Yup.array().of(
        Yup.object().shape({
            name: Yup.string()
                .required('Dependent name is required')
                .min(2, 'Name must be at least 2 characters'),
            relationship: Yup.string()
                .required('Relationship is required')
                .oneOf(['spouse', 'child', 'parent', 'sibling', 'other'], 'Invalid relationship'),
            date_of_birth: Yup.string()
                .required('Date of birth is required')
                .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
                .test('is-past-date', 'Date of birth cannot be in the future', function (value) {
                    if (!value) return false;
                    const dobDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return dobDate <= today;
                }),
            is_covered: Yup.boolean(),
        })
    ),
});

export default function InsuranceManagement() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [insurances, setInsurances] = useState<Insurance[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPolicyExpiryPicker, setShowPolicyExpiryPicker] = useState(false);
    const [selectedDependentIndex, setSelectedDependentIndex] = useState<number | null>(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [tempPolicyExpiryDate, setTempPolicyExpiryDate] = useState(new Date());

    const initialFormValues: InsuranceForm = {
        provider_name: '',
        policy_number: '',
        policy_expiry: '',
        coverage_type: 'individual',
        coverage_amount: '',
        dependents_data: [],
    };

    useEffect(() => {
        fetchInsurances();
    }, []);

    const fetchInsurances = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/healthcare/insurance/');
            const data = response.data;
            // Handle paginated response
            if (data && typeof data === 'object') {
                if (Array.isArray(data)) {
                    setInsurances(data as Insurance[]);
                } else if ('results' in data && Array.isArray(data.results)) {
                    // Paginated response
                    setInsurances(data.results as Insurance[]);
                } else {
                    console.error('Invalid response format:', data);
                    setInsurances([]);
                }
            } else {
                setInsurances([]);
            }
        } catch (error) {
            console.error('Error fetching insurances:', error);
            setInsurances([]);
            Alert.alert('Error', 'Failed to load insurance policies');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingInsurance(null);
        setModalVisible(true);
    };

    const openEditModal = (insurance: Insurance) => {
        setEditingInsurance(insurance);
        setModalVisible(true);
    };

    const handleSave = async (values: InsuranceForm) => {
        try {
            setSaving(true);

            if (editingInsurance) {
                // Update existing
                await apiClient.put(`/healthcare/insurance/${editingInsurance.id}/`, values);
            } else {
                // Create new
                await apiClient.post('/healthcare/insurance/', values);
            }

            setModalVisible(false);
            fetchInsurances();
        } catch (error: any) {
            console.error('Error saving insurance:', error);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.error
                || JSON.stringify(error.response?.data)
                || 'Failed to save insurance';
            Alert.alert('Error', errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (insurance: Insurance) => {
        Alert.alert(
            'Delete Insurance',
            `Are you sure you want to delete ${insurance.provider_name} policy?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/healthcare/insurance/${insurance.id}/`);
                            fetchInsurances();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete insurance');
                        }
                    },
                },
            ]
        );
    };

    const toggleActive = async (insurance: Insurance) => {
        try {
            const endpoint = insurance.is_active ? 'deactivate' : 'activate';
            await apiClient.post(`/healthcare/insurance/${insurance.id}/${endpoint}/`);
            fetchInsurances();
        } catch (error) {
            Alert.alert('Error', 'Failed to update insurance status');
        }
    };

    const getStatusBadge = (insurance: Insurance) => {
        if (!insurance.is_active) {
            return <View style={[styles.badge, styles.badgeInactive]}><Text style={styles.badgeText}>Inactive</Text></View>;
        }
        if (insurance.is_expired) {
            return <View style={[styles.badge, styles.badgeExpired]}><Text style={styles.badgeText}>Expired</Text></View>;
        }
        if (insurance.days_until_expiry <= 30) {
            return <View style={[styles.badge, styles.badgeWarning]}><Text style={styles.badgeText}>Expiring Soon</Text></View>;
        }
        return <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeText}>Active</Text></View>;
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
                    Insurance Policies
                </Text>
                <TouchableOpacity onPress={openAddModal}>
                    <Ionicons name="add-circle" size={28} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {insurances.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={64} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            No insurance policies added
                        </Text>
                        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                            <Text style={styles.addButtonText}>Add Insurance</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    insurances.map((insurance) => (
                        <View key={insurance.id} style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <Ionicons name="shield-checkmark" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                                        <Text style={[styles.providerName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                            {insurance.provider_name}
                                        </Text>
                                    </View>
                                    <Text style={[styles.policyNumber, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {insurance.policy_number}
                                    </Text>
                                </View>
                                {getStatusBadge(insurance)}
                            </View>

                            <View style={styles.cardBody}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                                    <Text style={[styles.infoText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        Expires: {new Date(insurance.policy_expiry).toLocaleDateString()}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="people-outline" size={16} color="#3b82f6" />
                                    <Text style={[styles.infoText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {insurance.coverage_type.charAt(0).toUpperCase() + insurance.coverage_type.slice(1)}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="cash-outline" size={16} color="#3b82f6" />
                                    <Text style={[styles.infoText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        ₹{parseFloat(insurance.coverage_amount).toLocaleString()}
                                    </Text>
                                </View>

                                {/* Dependents Section */}
                                {insurance.dependents && insurance.dependents.length > 0 && (
                                    <View style={[styles.dependentsSection, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <Ionicons name="people" size={16} color="#10b981" />
                                            <Text style={[styles.dependentsTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                Covered Dependents ({insurance.dependents.filter(d => d.is_covered).length})
                                            </Text>
                                        </View>
                                        {insurance.dependents.map((dependent) => (
                                            dependent.is_covered && (
                                                <View key={dependent.id} style={styles.dependentItem}>
                                                    <View style={[styles.dependentIcon, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                                        <Ionicons
                                                            name={
                                                                dependent.relationship === 'spouse' ? 'heart' :
                                                                    dependent.relationship === 'child' ? 'person' :
                                                                        dependent.relationship === 'parent' ? 'person-add' :
                                                                            dependent.relationship === 'sibling' ? 'people-outline' :
                                                                                'person-circle-outline'
                                                            }
                                                            size={16}
                                                            color="#10b981"
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.dependentName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                            {dependent.name}
                                                        </Text>
                                                        <Text style={[styles.dependentDetails, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            {dependent.relationship.charAt(0).toUpperCase() + dependent.relationship.slice(1)} • {dependent.age} years
                                                        </Text>
                                                    </View>
                                                </View>
                                            )
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => openEditModal(insurance)}
                                >
                                    <Ionicons name="create-outline" size={20} color="#3b82f6" />
                                    <Text style={styles.actionButtonText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => toggleActive(insurance)}
                                >
                                    <Ionicons
                                        name={insurance.is_active ? "toggle" : "toggle-outline"}
                                        size={20}
                                        color={insurance.is_active ? "#10b981" : "#6b7280"}
                                    />
                                    <Text style={styles.actionButtonText}>
                                        {insurance.is_active ? 'Active' : 'Inactive'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleDelete(insurance)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                {editingInsurance ? 'Edit Insurance' : 'Add Insurance'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
                            </TouchableOpacity>
                        </View>

                        <Formik
                            initialValues={editingInsurance ? {
                                provider_name: editingInsurance.provider_name,
                                policy_number: editingInsurance.policy_number,
                                policy_expiry: editingInsurance.policy_expiry,
                                coverage_type: editingInsurance.coverage_type,
                                coverage_amount: editingInsurance.coverage_amount,
                                dependents_data: editingInsurance.dependents?.map(d => ({
                                    name: d.name,
                                    relationship: d.relationship,
                                    date_of_birth: d.date_of_birth,
                                    is_covered: d.is_covered,
                                })) || [],
                            } : initialFormValues}
                            validationSchema={insuranceValidationSchema}
                            onSubmit={handleSave}
                            enableReinitialize={true}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                                <>
                                    <ScrollView style={styles.modalBody}>
                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Provider Name *
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                    color: isDark ? '#ffffff' : '#111827',
                                                    borderColor: touched.provider_name && errors.provider_name ? '#ef4444' : 'transparent',
                                                    borderWidth: touched.provider_name && errors.provider_name ? 1 : 0,
                                                }
                                            ]}
                                            value={values.provider_name}
                                            onChangeText={handleChange('provider_name')}
                                            placeholder="e.g., ICICI Lombard, Star Health"
                                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        />
                                        {touched.provider_name && errors.provider_name && (
                                            <Text style={styles.errorText}>{errors.provider_name}</Text>
                                        )}

                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Policy Number *
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                    color: isDark ? '#ffffff' : '#111827',
                                                    borderColor: touched.policy_number && errors.policy_number ? '#ef4444' : 'transparent',
                                                    borderWidth: touched.policy_number && errors.policy_number ? 1 : 0,
                                                }
                                            ]}
                                            value={values.policy_number}
                                            onChangeText={handleChange('policy_number')}
                                            placeholder="Policy number"
                                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        />
                                        {touched.policy_number && errors.policy_number && (
                                            <Text style={styles.errorText}>{errors.policy_number}</Text>
                                        )}

                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Policy Expiry Date *
                                        </Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.input,
                                                styles.datePickerButton,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                    borderColor: touched.policy_expiry && errors.policy_expiry ? '#ef4444' : 'transparent',
                                                    borderWidth: touched.policy_expiry && errors.policy_expiry ? 1 : 0,
                                                }
                                            ]}
                                            onPress={() => {
                                                setTempPolicyExpiryDate(values.policy_expiry ? new Date(values.policy_expiry) : new Date());
                                                setShowPolicyExpiryPicker(true);
                                            }}
                                        >
                                            <Text style={[
                                                styles.datePickerText,
                                                { color: values.policy_expiry ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#6b7280' : '#9ca3af') }
                                            ]}>
                                                {values.policy_expiry || 'Select Policy Expiry Date'}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                        </TouchableOpacity>
                                        {touched.policy_expiry && errors.policy_expiry && (
                                            <Text style={styles.errorText}>{errors.policy_expiry}</Text>
                                        )}

                                        {/* Policy Expiry Date Picker */}
                                        {showPolicyExpiryPicker && (
                                            <DateTimePicker
                                                value={tempPolicyExpiryDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowPolicyExpiryPicker(Platform.OS === 'ios');
                                                    if (selectedDate) {
                                                        const formattedDate = selectedDate.toISOString().split('T')[0];
                                                        setFieldValue('policy_expiry', formattedDate);
                                                        setTempPolicyExpiryDate(selectedDate);
                                                    }
                                                }}
                                                minimumDate={new Date()}
                                            />
                                        )}                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Coverage Type *
                                        </Text>
                                        <View style={styles.coverageTypeButtons}>
                                            {['individual', 'family', 'employer', 'government'].map((type) => (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[
                                                        styles.coverageTypeButton,
                                                        values.coverage_type === type && styles.coverageTypeButtonActive
                                                    ]}
                                                    onPress={() => setFieldValue('coverage_type', type)}
                                                >
                                                    <Text style={[
                                                        styles.coverageTypeButtonText,
                                                        values.coverage_type === type && styles.coverageTypeButtonTextActive
                                                    ]}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Coverage Amount (₹) *
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                    color: isDark ? '#ffffff' : '#111827',
                                                    borderColor: touched.coverage_amount && errors.coverage_amount ? '#ef4444' : 'transparent',
                                                    borderWidth: touched.coverage_amount && errors.coverage_amount ? 1 : 0,
                                                }
                                            ]}
                                            value={values.coverage_amount}
                                            onChangeText={handleChange('coverage_amount')}
                                            placeholder="e.g., 500000"
                                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                            keyboardType="numeric"
                                        />
                                        {touched.coverage_amount && errors.coverage_amount && (
                                            <Text style={styles.errorText}>{errors.coverage_amount}</Text>
                                        )}

                                        {/* Dependents Section */}
                                        <FieldArray name="dependents_data">
                                            {({ push, remove }) => (
                                                <View style={[styles.dependentsFormSection, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <Text style={[styles.label, { marginTop: 0, color: isDark ? '#ffffff' : '#111827' }]}>
                                                            Dependents (Optional)
                                                        </Text>
                                                        <TouchableOpacity
                                                            style={styles.addDependentButton}
                                                            onPress={() => {
                                                                push({
                                                                    name: '',
                                                                    relationship: 'spouse',
                                                                    date_of_birth: '',
                                                                    is_covered: true,
                                                                });
                                                            }}
                                                        >
                                                            <Ionicons name="add-circle" size={20} color="#3b82f6" />
                                                            <Text style={styles.addDependentButtonText}>Add Dependent</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {values.dependents_data && values.dependents_data.map((dependent, index) => {
                                                        const dependentErrors = (errors.dependents_data as any)?.[index];
                                                        const dependentTouched = (touched.dependents_data as any)?.[index];

                                                        return (
                                                            <View key={index} style={[styles.dependentFormCard, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                                    <Text style={[styles.dependentFormTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                                        Dependent {index + 1}
                                                                    </Text>
                                                                    <TouchableOpacity onPress={() => remove(index)}>
                                                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                                                    </TouchableOpacity>
                                                                </View>

                                                                <Text style={[styles.dependentLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                                    Name *
                                                                </Text>
                                                                <TextInput
                                                                    style={[
                                                                        styles.dependentInput,
                                                                        {
                                                                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                                                            color: isDark ? '#ffffff' : '#111827',
                                                                            borderColor: dependentTouched?.name && dependentErrors?.name ? '#ef4444' : '#d1d5db',
                                                                        }
                                                                    ]}
                                                                    value={dependent.name}
                                                                    onChangeText={handleChange(`dependents_data.${index}.name`)}
                                                                    onBlur={handleBlur(`dependents_data.${index}.name`)}
                                                                    placeholder="Full name"
                                                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                                                />
                                                                {dependentTouched?.name && dependentErrors?.name && (
                                                                    <Text style={styles.errorText}>{dependentErrors.name}</Text>
                                                                )}

                                                                <Text style={[styles.dependentLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                                    Relationship *
                                                                </Text>
                                                                <View style={styles.relationshipButtons}>
                                                                    {['spouse', 'child', 'parent', 'sibling', 'other'].map((rel) => (
                                                                        <TouchableOpacity
                                                                            key={rel}
                                                                            style={[
                                                                                styles.relationshipButton,
                                                                                dependent.relationship === rel && styles.relationshipButtonActive
                                                                            ]}
                                                                            onPress={() => setFieldValue(`dependents_data.${index}.relationship`, rel)}
                                                                        >
                                                                            <Text style={[
                                                                                styles.relationshipButtonText,
                                                                                dependent.relationship === rel && styles.relationshipButtonTextActive
                                                                            ]}>
                                                                                {rel.charAt(0).toUpperCase() + rel.slice(1)}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </View>
                                                                {dependentTouched?.relationship && dependentErrors?.relationship && (
                                                                    <Text style={styles.errorText}>{dependentErrors.relationship}</Text>
                                                                )}

                                                                <Text style={[styles.dependentLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                                    Date of Birth *
                                                                </Text>
                                                                <TouchableOpacity
                                                                    style={[
                                                                        styles.dependentInput,
                                                                        styles.datePickerButton,
                                                                        {
                                                                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                                                            borderColor: dependentTouched?.date_of_birth && dependentErrors?.date_of_birth ? '#ef4444' : '#d1d5db',
                                                                        }
                                                                    ]}
                                                                    onPress={() => {
                                                                        setSelectedDependentIndex(index);
                                                                        setTempDate(dependent.date_of_birth ? new Date(dependent.date_of_birth) : new Date());
                                                                        setShowDatePicker(true);
                                                                    }}
                                                                >
                                                                    <Text style={[
                                                                        styles.datePickerText,
                                                                        { color: dependent.date_of_birth ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#6b7280' : '#9ca3af') }
                                                                    ]}>
                                                                        {dependent.date_of_birth || 'Select Date of Birth'}
                                                                    </Text>
                                                                    <Ionicons name="calendar-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                                                </TouchableOpacity>
                                                                {dependentTouched?.date_of_birth && dependentErrors?.date_of_birth && (
                                                                    <Text style={styles.errorText}>{dependentErrors.date_of_birth}</Text>
                                                                )}

                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                                    <TouchableOpacity
                                                                        style={[
                                                                            styles.checkbox,
                                                                            dependent.is_covered && styles.checkboxChecked
                                                                        ]}
                                                                        onPress={() => setFieldValue(`dependents_data.${index}.is_covered`, !dependent.is_covered)}
                                                                    >
                                                                        {dependent.is_covered && (
                                                                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                                                                        )}
                                                                    </TouchableOpacity>
                                                                    <Text style={[styles.checkboxLabel, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                                        Currently covered under this policy
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </FieldArray>

                                        {/* Date Picker Modal */}
                                        {showDatePicker && selectedDependentIndex !== null && (
                                            <DateTimePicker
                                                value={tempDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowDatePicker(Platform.OS === 'ios');
                                                    if (selectedDate && selectedDependentIndex !== null) {
                                                        const formattedDate = selectedDate.toISOString().split('T')[0];
                                                        setFieldValue(`dependents_data.${selectedDependentIndex}.date_of_birth`, formattedDate);
                                                        setTempDate(selectedDate);
                                                        if (Platform.OS === 'android') {
                                                            setSelectedDependentIndex(null);
                                                        }
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        )}
                                    </ScrollView>

                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.modalButtonCancel]}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.modalButtonSave, saving && styles.modalButtonDisabled]}
                                            onPress={() => handleSubmit()}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#ffffff" />
                                            ) : (
                                                <Text style={styles.modalButtonTextSave}>
                                                    {editingInsurance ? 'Update' : 'Add'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </Formik>
                    </View>
                </View>
            </Modal>
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    providerName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    policyNumber: {
        fontSize: 14,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeActive: {
        backgroundColor: '#d1fae5',
    },
    badgeInactive: {
        backgroundColor: '#e5e7eb',
    },
    badgeExpired: {
        backgroundColor: '#fee2e2',
    },
    badgeWarning: {
        backgroundColor: '#fef3c7',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        gap: 8,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#3b82f6',
    },
    dependentsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    dependentsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    dependentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    dependentIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dependentName: {
        fontSize: 14,
        fontWeight: '500',
    },
    dependentDetails: {
        fontSize: 12,
        marginTop: 2,
    },
    dependentsFormSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    addDependentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addDependentButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    dependentFormCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    dependentFormTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    dependentLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
        marginBottom: 6,
    },
    dependentInput: {
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    relationshipButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    relationshipButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    relationshipButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    relationshipButtonText: {
        color: '#6b7280',
        fontSize: 12,
    },
    relationshipButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkboxLabel: {
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
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
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    coverageTypeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    coverageTypeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    coverageTypeButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    coverageTypeButtonText: {
        color: '#6b7280',
        fontSize: 14,
    },
    coverageTypeButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#e5e7eb',
    },
    modalButtonSave: {
        backgroundColor: '#3b82f6',
    },
    modalButtonDisabled: {
        opacity: 0.6,
    },
    modalButtonTextCancel: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextSave: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
