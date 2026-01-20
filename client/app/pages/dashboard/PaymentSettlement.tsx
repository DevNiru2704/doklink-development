import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/config/api';
import razorpayService from '@/services/razorpayService';
import { authService } from '@/services/authService';
import { RAZORPAY_KEY_ID } from '@/config/razorpay';

interface OutOfPocketPayment {
    id: number;
    admission: number;
    total_amount: string;
    insurance_covered: string;
    out_of_pocket: string;
    payment_status: 'pending' | 'processing' | 'completed' | 'failed';
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    payment_date?: string;
    created_at: string;
}

interface EmergencyBooking {
    id: number;
    hospital_name: string;
    admission_time: string;
    discharge_date?: string;
    emergency_type_display: string;
    bed_type: string;
    total_bill_amount?: string;
    insurance_approved_amount?: string;
    out_of_pocket_amount?: string;
}

export default function PaymentSettlement() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const admissionId = params.admissionId as string;

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [admission, setAdmission] = useState<EmergencyBooking | null>(null);
    const [payment, setPayment] = useState<OutOfPocketPayment | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'all' | 'card' | 'upi'>('all');

    useEffect(() => {
        if (admissionId) {
            loadPaymentDetails();
        }
    }, [admissionId]);

    const loadPaymentDetails = async () => {
        try {
            setLoading(true);

            // Get admission details
            const admissionResponse = await apiClient.get(`/healthcare/emergency/bookings/${admissionId}/`);
            setAdmission(admissionResponse.data as EmergencyBooking);

            // Get payment details
            const paymentResponse = await apiClient.get(
                `/healthcare/out-of-pocket-payments/by_admission/?admission_id=${admissionId}`
            );
            setPayment(paymentResponse.data as OutOfPocketPayment);
        } catch (error) {
            console.error('Error loading payment details:', error);
            Alert.alert('Error', 'Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        if (!payment || payment.payment_status === 'completed') {
            return;
        }

        try {
            setProcessing(true);

            // Create Razorpay order
            const orderResponse = await apiClient.post('/healthcare/out-of-pocket-payments/create_razorpay_order/', {
                admission_id: admissionId,
            });

            const orderData: any = orderResponse.data;
            const { order_id, key_id, amount } = orderData;

            // Get user details for prefill
            const user = await authService.getStoredUser();

            const razorpayOptions = {
                key: RAZORPAY_KEY_ID,
                amount: amount,
                currency: 'INR',
                order_id: order_id,
                name: 'Doklink Healthcare',
                description: `Payment for ${admission?.hospital_name || 'Hospital'} admission`,
                prefill: {
                    name: user?.first_name || user?.username || '',
                    email: user?.email || '',
                    contact: user?.profile?.phone_number || '',
                },
                theme: {
                    color: '#3b82f6',
                },
            };

            const onSuccess = (response: any) => {
                verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
            };

            const onError = (error: any) => {
                console.error('Payment error:', error);
                Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed');
                setProcessing(false);
            };

            // Open Razorpay checkout based on selected method
            if (selectedMethod === 'upi') {
                await razorpayService.openUPICheckout(razorpayOptions, onSuccess, onError);
            } else if (selectedMethod === 'card') {
                await razorpayService.openCardCheckout(razorpayOptions, onSuccess, onError);
            } else {
                // All payment methods (Card, UPI, Net Banking, Wallets)
                await razorpayService.openCheckout(razorpayOptions, onSuccess, onError);
            }
        } catch (error: any) {
            console.error('Error initiating payment:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
        try {
            await apiClient.post('/healthcare/out-of-pocket-payments/verify_payment/', {
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
            });

            Alert.alert('Success', 'Payment completed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error verifying payment:', error);
            Alert.alert('Error', 'Payment verification failed');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'processing':
                return '#3b82f6';
            case 'failed':
                return '#ef4444';
            default:
                return '#f59e0b';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return 'checkmark-circle';
            case 'processing':
                return 'hourglass';
            case 'failed':
                return 'close-circle';
            default:
                return 'time';
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Settlement</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </View>
        );
    }

    if (!admission || !payment) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Settlement</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyTitle}>Payment Not Found</Text>
                    <Text style={styles.emptySubtitle}>
                        Unable to load payment details for this admission
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Settlement</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Admission Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Admission Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hospital:</Text>
                        <Text style={styles.detailValue}>{admission.hospital_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Emergency Type:</Text>
                        <Text style={styles.detailValue}>{admission.emergency_type_display}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Admitted:</Text>
                        <Text style={styles.detailValue}>{formatDate(admission.admission_time)}</Text>
                    </View>
                    {admission.discharge_date && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Discharged:</Text>
                            <Text style={styles.detailValue}>{formatDate(admission.discharge_date)}</Text>
                        </View>
                    )}
                </View>

                {/* Payment Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Breakdown</Text>

                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Total Bill Amount</Text>
                        <Text style={styles.breakdownValue}>
                            ₹{parseFloat(payment.total_amount).toLocaleString('en-IN')}
                        </Text>
                    </View>

                    <View style={[styles.breakdownItem, styles.successBackground]}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            <Text style={[styles.breakdownLabel, { color: '#10b981' }]}>
                                Insurance Covered
                            </Text>
                        </View>
                        <Text style={[styles.breakdownValue, { color: '#10b981' }]}>
                            ₹{parseFloat(payment.insurance_covered).toLocaleString('en-IN')}
                        </Text>
                    </View>

                    <View style={[styles.breakdownItem, styles.warningBackground]}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                            <Text style={[styles.breakdownLabel, { color: '#f59e0b' }]}>
                                Out-of-Pocket (Your Responsibility)
                            </Text>
                        </View>
                        <Text style={[styles.breakdownValue, { color: '#f59e0b', fontSize: 20 }]}>
                            ₹{parseFloat(payment.out_of_pocket).toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>

                {/* Payment Status */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payment.payment_status)}20` }]}>
                        <Ionicons
                            name={getStatusIcon(payment.payment_status) as any}
                            size={24}
                            color={getStatusColor(payment.payment_status)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(payment.payment_status) }]}>
                            {payment.payment_status.toUpperCase()}
                        </Text>
                    </View>

                    {payment.payment_date && (
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentInfoLabel}>Payment Date:</Text>
                            <Text style={styles.paymentInfoValue}>{formatDate(payment.payment_date)}</Text>
                        </View>
                    )}

                    {payment.razorpay_payment_id && (
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentInfoLabel}>Transaction ID:</Text>
                            <Text style={styles.paymentInfoValue}>{payment.razorpay_payment_id}</Text>
                        </View>
                    )}
                </View>

                {/* Payment Method Selection */}
                {payment.payment_status === 'pending' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Select Payment Method</Text>
                        <View style={styles.paymentMethodContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    selectedMethod === 'all' && styles.methodButtonActive
                                ]}
                                onPress={() => setSelectedMethod('all')}
                            >
                                <Ionicons
                                    name="wallet"
                                    size={24}
                                    color={selectedMethod === 'all' ? '#3b82f6' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.methodText,
                                    selectedMethod === 'all' && styles.methodTextActive
                                ]}>
                                    All Methods
                                </Text>
                                <Text style={styles.methodSubtext}>Card, UPI, Net Banking, Wallet</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    selectedMethod === 'upi' && styles.methodButtonActive
                                ]}
                                onPress={() => setSelectedMethod('upi')}
                            >
                                <Ionicons
                                    name="phone-portrait"
                                    size={24}
                                    color={selectedMethod === 'upi' ? '#3b82f6' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.methodText,
                                    selectedMethod === 'upi' && styles.methodTextActive
                                ]}>
                                    UPI Only
                                </Text>
                                <Text style={styles.methodSubtext}>PhonePe, GPay, Paytm</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    selectedMethod === 'card' && styles.methodButtonActive
                                ]}
                                onPress={() => setSelectedMethod('card')}
                            >
                                <Ionicons
                                    name="card"
                                    size={24}
                                    color={selectedMethod === 'card' ? '#3b82f6' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.methodText,
                                    selectedMethod === 'card' && styles.methodTextActive
                                ]}>
                                    Card Only
                                </Text>
                                <Text style={styles.methodSubtext}>Credit/Debit Card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Pay Now Button */}
                {payment.payment_status === 'pending' && (
                    <TouchableOpacity
                        style={[styles.payButton, processing && styles.payButtonDisabled]}
                        onPress={initiatePayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text style={styles.payButtonText}>Processing...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="card" size={24} color="#ffffff" />
                                <Text style={styles.payButtonText}>
                                    Pay ₹{parseFloat(payment.out_of_pocket).toLocaleString('en-IN')} Now
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {payment.payment_status === 'completed' && (
                    <View style={styles.completedBanner}>
                        <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                        <Text style={styles.completedText}>Payment Completed Successfully!</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    breakdownValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    successBackground: {
        backgroundColor: '#f0fdf4',
    },
    warningBackground: {
        backgroundColor: '#fffbeb',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    paymentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    paymentInfoLabel: {
        fontSize: 13,
        color: '#6b7280',
    },
    paymentInfoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    payButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    payButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    completedBanner: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    completedText: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: 'bold',
    },
    paymentMethodContainer: {
        gap: 12,
    },
    methodButton: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    methodButtonActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    methodText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginTop: 8,
    },
    methodTextActive: {
        color: '#3b82f6',
    },
    methodSubtext: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
});
