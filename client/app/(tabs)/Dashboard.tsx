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
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import apiClient from '../../config/api';
import razorpayService from '../../services/razorpayService';
import { RAZORPAY_KEY_ID } from '../../config/razorpay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64; // Card width with margins

interface DailyExpenseSummary {
    date: string;
    total_amount: number;
    total_insurance: number;
    total_patient: number;
    expense_count: number;
}

interface EmergencyBooking {
    id: number;
    hospital_name: string;
    bed_type: string;
    emergency_type: string;
    patient_name?: string;
    patient_condition?: string;
    contact_person?: string;
    contact_phone?: string;
    arrival_time?: string | null;
    admission_time: string | null;
    discharge_date: string | null;
    status: string;
    created_at: string;
    reservation_expires_at?: string;
    estimated_arrival_minutes?: number;
    total_bill_amount: string | null;
    insurance_approved_amount: string | null;
    out_of_pocket_amount: string | null;
}

interface DashboardData {
    active_bookings: EmergencyBooking[];
    daily_expenses: DailyExpenseSummary[];
}

export default function Dashboard() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('User');
    const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: string }>({});
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [paymentLoading, setPaymentLoading] = useState<number | null>(null); // booking ID being paid

    const fetchDashboardData = async () => {
        try {
            // Get user name
            const user = await authService.getStoredUser();
            if (user) {
                setUserName(user.first_name || user.username);
            }

            // Get all bookings
            const bookingsResponse = await apiClient.get('/healthcare/emergency/bookings/');
            const bookingsData: any = bookingsResponse.data;
            const bookings = bookingsData.results || bookingsData;

            // Filter active bookings (not cancelled, expired, or discharged with paid out-of-pocket)
            const activeBookings = bookings
                .filter((b: EmergencyBooking) =>
                    b.status !== 'cancelled' &&
                    b.status !== 'expired' &&
                    // Show discharged only if out_of_pocket is not paid (> 0)
                    !(b.status === 'discharged' && parseFloat(b.out_of_pocket_amount || '0') <= 0)
                )
                .sort((a: EmergencyBooking, b: EmergencyBooking) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                );

            let dailyExpenses: DailyExpenseSummary[] = [];

            // Get expenses for the first active booking if available
            if (activeBookings.length > 0) {
                const expensesResponse = await apiClient.get(
                    `/healthcare/expenses/daily_summary/?admission_id=${activeBookings[0].id}`
                );
                const expensesData: any = expensesResponse.data;
                dailyExpenses = expensesData.daily_summary || [];
            }

            setDashboardData({
                active_bookings: activeBookings,
                daily_expenses: dailyExpenses,
            });
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

    // Timer effect for multiple bookings
    useEffect(() => {
        if (!dashboardData?.active_bookings) return;

        const reservedBookings = dashboardData.active_bookings.filter(
            b => b.status === 'reserved' && b.reservation_expires_at
        );

        if (reservedBookings.length === 0) return;

        const interval = setInterval(() => {
            const newTimeRemaining: { [key: number]: string } = {};

            reservedBookings.forEach(booking => {
                const now = new Date().getTime();
                const expiryTime = new Date(booking.reservation_expires_at!).getTime();
                const distance = expiryTime - now;

                if (distance < 0) {
                    newTimeRemaining[booking.id] = 'Expired';
                    // Auto-expire the booking
                    handleExpiredBooking(booking.id);
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    newTimeRemaining[booking.id] = `${minutes}m ${seconds}s`;
                }
            });

            setTimeRemaining(newTimeRemaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [dashboardData?.active_bookings]);

    const handleExpiredBooking = async (bookingId: number) => {
        try {
            await apiClient.post(`/healthcare/emergency/booking/${bookingId}/status/`, {
                status: 'expired'
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error expiring booking:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getDayLabel = (dateString: string, admissionOrBookingDate: string | null) => {
        const date = new Date(dateString);
        const baseDate = new Date(admissionOrBookingDate || dateString);
        const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `Day ${diffDays}`;
    };

    const handleArrived = async (bookingId: number) => {
        try {
            await apiClient.post(`/healthcare/emergency/booking/${bookingId}/status/`, {
                status: 'arrived'
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleCancelBooking = async (bookingId: number) => {
        try {
            await apiClient.post(`/healthcare/emergency/booking/${bookingId}/status/`, {
                status: 'cancelled'
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };

    // Demo functions for testing
    const handleDemoAdmitted = async (bookingId: number) => {
        try {
            await apiClient.post(`/healthcare/emergency/booking/${bookingId}/status/`, {
                status: 'admitted'
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error setting admitted:', error);
        }
    };

    const handleDemoDischarged = async (bookingId: number) => {
        try {
            await apiClient.post(`/healthcare/emergency/booking/${bookingId}/status/`, {
                status: 'discharged'
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error setting discharged:', error);
        }
    };

    const handlePayNow = async (booking: EmergencyBooking) => {
        if (paymentLoading) return; // Prevent double-tap

        setPaymentLoading(booking.id);

        try {
            // Step 1: Create Razorpay order
            const orderResponse = await apiClient.post('/healthcare/out-of-pocket-payments/create_razorpay_order/', {
                admission_id: booking.id
            });

            const orderData = orderResponse.data as {
                order_id: string;
                amount: number;
                currency: string;
                key_id: string;
                payment_id: number;
                admission_id: number;
                hospital_name: string;
            };

            // Step 2: Open Razorpay checkout
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.order_id,
                name: 'Doklink Healthcare',
                description: `Payment for ${booking.hospital_name}`,
                prefill: {
                    name: userName,
                },
                theme: {
                    color: '#3b82f6'
                }
            };

            razorpayService.openCheckout(
                options,
                async (response) => {
                    // Step 3: Verify payment on backend
                    try {
                        await apiClient.post('/healthcare/out-of-pocket-payments/verify_payment/', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        Alert.alert(
                            'Payment Successful',
                            'Your out-of-pocket payment has been completed successfully.',
                            [{ text: 'OK' }]
                        );

                        // Refresh dashboard to remove paid booking from carousel
                        fetchDashboardData();
                    } catch (verifyError) {
                        console.error('Payment verification failed:', verifyError);
                        Alert.alert(
                            'Verification Failed',
                            'Payment may have succeeded but verification failed. Please contact support.',
                            [{ text: 'OK' }]
                        );
                    }
                    setPaymentLoading(null);
                },
                (error) => {
                    setPaymentLoading(null);
                    if (error.code === 0) {
                        // User cancelled
                        console.log('Payment cancelled by user');
                    } else {
                        Alert.alert(
                            'Payment Failed',
                            error.description || 'An error occurred during payment.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            );
        } catch (error: any) {
            setPaymentLoading(null);
            console.error('Error initiating payment:', error);
            Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to initiate payment. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleCarouselScroll = (event: any) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / CARD_WIDTH);
        setActiveCardIndex(index);
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
                        {userName}
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

            {dashboardData?.active_bookings && dashboardData.active_bookings.length > 0 ? (
                <>
                    {/* Patient Journey Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="medical" size={24} color="#10b981" />
                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                Patient Journey ({dashboardData.active_bookings.length} Active)
                            </Text>
                        </View>

                        {/* Carousel Pagination Dots */}
                        {dashboardData.active_bookings.length > 1 && (
                            <View style={styles.paginationDots}>
                                {dashboardData.active_bookings.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            { backgroundColor: index === activeCardIndex ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db') }
                                        ]}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Horizontal Carousel of Booking Cards */}
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleCarouselScroll}
                            scrollEventThrottle={16}
                            contentContainerStyle={styles.carouselContainer}
                            decelerationRate="fast"
                            snapToInterval={CARD_WIDTH + 16}
                            snapToAlignment="center"
                        >
                            {dashboardData.active_bookings.map((booking, index) => (
                                <View key={booking.id} style={[styles.carouselCard, { width: CARD_WIDTH }]}>
                                    {/* Admission Summary Card */}
                                    <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                                        <View style={styles.summaryHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.hospitalName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                    {booking.hospital_name}
                                                </Text>
                                                <Text style={[styles.bedType, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {booking.bed_type === 'icu' ? 'ICU' : 'General Ward'}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, {
                                                backgroundColor: booking.status === 'admitted' ? '#10b98120' :
                                                    booking.status === 'reserved' ? '#3b82f620' :
                                                        booking.status === 'arrived' ? '#f59e0b20' :
                                                            booking.status === 'discharged' ? '#6b728020' : '#10b98120'
                                            }]}>
                                                <Text style={[styles.statusText, {
                                                    color: booking.status === 'admitted' ? '#10b981' :
                                                        booking.status === 'reserved' ? '#3b82f6' :
                                                            booking.status === 'arrived' ? '#f59e0b' :
                                                                booking.status === 'discharged' ? '#6b7280' : '#10b981'
                                                }]}>
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Patient Name Badge */}
                                        {booking.patient_name && (
                                            <View style={[styles.patientBadge, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                                <Ionicons name="person" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                                <Text style={[styles.patientBadgeText, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                    {booking.patient_name}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Reservation Timer for Reserved Status Only */}
                                        {booking.status === 'reserved' && (
                                            <View style={[styles.reservationTimer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                                <View style={styles.timerRow}>
                                                    <Ionicons name="time-outline" size={20} color="#ef4444" />
                                                    <Text style={[styles.timerLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Reservation expires in:
                                                    </Text>
                                                    <Text style={[styles.timerValue, { color: '#ef4444' }]}>
                                                        {timeRemaining[booking.id] || 'Loading...'}
                                                    </Text>
                                                </View>
                                                {booking.estimated_arrival_minutes && (
                                                    <Text style={[styles.estimatedArrival, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Estimated arrival: {booking.estimated_arrival_minutes} minutes
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        {/* Arrived at Timestamp for Arrived Status */}
                                        {booking.status === 'arrived' && booking.arrival_time && (
                                            <View style={[styles.arrivedInfo, { backgroundColor: isDark ? '#065f4620' : '#10b98120', borderColor: isDark ? '#065f46' : '#10b981' }]}>
                                                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                                <Text style={[styles.arrivedText, { color: isDark ? '#34d399' : '#059669' }]}>
                                                    Arrived at {formatDate(booking.arrival_time)} at {new Date(booking.arrival_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Action Buttons for Reserved Status */}
                                        {booking.status === 'reserved' && timeRemaining[booking.id] !== 'Expired' && (
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.arrivedButton]}
                                                    onPress={() => handleArrived(booking.id)}
                                                >
                                                    <Ionicons name="location" size={20} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>I've Arrived</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.cancelButton]}
                                                    onPress={() => handleCancelBooking(booking.id)}
                                                >
                                                    <Ionicons name="close-circle" size={20} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Cancel Booking</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* Get Directions and Call Hospital Buttons */}
                                        {(booking.status === 'reserved' || booking.status === 'arrived') && (
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.directionsButton]}
                                                    onPress={() => {
                                                        console.log('Get directions to hospital');
                                                    }}
                                                >
                                                    <Ionicons name="navigate" size={20} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Get Directions</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.callButton]}
                                                    onPress={() => {
                                                        console.log('Call hospital');
                                                    }}
                                                >
                                                    <Ionicons name="call" size={20} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Call Hospital</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* Demo Buttons for Testing */}
                                        <View style={[styles.demoSection, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                            <Text style={[styles.demoLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                🧪 Demo Controls
                                            </Text>
                                            <View style={styles.demoButtons}>
                                                {booking.status !== 'admitted' && booking.status !== 'discharged' && (
                                                    <TouchableOpacity
                                                        style={[styles.demoButton, { backgroundColor: '#8b5cf6' }]}
                                                        onPress={() => handleDemoAdmitted(booking.id)}
                                                    >
                                                        <Text style={styles.demoButtonText}>Set Admitted</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {booking.status !== 'discharged' && (
                                                    <TouchableOpacity
                                                        style={[styles.demoButton, { backgroundColor: '#6b7280' }]}
                                                        onPress={() => handleDemoDischarged(booking.id)}
                                                    >
                                                        <Text style={styles.demoButtonText}>Set Discharged</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        {/* Booking Information Section */}
                                        <View style={[styles.bookingInfoSection, { backgroundColor: isDark ? '#111827' : '#f9fafb', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                            <Text style={[styles.bookingInfoTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                Booking Information
                                            </Text>

                                            <View style={styles.infoRow}>
                                                <Text style={[styles.infoLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    Emergency Type:
                                                </Text>
                                                <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                    {booking.emergency_type}
                                                </Text>
                                            </View>

                                            <View style={styles.infoRow}>
                                                <Text style={[styles.infoLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    Bed Type:
                                                </Text>
                                                <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                    {booking.bed_type === 'icu' ? 'ICU Bed' : 'General Bed'}
                                                </Text>
                                            </View>

                                            {booking.contact_person && (
                                                <View style={styles.infoRow}>
                                                    <Text style={[styles.infoLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Contact Person:
                                                    </Text>
                                                    <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                        {booking.contact_person}
                                                    </Text>
                                                </View>
                                            )}

                                            {booking.contact_phone && (
                                                <View style={styles.infoRow}>
                                                    <Text style={[styles.infoLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Contact Phone:
                                                    </Text>
                                                    <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                        {booking.contact_phone}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Date Range */}
                                        <View style={styles.dateRange}>
                                            <View style={styles.dateItem}>
                                                <Ionicons name="calendar" size={16} color="#3b82f6" />
                                                <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    Booked
                                                </Text>
                                                <Text style={[styles.dateValue, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                                    {formatDate(booking.created_at)}
                                                </Text>
                                            </View>
                                            {booking.admission_time && (
                                                <>
                                                    <View style={styles.dateDivider} />
                                                    <View style={styles.dateItem}>
                                                        <Ionicons name="enter-outline" size={16} color="#10b981" />
                                                        <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            Admitted
                                                        </Text>
                                                        <Text style={[styles.dateValue, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                                            {formatDate(booking.admission_time)}
                                                        </Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>

                                        {booking.discharge_date && (
                                            <View style={styles.dateRange}>
                                                <View style={styles.dateItem}>
                                                    <Ionicons name="exit-outline" size={16} color="#6b7280" />
                                                    <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Discharged
                                                    </Text>
                                                    <Text style={[styles.dateValue, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                                        {formatDate(booking.discharge_date)}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Financial Summary */}
                                        {booking.total_bill_amount && (
                                            <View style={[styles.financialSummary, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                                <View style={styles.financialRow}>
                                                    <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Total Bill
                                                    </Text>
                                                    <Text style={[styles.financialValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                        ₹{parseFloat(booking.total_bill_amount).toLocaleString('en-IN')}
                                                    </Text>
                                                </View>
                                                <View style={styles.financialRow}>
                                                    <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Insurance Covered
                                                    </Text>
                                                    <Text style={[styles.financialValue, { color: '#10b981' }]}>
                                                        ₹{parseFloat(booking.insurance_approved_amount || '0').toLocaleString('en-IN')}
                                                    </Text>
                                                </View>
                                                <View style={styles.financialRow}>
                                                    <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                        Out-of-Pocket
                                                    </Text>
                                                    <Text style={[styles.financialValue, { color: '#f59e0b' }]}>
                                                        ₹{parseFloat(booking.out_of_pocket_amount || '0').toLocaleString('en-IN')}
                                                    </Text>
                                                </View>

                                                {/* Pay Now Button - Only for discharged bookings with unpaid out-of-pocket */}
                                                {booking.status === 'discharged' && parseFloat(booking.out_of_pocket_amount || '0') > 0 && (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.payNowButton,
                                                            paymentLoading === booking.id && styles.payNowButtonDisabled
                                                        ]}
                                                        onPress={() => handlePayNow(booking)}
                                                        disabled={paymentLoading === booking.id}
                                                    >
                                                        {paymentLoading === booking.id ? (
                                                            <ActivityIndicator size="small" color="#ffffff" />
                                                        ) : (
                                                            <>
                                                                <Ionicons name="card-outline" size={20} color="#ffffff" />
                                                                <Text style={styles.payNowButtonText}>
                                                                    Pay Now - ₹{parseFloat(booking.out_of_pocket_amount || '0').toLocaleString('en-IN')}
                                                                </Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Daily Expense Timeline - Only for admitted bookings */}
                        {dashboardData.active_bookings.some(b => b.status === 'admitted') && (
                            <>
                                <Text style={[styles.timelineTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    Daily Expense Breakdown
                                </Text>

                                <View style={styles.timeline}>
                                    {dashboardData.daily_expenses && dashboardData.daily_expenses.length > 0 ? dashboardData.daily_expenses.map((expense, index) => (
                                        <View key={expense.date} style={styles.timelineItem}>
                                            <View style={styles.timelineConnector}>
                                                <View style={[styles.timelineDot, { backgroundColor: '#3b82f6' }]} />
                                                {index < dashboardData.daily_expenses.length - 1 && (
                                                    <View style={[styles.timelineLine, { backgroundColor: isDark ? '#374151' : '#d1d5db' }]} />
                                                )}
                                            </View>

                                            <View style={[styles.expenseCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                                                <View style={styles.expenseHeader}>
                                                    <View>
                                                        <Text style={[styles.dayLabel, { color: '#3b82f6' }]}>
                                                            {getDayLabel(expense.date, dashboardData.active_bookings[activeCardIndex]?.admission_time || dashboardData.active_bookings[activeCardIndex]?.created_at)}
                                                        </Text>
                                                        <Text style={[styles.expenseDate, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            {formatShortDate(expense.date)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.expenseAmount}>
                                                        <Text style={[styles.amountValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                                            ₹{expense.total_amount.toLocaleString('en-IN')}
                                                        </Text>
                                                        <Text style={[styles.amountLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            {expense.expense_count} {expense.expense_count === 1 ? 'expense' : 'expenses'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.expenseBreakdown}>
                                                    <View style={styles.breakdownItem}>
                                                        <View style={[styles.breakdownDot, { backgroundColor: '#10b981' }]} />
                                                        <Text style={[styles.breakdownText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            Insurance: ₹{(expense.total_insurance || 0).toLocaleString('en-IN')}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.breakdownItem}>
                                                        <View style={[styles.breakdownDot, { backgroundColor: '#f59e0b' }]} />
                                                        <Text style={[styles.breakdownText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                            Your share: ₹{(expense.total_patient || 0).toLocaleString('en-IN')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    )) : (
                                        <View style={styles.noExpensesCard}>
                                            <Text style={[styles.noExpensesText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                No expense details available yet
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={isDark ? '#4b5563' : '#d1d5db'} />
                    <Text style={[styles.emptyTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        No Current Admission
                    </Text>
                    <Text style={[styles.emptyText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                        Your patient journey will appear here once you have an admission
                    </Text>
                </View>
            )}

            {/* View Booking History Button - Always visible */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.viewHistoryButton}
                    onPress={() => router.push('/pages/dashboard/BookingHistory')}
                >
                    <Text style={styles.viewHistoryText}>View Booking History</Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
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
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    hospitalName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bedType: {
        fontSize: 14,
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateRange: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    dateItem: {
        flex: 1,
        gap: 4,
    },
    dateDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
    },
    dateLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    financialSummary: {
        borderTopWidth: 1,
        paddingTop: 16,
        gap: 8,
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: 14,
    },
    financialValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    managePaymentButton: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    managePaymentText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    timeline: {
        marginBottom: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineConnector: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 8,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    expenseCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    expenseDate: {
        fontSize: 12,
        marginTop: 2,
    },
    expenseAmount: {
        alignItems: 'flex-end',
    },
    amountValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    amountLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    expenseBreakdown: {
        gap: 6,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakdownDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    breakdownText: {
        fontSize: 13,
    },
    viewHistoryButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    viewHistoryText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    noExpensesCard: {
        padding: 20,
        alignItems: 'center',
    },
    noExpensesText: {
        fontSize: 14,
        textAlign: 'center',
    },
    reservationTimer: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    timerLabel: {
        fontSize: 14,
        color: '#1e40af',
        fontWeight: '600',
    },
    timerValue: {
        fontSize: 16,
        color: '#1e40af',
        fontWeight: 'bold',
    },
    estimatedArrival: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    arrivedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    arrivedText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrivedButton: {
        backgroundColor: '#10b981',
    },
    cancelButton: {
        backgroundColor: '#ef4444',
    },
    directionsButton: {
        backgroundColor: '#3b82f6',
    },
    callButton: {
        backgroundColor: '#10b981',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    bookingInfoSection: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    bookingInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb20',
    },
    infoLabel: {
        fontSize: 14,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    carouselContainer: {
        paddingHorizontal: 8,
    },
    carouselCard: {
        marginHorizontal: 8,
    },
    patientBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    patientBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    demoSection: {
        borderTopWidth: 1,
        marginTop: 16,
        paddingTop: 12,
    },
    demoLabel: {
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    demoButtons: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
    },
    demoButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    demoButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    payNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    payNowButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    payNowButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
