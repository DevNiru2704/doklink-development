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

interface DailyExpenseSummary {
    date: string;
    total_amount: number;
    total_insurance_covered: number;
    total_patient_share: number;
    expense_count: number;
}

interface EmergencyBooking {
    id: number;
    hospital_name: string;
    bed_type: string;
    admission_time: string;
    discharge_date: string | null;
    status: string;
    total_bill_amount: string | null;
    insurance_approved_amount: string | null;
    out_of_pocket_amount: string | null;
}

interface DashboardData {
    current_admission: EmergencyBooking | null;
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

    const fetchDashboardData = async () => {
        try {
            // Get user name
            const user = await authService.getStoredUser();
            if (user) {
                setUserName(user.first_name || user.username);
            }

            // Get current admission (most recent discharged booking)
            const bookingsResponse = await apiClient.get('/healthcare/emergency/bookings/');
            const bookingsData: any = bookingsResponse.data;
            const bookings = bookingsData.results || bookingsData;

            // Find the most recent discharged booking
            const currentAdmission = bookings
                .filter((b: EmergencyBooking) => b.status === 'discharged')
                .sort((a: EmergencyBooking, b: EmergencyBooking) =>
                    new Date(b.admission_time).getTime() - new Date(a.admission_time).getTime()
                )[0] || null;

            let dailyExpenses: DailyExpenseSummary[] = [];

            if (currentAdmission) {
                // Get daily expense summary for this admission
                const expensesResponse = await apiClient.get(
                    `/healthcare/expenses/daily_summary/?admission_id=${currentAdmission.id}`
                );
                const expensesData: any = expensesResponse.data;
                dailyExpenses = expensesData || [];
            }

            setDashboardData({
                current_admission: currentAdmission,
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

    const getDayLabel = (dateString: string, admissionDate: string) => {
        const date = new Date(dateString);
        const admission = new Date(admissionDate);
        const diffDays = Math.floor((date.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `Day ${diffDays}`;
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

            {dashboardData?.current_admission ? (
                <>
                    {/* Patient Journey Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="medical" size={24} color="#10b981" />
                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                Patient Journey
                            </Text>
                        </View>

                        {/* Admission Summary Card */}
                        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                            <View style={styles.summaryHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.hospitalName, { color: isDark ? '#ffffff' : '#111827' }]}>
                                        {dashboardData.current_admission.hospital_name}
                                    </Text>
                                    <Text style={[styles.bedType, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {dashboardData.current_admission.bed_type === 'icu' ? 'ICU' : 'General Ward'}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                                    <Text style={[styles.statusText, { color: '#10b981' }]}>
                                        Completed
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.dateRange}>
                                <View style={styles.dateItem}>
                                    <Ionicons name="enter-outline" size={16} color="#3b82f6" />
                                    <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        Admitted
                                    </Text>
                                    <Text style={[styles.dateValue, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                        {formatDate(dashboardData.current_admission.admission_time)}
                                    </Text>
                                </View>
                                <View style={styles.dateDivider} />
                                <View style={styles.dateItem}>
                                    <Ionicons name="exit-outline" size={16} color="#10b981" />
                                    <Text style={[styles.dateLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        Discharged
                                    </Text>
                                    <Text style={[styles.dateValue, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                        {dashboardData.current_admission.discharge_date
                                            ? formatDate(dashboardData.current_admission.discharge_date)
                                            : 'Ongoing'}
                                    </Text>
                                </View>
                            </View>

                            {/* Financial Summary */}
                            {dashboardData.current_admission.total_bill_amount && (
                                <View style={[styles.financialSummary, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                    <View style={styles.financialRow}>
                                        <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Total Bill
                                        </Text>
                                        <Text style={[styles.financialValue, { color: isDark ? '#ffffff' : '#111827' }]}>
                                            ₹{parseFloat(dashboardData.current_admission.total_bill_amount).toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.financialRow}>
                                        <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Insurance Covered
                                        </Text>
                                        <Text style={[styles.financialValue, { color: '#10b981' }]}>
                                            ₹{parseFloat(dashboardData.current_admission.insurance_approved_amount || '0').toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.financialRow}>
                                        <Text style={[styles.financialLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                            Out-of-Pocket
                                        </Text>
                                        <Text style={[styles.financialValue, { color: '#f59e0b' }]}>
                                            ₹{parseFloat(dashboardData.current_admission.out_of_pocket_amount || '0').toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Daily Expense Timeline */}
                        <Text style={[styles.timelineTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Daily Expense Breakdown
                        </Text>

                        <View style={styles.timeline}>
                            {dashboardData.daily_expenses && dashboardData.daily_expenses.length > 0 ? dashboardData.daily_expenses.map((expense, index) => (
                                <View key={expense.date} style={styles.timelineItem}>
                                    {/* Timeline connector */}
                                    <View style={styles.timelineConnector}>
                                        <View style={[styles.timelineDot, { backgroundColor: '#3b82f6' }]} />
                                        {index < dashboardData.daily_expenses.length - 1 && (
                                            <View style={[styles.timelineLine, { backgroundColor: isDark ? '#374151' : '#d1d5db' }]} />
                                        )}
                                    </View>

                                    {/* Expense card */}
                                    <View style={[styles.expenseCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                                        <View style={styles.expenseHeader}>
                                            <View>
                                                <Text style={[styles.dayLabel, { color: '#3b82f6' }]}>
                                                    {getDayLabel(expense.date, dashboardData.current_admission!.admission_time)}
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
                                                    Insurance: ₹{expense.total_insurance_covered.toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                            <View style={styles.breakdownItem}>
                                                <View style={[styles.breakdownDot, { backgroundColor: '#f59e0b' }]} />
                                                <Text style={[styles.breakdownText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    Your share: ₹{expense.total_patient_share.toLocaleString('en-IN')}
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

                        {/* View Full History Button */}
                        <TouchableOpacity
                            style={styles.viewHistoryButton}
                            onPress={() => router.push('/pages/dashboard/PaymentHistory')}
                        >
                            <Text style={styles.viewHistoryText}>View Booking History</Text>
                            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={isDark ? '#4b5563' : '#d1d5db'} />
                    <Text style={[styles.emptyTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        No Recent Admissions
                    </Text>
                    <Text style={[styles.emptyText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                        Your patient journey will appear here once you have an admission
                    </Text>
                </View>
            )}
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
});
