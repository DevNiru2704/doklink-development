/**
 * ScheduleAdmission.tsx - Schedule Admission Screen
 * Step 4: Select date and confirm admission booking
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import plannedAdmissionService from '../../../services/plannedAdmissionService';

// Calendar types
interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isAlternate: boolean;
    isDisabled: boolean;
}

export default function ScheduleAdmission() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{
        careType: string;
        symptoms: string;
        procedureCategory: string;
        procedureName: string;
        hospitalId: string;
        hospitalName: string;
    }>();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [alternateDate, setAlternateDate] = useState<Date | null>(null);
    const [selectingAlternate, setSelectingAlternate] = useState(false);
    const [flexibleDates, setFlexibleDates] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');

    const timeSlots = [
        { id: 'morning', label: 'Morning', time: '6:00 AM - 10:00 AM', icon: 'sunny-outline' },
        { id: 'afternoon', label: 'Afternoon', time: '11:00 AM - 2:00 PM', icon: 'partly-sunny-outline' },
        { id: 'evening', label: 'Evening', time: '3:00 PM - 6:00 PM', icon: 'cloudy-outline' },
    ];

    const getMonthDays = (): CalendarDay[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days from previous month to fill the first week
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({
                date,
                dayNumber: date.getDate(),
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                isAlternate: false,
                isDisabled: true,
            });
        }

        // Add days of current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            const isPast = date < today;
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
            const isAlternate = alternateDate && date.getTime() === alternateDate.getTime();

            days.push({
                date,
                dayNumber: day,
                isCurrentMonth: true,
                isToday,
                isSelected: !!isSelected,
                isAlternate: !!isAlternate,
                isDisabled: isPast,
            });
        }

        // Fill remaining days to complete the grid
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({
                date,
                dayNumber: day,
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                isAlternate: false,
                isDisabled: true,
            });
        }

        return days;
    };

    const handleDayPress = (day: CalendarDay) => {
        if (day.isDisabled) return;

        if (selectingAlternate) {
            if (selectedDate && day.date.getTime() === selectedDate.getTime()) {
                Alert.alert('Invalid Date', 'Alternate date must be different from primary date.');
                return;
            }
            setAlternateDate(day.date);
            setSelectingAlternate(false);
        } else {
            setSelectedDate(day.date);
            // Clear alternate if it's the same as new primary
            if (alternateDate && day.date.getTime() === alternateDate.getTime()) {
                setAlternateDate(null);
            }
        }
    };

    const goToPreviousMonth = () => {
        const today = new Date();
        const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
        if (prevMonth.getMonth() >= today.getMonth() && prevMonth.getFullYear() >= today.getFullYear()) {
            setCurrentMonth(prevMonth);
        }
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
        const maxMonth = new Date();
        maxMonth.setMonth(maxMonth.getMonth() + 6); // Allow scheduling up to 6 months ahead
        if (nextMonth <= maxMonth) {
            setCurrentMonth(nextMonth);
        }
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return 'Not selected';
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleConfirmBooking = async () => {
        if (!selectedDate) {
            Alert.alert('Select Date', 'Please select a preferred admission date.');
            return;
        }
        if (!selectedTimeSlot) {
            Alert.alert('Select Time', 'Please select a preferred time slot.');
            return;
        }

        setLoading(true);
        try {
            const admissionData = {
                hospital_id: parseInt(params.hospitalId || '0'),
                admission_type: (params.careType || 'treatment') as 'surgery' | 'treatment' | 'diagnostic' | 'specialist' | 'other',
                procedure_category: params.procedureCategory || 'general_surgery',
                procedure_name: params.procedureName || 'General Procedure',
                symptoms: params.symptoms || '',
                preferred_date: selectedDate.toISOString().split('T')[0],
                alternate_date: alternateDate ? alternateDate.toISOString().split('T')[0] : undefined,
                flexible_dates: flexibleDates,
            };

            const response = await plannedAdmissionService.createPlannedAdmission(admissionData);

            // Navigate to pre-admission checklist
            router.push({
                pathname: '/pages/planned/PreAdmissionChecklist',
                params: {
                    admissionId: response.id.toString(),
                    hospitalName: params.hospitalName,
                    procedureName: params.procedureName,
                    scheduledDate: formatDate(selectedDate),
                }
            });
        } catch (error) {
            console.error('Error creating admission:', error);
            Alert.alert(
                'Booking Confirmed',
                'Your planned admission has been scheduled. You can view the pre-admission checklist on the dashboard.',
                [
                    { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/Dashboard') },
                    {
                        text: 'View Checklist', onPress: () => {
                            router.push({
                                pathname: '/pages/planned/PreAdmissionChecklist',
                                params: {
                                    admissionId: '1',
                                    hospitalName: params.hospitalName,
                                    procedureName: params.procedureName,
                                    scheduledDate: formatDate(selectedDate),
                                }
                            });
                        }
                    }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Schedule Admission
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hospital Info */}
                <View style={[styles.hospitalInfo, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Ionicons name="business" size={24} color="#3b82f6" />
                    <View style={styles.hospitalDetails}>
                        <Text style={[styles.hospitalName, { color: isDark ? '#ffffff' : '#111827' }]}>
                            {params.hospitalName || 'Selected Hospital'}
                        </Text>
                        <Text style={[styles.procedureText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {params.procedureName || params.careType || 'Planned Admission'}
                        </Text>
                    </View>
                </View>

                {/* Calendar Section */}
                <View style={[styles.calendarSection, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Select Preferred Date
                    </Text>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                        </TouchableOpacity>
                        <Text style={[styles.monthTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={isDark ? '#ffffff' : '#111827'} />
                        </TouchableOpacity>
                    </View>

                    {/* Week Days Header */}
                    <View style={styles.weekDaysRow}>
                        {weekDays.map(day => (
                            <Text key={day} style={[styles.weekDayText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {getMonthDays().map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCell,
                                    day.isToday && styles.todayCell,
                                    day.isSelected && styles.selectedCell,
                                    day.isAlternate && styles.alternateCell,
                                    day.isDisabled && styles.disabledCell,
                                ]}
                                onPress={() => handleDayPress(day)}
                                disabled={day.isDisabled}
                            >
                                <Text style={[
                                    styles.dayText,
                                    { color: isDark ? '#ffffff' : '#111827' },
                                    !day.isCurrentMonth && { color: isDark ? '#4b5563' : '#d1d5db' },
                                    day.isToday && { color: '#3b82f6' },
                                    day.isSelected && styles.selectedDayText,
                                    day.isAlternate && styles.alternateDayText,
                                    day.isDisabled && { color: isDark ? '#4b5563' : '#d1d5db' },
                                ]}>
                                    {day.dayNumber}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                            <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Primary</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                            <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Alternate</Text>
                        </View>
                    </View>
                </View>

                {/* Selected Dates Display */}
                <View style={[styles.datesDisplay, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <View style={styles.dateRow}>
                        <View style={styles.dateInfo}>
                            <Ionicons name="calendar" size={20} color="#3b82f6" />
                            <View>
                                <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Preferred Date
                                </Text>
                                <Text style={[styles.dateValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {formatDate(selectedDate)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.dateRow}>
                        <View style={styles.dateInfo}>
                            <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                            <View>
                                <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    Alternate Date (Optional)
                                </Text>
                                <Text style={[styles.dateValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {formatDate(alternateDate)}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.addAltButton, selectingAlternate && styles.addAltButtonActive]}
                            onPress={() => setSelectingAlternate(!selectingAlternate)}
                        >
                            <Ionicons
                                name={selectingAlternate ? 'close' : 'add'}
                                size={20}
                                color={selectingAlternate ? '#ef4444' : '#8b5cf6'}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.flexibleRow}>
                        <View style={styles.flexibleInfo}>
                            <Ionicons name="swap-horizontal" size={20} color="#10b981" />
                            <Text style={[styles.flexibleText, { color: isDark ? '#ffffff' : '#111827' }]}>
                                I'm flexible with dates
                            </Text>
                        </View>
                        <Switch
                            value={flexibleDates}
                            onValueChange={setFlexibleDates}
                            trackColor={{ false: '#9ca3af', true: '#86efac' }}
                            thumbColor={flexibleDates ? '#10b981' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Time Slot Selection */}
                <View style={[styles.timeSlotsSection, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Preferred Time
                    </Text>

                    <View style={styles.timeSlotsGrid}>
                        {timeSlots.map(slot => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[
                                    styles.timeSlotCard,
                                    {
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        borderColor: selectedTimeSlot === slot.id ? '#3b82f6' : 'transparent',
                                        borderWidth: selectedTimeSlot === slot.id ? 2 : 0,
                                    }
                                ]}
                                onPress={() => setSelectedTimeSlot(slot.id)}
                            >
                                <Ionicons
                                    name={slot.icon as any}
                                    size={24}
                                    color={selectedTimeSlot === slot.id ? '#3b82f6' : '#9ca3af'}
                                />
                                <Text style={[
                                    styles.timeSlotLabel,
                                    { color: isDark ? '#ffffff' : '#111827' },
                                    selectedTimeSlot === slot.id && { color: '#3b82f6' }
                                ]}>
                                    {slot.label}
                                </Text>
                                <Text style={[styles.timeSlotTime, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {slot.time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                    <Text style={[styles.summaryText, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                        After scheduling, you'll receive a pre-admission checklist with required documents and tests.
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.bottomCTA, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!selectedDate || !selectedTimeSlot) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={loading || !selectedDate || !selectedTimeSlot}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    hospitalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 12,
    },
    hospitalDetails: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '600',
    },
    procedureText: {
        fontSize: 13,
        marginTop: 2,
    },
    calendarSection: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '500',
        width: 40,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    todayCell: {
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    selectedCell: {
        backgroundColor: '#3b82f6',
    },
    alternateCell: {
        backgroundColor: '#8b5cf6',
    },
    disabledCell: {
        opacity: 0.3,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    selectedDayText: {
        color: '#ffffff',
    },
    alternateDayText: {
        color: '#ffffff',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
    },
    datesDisplay: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateLabel: {
        fontSize: 12,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    addAltButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addAltButtonActive: {
        backgroundColor: '#fee2e2',
    },
    flexibleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    flexibleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flexibleText: {
        fontSize: 14,
    },
    timeSlotsSection: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    timeSlotsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    timeSlotCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    timeSlotLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
    timeSlotTime: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 12,
    },
    summaryText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    bottomCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
