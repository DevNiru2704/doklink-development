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
import { EmergencyBooking, BOOKING_STATUS_DISPLAY } from '@/utils/emergency/types';

type FilterStatus = 'all' | 'reserved' | 'patient_on_way' | 'arrived' | 'admitted' | 'cancelled';

export default function BookingHistory() {
    const router = useRouter();
    const [bookings, setBookings] = useState<EmergencyBooking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<EmergencyBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

    useEffect(() => {
        loadBookingHistory();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [selectedFilter, bookings]);

    const loadBookingHistory = async () => {
        try {
            setLoading(true);
            const data = await emergencyService.getBookingHistory();
            // Ensure data is always an array
            setBookings(Array.isArray(data) ? data : []);
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

    const applyFilter = () => {
        if (!Array.isArray(bookings)) {
            setFilteredBookings([]);
            return;
        }

        if (selectedFilter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter((booking) => booking.status === selectedFilter));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reserved':
                return '#FFA500';
            case 'patient_on_way':
                return '#10B981';
            case 'arrived':
                return '#3B82F6';
            case 'admitted':
                return '#8B5CF6';
            case 'cancelled':
                return '#EF4444';
            case 'expired':
                return '#6B7280';
            default:
                return '#666';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'reserved':
                return 'time';
            case 'patient_on_way':
                return 'checkmark-circle';
            case 'arrived':
                return 'location';
            case 'admitted':
                return 'medical';
            case 'cancelled':
                return 'close-circle';
            case 'expired':
                return 'alert-circle';
            default:
                return 'help-circle';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    };

    const handleBookingPress = (booking: EmergencyBooking) => {
        // Navigate to booking details - could be ActiveBooking if still active, or a separate detail screen
        if (booking.status !== 'admitted' && booking.status !== 'cancelled') {
            router.push({
                pathname: '/pages/emergency/ActiveBooking',
                params: { bookingId: booking.id.toString() },
            });
        }
    };

    const renderFilterButton = (label: string, value: FilterStatus) => {
        const isSelected = selectedFilter === value;
        return (
            <TouchableOpacity
                style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                onPress={() => setSelectedFilter(value)}
            >
                <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderBookingCard = ({ item }: { item: EmergencyBooking }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => handleBookingPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.bookingCardHeader}>
                <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName} numberOfLines={1}>
                        {item.hospital.name}
                    </Text>
                    <Text style={styles.bookingDate}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Ionicons name={getStatusIcon(item.status) as any} size={16} color="#FFF" />
                    <Text style={styles.statusBadgeText}>
                        {item.status_display || BOOKING_STATUS_DISPLAY[item.status]}
                    </Text>
                </View>
            </View>

            <View style={styles.bookingCardBody}>
                <View style={styles.detailItem}>
                    <Ionicons name="medical" size={16} color="#666" />
                    <Text style={styles.detailText} numberOfLines={2} ellipsizeMode="tail">
                        {item.emergency_type_display || item.emergency_type}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="bed" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {item.bed_type_display || item.bed_type || 'General'}
                    </Text>
                </View>
            </View>

            {item.status !== 'admitted' && item.status !== 'cancelled' && (
                <View style={styles.activeIndicator}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                    ? 'Your emergency booking history will appear here'
                    : `No ${selectedFilter} bookings found`}
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
                <Text style={styles.headerTitle}>Booking History</Text>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { label: 'All', value: 'all' as FilterStatus },
                        { label: 'Reserved', value: 'reserved' as FilterStatus },
                        { label: 'On the Way', value: 'patient_on_way' as FilterStatus },
                        { label: 'Arrived', value: 'arrived' as FilterStatus },
                        { label: 'Admitted', value: 'admitted' as FilterStatus },
                        { label: 'Cancelled', value: 'cancelled' as FilterStatus },
                    ]}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => renderFilterButton(item.label, item.value)}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Booking List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
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
    filterBar: {
        backgroundColor: '#FFF',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterList: {
        paddingHorizontal: 15,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#FFF',
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
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    bookingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    hospitalInfo: {
        flex: 1,
        marginRight: 10,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    bookingDate: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    bookingCardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        flex: 1,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ECDC4',
        marginRight: 6,
    },
    activeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4ECDC4',
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
