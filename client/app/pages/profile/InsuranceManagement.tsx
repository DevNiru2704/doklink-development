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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../../config/api';

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
}

interface InsuranceForm {
    provider_name: string;
    policy_number: string;
    policy_expiry: string;
    coverage_type: string;
    coverage_amount: string;
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

    const initialFormValues: InsuranceForm = {
        provider_name: '',
        policy_number: '',
        policy_expiry: '',
        coverage_type: 'individual',
        coverage_amount: '',
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
                                <View>
                                    <Text style={[styles.providerName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                        {insurance.provider_name}
                                    </Text>
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
                            } : initialFormValues}
                            validationSchema={insuranceValidationSchema}
                            onSubmit={handleSave}
                            enableReinitialize={true}
                        >
                            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
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
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                                    color: isDark ? '#ffffff' : '#111827',
                                                    borderColor: touched.policy_expiry && errors.policy_expiry ? '#ef4444' : 'transparent',
                                                    borderWidth: touched.policy_expiry && errors.policy_expiry ? 1 : 0,
                                                }
                                            ]}
                                            value={values.policy_expiry}
                                            onChangeText={handleChange('policy_expiry')}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        />
                                        {touched.policy_expiry && errors.policy_expiry && (
                                            <Text style={styles.errorText}>{errors.policy_expiry}</Text>
                                        )}

                                        <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
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
