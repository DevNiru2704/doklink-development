// services/notificationService.ts
// Handles Expo push notifications: registration, listening, and API communication.
//
// IMPORTANT: expo-notifications native module (ExpoPushTokenManager) is NOT
// available in Expo Go — it requires a custom dev build.  All references to
// the native API are lazily imported inside try/catch blocks so the app still
// runs (without push) when the module is missing.

import { Platform, NativeModules } from 'react-native';
import apiClient, { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Types
// ============================================================

export interface AppNotification {
    id: number;
    notificationType: string;
    title: string;
    body: string;
    data: Record<string, any>;
    status: string;
    read: boolean;
    hospitalName: string;
    createdAt: string;
}

export interface NotificationListResponse {
    notifications: AppNotification[];
    unreadCount: number;
}

// ============================================================
// Lazy helpers – load native modules only when actually needed
// ============================================================

let _Notifications: typeof import('expo-notifications') | null = null;
let _Device: typeof import('expo-device') | null = null;
let _nativeAvailable: boolean | null = null;

/**
 * Returns true when the expo-notifications native module is present
 * (i.e. running in a custom dev build, not Expo Go).
 *
 * We check NativeModules BEFORE calling require() because the JS
 * bundles for expo-notifications / expo-device immediately access
 * the native bridge on load and throw if it's missing.
 */
function isNativeAvailable(): boolean {
    if (_nativeAvailable !== null) return _nativeAvailable;

    // Check if the native modules are registered in the bridge
    const hasPushManager = !!NativeModules.ExpoPushTokenManager;
    const hasDevice = !!NativeModules.ExpoDevice;

    if (!hasPushManager || !hasDevice) {
        console.log(
            '[notifications] Native modules not available (Expo Go?) – push disabled.',
            `ExpoPushTokenManager=${!!hasPushManager}, ExpoDevice=${!!hasDevice}`
        );
        _nativeAvailable = false;
        return false;
    }

    try {
        _Notifications = require('expo-notifications');
        _Device = require('expo-device');
        _nativeAvailable = true;
    } catch {
        console.log('[notifications] Failed to load notification modules – push disabled');
        _nativeAvailable = false;
    }
    return _nativeAvailable;
}

/**
 * Configure the foreground notification handler.
 * Safe to call at any time — no-ops when native is missing.
 */
export function configureNotificationHandler(): void {
    if (!isNativeAvailable() || !_Notifications) return;
    _Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

// ============================================================
// Push Token Registration
// ============================================================

/**
 * Register for push notifications and get the Expo push token.
 * Returns null when running in Expo Go or on a simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    if (!isNativeAvailable() || !_Notifications || !_Device) return null;

    // Push notifications require a physical device
    if (!_Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check / request permissions
    const { status: existingStatus } = await _Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await _Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
    }

    // Android: create notification channels
    if (Platform.OS === 'android') {
        await _Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: _Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F8CFF',
            sound: 'default',
        });

        await _Notifications.setNotificationChannelAsync('hospital', {
            name: 'Hospital Updates',
            description: 'Notifications from hospitals (admissions, discharges, claims)',
            importance: _Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#FF4444',
            sound: 'default',
        });
    }

    // Get Expo push token
    try {
        const Constants = require('expo-constants').default;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await _Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });
        const token = tokenData.data;
        console.log('Expo push token:', token);
        return token;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

/**
 * Register the push token with our Django backend.
 */
export async function registerTokenWithBackend(token: string): Promise<boolean> {
    try {
        const deviceName = _Device?.modelName || 'Unknown';
        await apiClient.post(API_ENDPOINTS.REGISTER_PUSH_TOKEN, {
            token,
            device_name: `${deviceName} (${Platform.OS})`,
        });
        await AsyncStorage.setItem('expoPushToken', token);
        console.log('Push token registered with backend');
        return true;
    } catch (error) {
        console.error('Failed to register push token with backend:', error);
        return false;
    }
}

/**
 * Unregister the push token from our Django backend (on logout).
 */
export async function unregisterTokenFromBackend(): Promise<void> {
    try {
        const token = await AsyncStorage.getItem('expoPushToken');
        if (token) {
            await apiClient.post(API_ENDPOINTS.UNREGISTER_PUSH_TOKEN, { token });
            await AsyncStorage.removeItem('expoPushToken');
            console.log('Push token unregistered from backend');
        }
    } catch (error) {
        console.error('Failed to unregister push token:', error);
    }
}

// ============================================================
// Notification API calls (pure HTTP — always work)
// ============================================================

export async function fetchNotifications(unreadOnly = false): Promise<NotificationListResponse> {
    try {
        const params = unreadOnly ? '?unread_only=true' : '';
        const response = await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS_LIST}${params}`);
        return response.data as NotificationListResponse;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { notifications: [], unreadCount: 0 };
    }
}

export async function markNotificationRead(notificationId: number): Promise<void> {
    try {
        await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_MARK_READ, { notificationId });
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

export async function markAllNotificationsRead(): Promise<void> {
    try {
        await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_MARK_READ, { markAll: true });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
    }
}

export async function getUnreadCount(): Promise<number> {
    try {
        const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
        return (response.data as { unreadCount: number }).unreadCount;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

// ============================================================
// Notification Listeners (no-ops when native is missing)
// ============================================================

export function setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void,
): () => void {
    if (!isNativeAvailable() || !_Notifications) {
        // Return a no-op cleanup
        return () => { };
    }

    const receivedSubscription = _Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('Notification received in foreground:', notification);
            onNotificationReceived?.(notification);
        }
    );

    const responseSubscription = _Notifications.addNotificationResponseReceivedListener(
        (response) => {
            console.log('Notification tapped:', response);
            onNotificationTapped?.(response);
        }
    );

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}
