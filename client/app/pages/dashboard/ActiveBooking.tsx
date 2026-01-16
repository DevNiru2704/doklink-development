import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { emergencyService } from '@/services/emergencyService';
import { EmergencyBooking, BOOKING_STATUS_DISPLAY } from '@/utils/emergency/types';

export default function ActiveBooking() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;

    const [booking, setBooking] = useState<EmergencyBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    useEffect(() => {
        loadBooking();
    }, [bookingId]);

    useEffect(() => {
        if (booking?.reservation_expires_at && booking.status === 'reserved') {
            const interval = setInterval(() => {
                updateCountdown();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [booking]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const data = await emergencyService.getBooking(Number(bookingId));
            setBooking(data);
        } catch (error) {
            console.error('Error loading booking:', error);
            Alert.alert('Error', 'Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBooking();
        setRefreshing(false);
    };

    const updateCountdown = () => {
        if (!booking?.reservation_expires_at) return;

        const now = new Date().getTime();
        const expiryTime = new Date(booking.reservation_expires_at).getTime();
        const diff = expiryTime - now;

        if (diff <= 0) {
            setTimeRemaining('EXPIRED');
            return;
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    const handleMarkArrived = async () => {
        Alert.alert(
            'Mark as Arrived',
            'Have you arrived at the hospital?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, I\'ve Arrived',
                    onPress: async () => {
                        try {
                            const updated = await emergencyService.markPatientArrived(Number(bookingId));
                            setBooking(updated);
                            Alert.alert('Success', 'Status updated successfully');
                        } catch (error: any) {
                            console.error('Error updating status:', error);
                            const errorMessage = error?.response?.data?.error
                                || error?.response?.data?.message
                                || error?.message
                                || 'Failed to update status';
                            Alert.alert('Error', errorMessage);
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this emergency booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await emergencyService.cancelBooking(Number(bookingId), 'Cancelled by user');
                            Alert.alert('Cancelled', 'Booking has been cancelled', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel booking');
                        }
                    },
                },
            ]
        );
    };

    const handleCallHospital = () => {
        if (booking?.hospital.phone_number) {
            Linking.openURL(`tel:${booking.hospital.phone_number}`);
        }
    };

    const handleGetDirections = () => {
        if (booking?.hospital.latitude && booking?.hospital.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.hospital.latitude},${booking.hospital.longitude}`;
            Linking.openURL(url);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reserved':
                return '#FF6B6B';
            case 'patient_on_way':
                return '#FFA500';
            case 'arrived':
                return '#4ECDC4';
            case 'admitted':
                return '#95E1D3';
            case 'cancelled':
                return '#999';
            default:
                return '#666';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'reserved':
                return 'time-outline';
            case 'patient_on_way':
                return 'car-outline';
            case 'arrived':
                return 'location-outline';
            case 'admitted':
                return 'checkmark-circle-outline';
            case 'cancelled':
                return 'close-circle-outline';
            default:
                return 'help-outline';
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Booking</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Booking</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Booking not found</Text>
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
                <Text style={styles.headerTitle}>Active Booking</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Ionicons name={getStatusIcon(booking.status) as any} size={48} color="#FFF" />
                    <Text style={styles.statusText}>
                        {booking.status_display || BOOKING_STATUS_DISPLAY[booking.status]}
                    </Text>
                    {booking.status === 'reserved' && timeRemaining && (
                        <View style={styles.timerContainer}>
                            <Ionicons name="time-outline" size={20} color="#FFF" />
                            <Text style={styles.timerText}>
                                {timeRemaining === 'EXPIRED' ? 'Reservation Expired' : `Time Remaining: ${timeRemaining}`}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Hospital Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Hospital Details</Text>
                    <Text style={styles.hospitalName}>{booking.hospital.name}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={18} color="#666" />
                        <Text style={styles.infoText}>{booking.hospital.address}</Text>
                    </View>
                    {booking.hospital.phone_number && (
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color="#666" />
                            <Text style={styles.infoText}>{booking.hospital.phone_number}</Text>
                        </View>
                    )}
                </View>

                {/* Booking Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking Information</Text>
                    <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Emergency Type:</Text>
                        <Text style={styles.detailValueColumn}>
                            {booking.emergency_type_display || booking.emergency_type}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bed Type:</Text>
                        <Text style={styles.detailValue}>
                            {booking.bed_type_display || booking.bed_type || 'General'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Patient Condition:</Text>
                        <Text style={styles.detailValue}>{booking.patient_condition}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contact Person:</Text>
                        <Text style={styles.detailValue}>{booking.contact_person}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contact Phone:</Text>
                        <Text style={styles.detailValue}>{booking.contact_phone}</Text>
                    </View>
                    {booking.estimated_arrival_minutes && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Estimated Arrival:</Text>
                            <Text style={styles.detailValue}>{booking.estimated_arrival_minutes} minutes</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCallHospital}>
                        <Ionicons name="call" size={24} color="#FFF" />
                        <Text style={styles.actionButtonText}>Call Hospital</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
                        <Ionicons name="navigate" size={24} color="#FFF" />
                        <Text style={styles.actionButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>

                {/* Status Action Buttons */}
                {(booking.status === 'reserved' || booking.status === 'patient_on_way') && (
                    <View style={styles.statusActionsContainer}>
                        <TouchableOpacity style={styles.arrivedButton} onPress={handleMarkArrived}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                            <Text style={styles.arrivedButtonText}>I've Arrived</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Ionicons name="close-circle" size={24} color="#FFF" />
                            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Timeline Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Timeline</Text>
                    <View style={styles.timelineItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Booking Created</Text>
                            <Text style={styles.timelineTime}>
                                {new Date(booking.created_at).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    {booking.arrival_time && (
                        <View style={styles.timelineItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineLabel}>Arrived at Hospital</Text>
                                <Text style={styles.timelineTime}>
                                    {new Date(booking.arrival_time).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                    {booking.admission_time && (
                        <View style={styles.timelineItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineLabel}>Admitted</Text>
                                <Text style={styles.timelineTime}>
                                    {new Date(booking.admission_time).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
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
    content: {
        flex: 1,
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
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    statusCard: {
        margin: 15,
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 10,
        textTransform: 'uppercase',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 15,
    },
    hospitalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailColumn: {
        flexDirection: 'column',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#000',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    detailValueColumn: {
        fontSize: 14,
        color: '#000',
        fontWeight: '600',
        marginTop: 4,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        marginHorizontal: 15,
        marginBottom: 15,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4ECDC4',
        padding: 15,
        borderRadius: 10,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    statusActionsContainer: {
        marginHorizontal: 15,
        marginBottom: 15,
        gap: 10,
    },
    arrivedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4ECDC4',
        padding: 18,
        borderRadius: 10,
        gap: 10,
    },
    arrivedButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        padding: 18,
        borderRadius: 10,
        gap: 10,
    },
    cancelButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    timelineContent: {
        marginLeft: 10,
        flex: 1,
    },
    timelineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    timelineTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
});
