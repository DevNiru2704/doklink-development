// store/notificationStore.ts
// Zustand store for managing notification state across the app.

import { create } from 'zustand';
import {
    AppNotification,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
} from '../services/notificationService';

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;

    // Actions
    loadNotifications: (unreadOnly?: boolean) => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
    markRead: (notificationId: number) => Promise<void>;
    markAllRead: () => Promise<void>;
    setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    loadNotifications: async (unreadOnly = false) => {
        set({ loading: true });
        try {
            const result = await fetchNotifications(unreadOnly);
            set({
                notifications: result.notifications,
                unreadCount: result.unreadCount,
                loading: false,
            });
        } catch {
            set({ loading: false });
        }
    },

    refreshUnreadCount: async () => {
        try {
            const count = await getUnreadCount();
            set({ unreadCount: count });
        } catch {
            // Silently fail — badge count isn't critical
        }
    },

    markRead: async (notificationId: number) => {
        await markNotificationRead(notificationId);
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllRead: async () => {
        await markAllNotificationsRead();
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
