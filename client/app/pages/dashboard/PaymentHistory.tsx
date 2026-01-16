import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '@/config/api';

interface Payment {
    id: number;
    title: string;
    provider_name: string;
    amount: string;
    due_date: string;
    paid_date: string | null;
    status: string;
    payment_type_display: string;
}

export default function PaymentHistory() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPaymentHistory = async () => {
        try {
            const response = await apiClient.get<Payment[]>('/healthcare/payments/history/');
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPaymentHistory();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'overdue':
                return '#ef4444';
            case 'cancelled':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'checkmark-circle';
            case 'pending':
                return 'time';
            case 'overdue':
                return 'alert-circle';
            case 'cancelled':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
                <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Payment History
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
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
                    Payment History
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {payments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={isDark ? '#374151' : '#d1d5db'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            No payment history found
                        </Text>
                    </View>
                ) : (
                    payments.map((payment) => (
                        <View
                            key={payment.id}
                            style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                        {payment.title}
                                    </Text>
                                    <Text style={[styles.cardSubtitle, { color: isDark ? '#d1d5db' : '#374151' }]}>
                                        {payment.provider_name}
                                    </Text>
                                    <Text style={[styles.paymentType, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {payment.payment_type_display}
                                    </Text>
                                </View>
                                <View style={styles.amountContainer}>
                                    <Text style={[styles.amount, { color: '#3b82f6' }]}>
                                        ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.dateInfo}>
                                    <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        Due: {formatDate(payment.due_date)}
                                    </Text>
                                    {payment.paid_date && (
                                        <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Paid: {formatDate(payment.paid_date)}
                                        </Text>
                                    )}
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(payment.status) + '20' },
                                    ]}
                                >
                                    <Ionicons
                                        name={getStatusIcon(payment.status) as any}
                                        size={16}
                                        color={getStatusColor(payment.status)}
                                    />
                                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    paymentType: {
        fontSize: 12,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    dateInfo: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
