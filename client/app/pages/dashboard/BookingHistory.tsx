import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { emergencyService } from '@/services/emergencyService';
import { EmergencyBooking } from '@/utils/emergency/types';

export default function BookingHistory() {
    const router = useRouter();
    const [bookings, setBookings] = useState<EmergencyBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBookingHistory();
    }, []);

    const loadBookingHistory = async () => {
        try {
            setLoading(true);
            const data = await emergencyService.getBookingHistory();
            // Show only past bookings (discharged status only)
            const pastBookings = Array.isArray(data)
                ? data.filter(booking => booking.status === 'discharged')
                : [];
            setBookings(pastBookings);
        } catch (error) {
            console.error('Error loading booking history:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBookingHistory();
        setRefreshing(false);
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

    const calculateDuration = (admissionTime: string, dischargeDate: string) => {
        if (!admissionTime || !dischargeDate) return 'Ongoing';
        const admission = new Date(admissionTime);
        const discharge = new Date(dischargeDate);
        const diffTime = Math.abs(discharge.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1 ? '1 day' : `${diffDays} days`;
    };

    const handleBookingPress = (booking: EmergencyBooking) => {
        // Could navigate to a detailed view of past booking
        console.log('Viewing booking details:', booking.id);
    };

    const renderBookingCard = ({ item }: { item: EmergencyBooking }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => handleBookingPress(item)}
            activeOpacity={0.7}
        >
            {/* Hospital Header */}
            <View style={styles.bookingCardHeader}>
                <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName} numberOfLines={1}>
                        {item.hospital.name}
                    </Text>
                    <View style={styles.bedTypeBadge}>
                        <Ionicons name="bed" size={12} color="#666" />
                        <Text style={styles.bedTypeText}>
                            {item.bed_type === 'icu' ? 'ICU' : 'General Ward'}
                        </Text>
                    </View>
                </View>
                <View style={styles.costContainer}>
                    <Text style={styles.costLabel}>Total Cost</Text>
                    <Text style={styles.costValue}>
                        ₹{item.total_bill_amount
                            ? parseFloat(item.total_bill_amount).toLocaleString('en-IN')
                            : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Emergency Type */}
            <View style={styles.detailRow}>
                <Ionicons name="medical" size={16} color="#ef4444" />
                <Text style={styles.detailLabel}>Emergency Type:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                    {item.emergency_type_display || item.emergency_type}
                </Text>
            </View>

            {/* Admission Date */}
            <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#3b82f6" />
                <Text style={styles.detailLabel}>Admitted:</Text>
                <Text style={styles.detailValue}>
                    {formatDate(item.admission_time || '')}
                </Text>
            </View>

            {/* Discharge Date */}
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#10b981" />
                <Text style={styles.detailLabel}>Discharged:</Text>
                <Text style={styles.detailValue}>
                    {formatDate(item.discharge_date || '')}
                </Text>
            </View>

            {/* Duration */}
            <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color="#f59e0b" />
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>
                    {calculateDuration(item.admission_time || '', item.discharge_date || '')}
                </Text>
            </View>

            {/* Financial Summary */}
            {item.insurance_approved_amount && item.out_of_pocket_amount && (
                <View style={styles.financialSummary}>
                    <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Insurance Covered</Text>
                            <Text style={[styles.financialValue, { color: '#10b981' }]}>
                                ₹{parseFloat(item.insurance_approved_amount).toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.financialDivider} />
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Out-of-Pocket</Text>
                            <Text style={[styles.financialValue, { color: '#f59e0b' }]}>
                                ₹{parseFloat(item.out_of_pocket_amount).toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No Past Bookings</Text>
            <Text style={styles.emptySubtitle}>
                Your completed booking history will appear here once you have admitted patients
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past Bookings</Text>
            </View>

            {/* Summary Bar */}
            {bookings.length > 0 && (
                <View style={styles.summaryBar}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.summaryText}>
                        {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} completed
                    </Text>
                </View>
            )}

            {/* Booking List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={renderEmptyState}
                />
            )}
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
    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 15,
        paddingVertical: 12,
        gap: 8,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
        flexGrow: 1,
    },
    bookingCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    bookingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    hospitalInfo: {
        flex: 1,
        marginRight: 10,
    },
    hospitalName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    bedTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
    },
    bedTypeText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    costContainer: {
        alignItems: 'flex-end',
    },
    costLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    costValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        minWidth: 80,
    },
    detailValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '600',
        flex: 1,
    },
    financialSummary: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    financialRow: {
        flexDirection: 'row',
        gap: 12,
    },
    financialItem: {
        flex: 1,
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 4,
        textAlign: 'center',
    },
    financialValue: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    financialDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
    },
    payNowButton: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    payNowButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
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
        paddingHorizontal: 40,
    },
});
