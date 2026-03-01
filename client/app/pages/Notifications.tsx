// app/pages/Notifications.tsx
// Full-screen notifications list accessible from Dashboard/tabs.

import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    useColorScheme,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notificationStore';
import { AppNotification } from '../../services/notificationService';

const NOTIFICATION_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    admission: { name: 'bed-outline', color: '#4CAF50' },
    discharge: { name: 'exit-outline', color: '#2196F3' },
    bed_assigned: { name: 'bed-outline', color: '#9C27B0' },
    bed_released: { name: 'log-out-outline', color: '#FF9800' },
    claim_update: { name: 'document-text-outline', color: '#F44336' },
    document_added: { name: 'folder-open-outline', color: '#00BCD4' },
    appointment: { name: 'calendar-outline', color: '#3F51B5' },
    general: { name: 'notifications-outline', color: '#607D8B' },
};

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotificationItem({
    notification,
    onPress,
    isDark,
}: {
    notification: AppNotification;
    onPress: () => void;
    isDark: boolean;
}) {
    const iconConfig = NOTIFICATION_ICONS[notification.notificationType] || NOTIFICATION_ICONS.general;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.notificationItem,
                {
                    backgroundColor: notification.read
                        ? (isDark ? '#1a1a1a' : '#ffffff')
                        : (isDark ? '#1a2332' : '#e8f4fd'),
                    borderLeftColor: notification.read ? 'transparent' : iconConfig.color,
                },
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
                <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text
                        style={[
                            styles.title,
                            { color: isDark ? '#ffffff' : '#111827', fontWeight: notification.read ? '500' : '700' },
                        ]}
                        numberOfLines={1}
                    >
                        {notification.title}
                    </Text>
                    {!notification.read && <View style={[styles.unreadDot, { backgroundColor: iconConfig.color }]} />}
                </View>

                <Text
                    style={[styles.body, { color: isDark ? '#9ca3af' : '#6b7280' }]}
                    numberOfLines={2}
                >
                    {notification.body}
                </Text>

                <View style={styles.metaRow}>
                    {notification.hospitalName ? (
                        <Text style={[styles.hospitalName, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                            🏥 {notification.hospitalName}
                        </Text>
                    ) : null}
                    <Text style={[styles.time, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                        {formatTimeAgo(notification.createdAt)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function NotificationsPage() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const { notifications, unreadCount, loading, loadNotifications, markRead, markAllRead } =
        useNotificationStore();

    useEffect(() => {
        loadNotifications();
    }, []);

    const onRefresh = useCallback(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleNotificationPress = (notification: AppNotification) => {
        if (!notification.read) {
            markRead(notification.id);
        }
        // Navigate based on notification type
        const screen = notification.data?.screen;
        if (screen === 'Dashboard') {
            router.push('/(tabs)/Dashboard');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f3f4f6' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#111827' : '#ffffff', borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Notifications
                </Text>

                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Notification List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={() => handleNotificationPress(item)}
                        isDark={isDark}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={isDark ? '#ffffff' : '#4F8CFF'} />
                }
                contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="notifications-off-outline"
                            size={64}
                            color={isDark ? '#374151' : '#d1d5db'}
                        />
                        <Text style={[styles.emptyTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            No notifications yet
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                            You'll receive notifications when your hospital takes actions like admissions, discharges, or claim updates.
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => (
                    <View style={[styles.separator, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]} />
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#4F8CFF20',
    },
    markAllText: {
        fontSize: 13,
        color: '#4F8CFF',
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderLeftWidth: 3,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    body: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hospitalName: {
        fontSize: 12,
        flex: 1,
    },
    time: {
        fontSize: 11,
    },
    separator: {
        height: 1,
        marginHorizontal: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
