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
import { authService } from '../../services/authService';
import apiClient from '../../config/api';

interface Doctor {
    id: number;
    name: string;
    specialization: string;
}

interface Hospital {
    id: number;
    name: string;
    city: string;
}

interface Treatment {
    id: number;
    treatment_name: string;
    doctor: Doctor;
    hospital: Hospital;
    started_date: string;
}

interface Booking {
    id: number;
    booking_type: string;
    booking_type_display: string;
    hospital: Hospital;
    doctor?: Doctor;
    booking_date: string;
    booking_time: string;
    status: string;
    status_display: string;
    location_details: string;
}

interface Payment {
    id: number;
    title: string;
    provider_name: string;
    amount: string;
    due_date: string;
    status: string;
}

interface DashboardData {
    ongoing_treatments: Treatment[];
    upcoming_bookings: Booking[];
    upcoming_payments: Payment[];
    total_treatments: number;
    total_bookings: number;
    total_pending_payments: number;
}

export default function Dashboard() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('User');

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get<DashboardData>('/healthcare/dashboard/');
            setDashboardData(response.data);

            // Get user name
            const user = await authService.getStoredUser();
            if (user) {
                setUserName(user.first_name || user.username);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'cancelled':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <View>
                    <Text style={[styles.welcomeText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Welcome back,
                    </Text>
                    <Text style={[styles.userName, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Mr. {userName}
                    </Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color={isDark ? '#ffffff' : '#111827'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Upcoming Bookings */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={24} color="#3b82f6" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Upcoming Bookings
                    </Text>
                </View>
                {dashboardData?.upcoming_bookings.map((booking) => (
                    <View
                        key={booking.id}
                        style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                {booking.booking_type_display}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                    {booking.status_display}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.cardSubtitle, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            {booking.hospital.name}
                        </Text>
                        <View style={styles.cardDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {formatDate(booking.booking_date)}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {formatTime(booking.booking_time)}
                                </Text>
                            </View>
                        </View>
                        {booking.doctor && (
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Dr. {booking.doctor.name} - {booking.doctor.specialization}
                                </Text>
                            </View>
                        )}
                        {booking.location_details && (
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {booking.location_details}
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>

            {/* Ongoing Treatments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pulse" size={24} color="#10b981" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Ongoing Treatments
                    </Text>
                </View>
                {dashboardData?.ongoing_treatments.map((treatment) => (
                    <View
                        key={treatment.id}
                        style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    >
                        <Text style={[styles.cardTitle, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                            {treatment.treatment_name}
                        </Text>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                            <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Dr. {treatment.doctor.name}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="business-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                            <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {treatment.hospital.name}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Started: {formatDate(treatment.started_date)}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Upcoming Payments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="wallet" size={24} color="#f59e0b" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Upcoming Payments
                    </Text>
                </View>
                {dashboardData?.upcoming_payments.map((payment) => (
                    <View
                        key={payment.id}
                        style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    >
                        <View style={styles.paymentHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                    {payment.title}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: isDark ? '#d1d5db' : '#374151' }]}>
                                    {payment.provider_name}
                                </Text>
                            </View>
                            <Text style={[styles.amount, { color: '#3b82f6' }]}>
                                ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                Due: {formatDate(payment.due_date)}
                            </Text>
                        </View>
                    </View>
                ))}
                <TouchableOpacity
                    style={styles.viewHistoryButton}
                    onPress={() => router.push('/pages/PaymentHistory')}
                >
                    <Text style={styles.viewHistoryText}>View Payment History</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
        padding: 20,
        paddingTop: 60,
    },
    welcomeText: {
        fontSize: 14,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        padding: 20,
        paddingTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    detailText: {
        fontSize: 14,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewHistoryButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    viewHistoryText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
