import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { usePermissionStore } from "../store/permissionStore";
import { useNotificationStore } from "../store/notificationStore";
import {
  configureNotificationHandler,
  registerForPushNotifications,
  registerTokenWithBackend,
  setupNotificationListeners,
} from "../services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const initializePermissions = usePermissionStore((state) => state.initializePermissions);
  const { refreshUnreadCount, setUnreadCount } = useNotificationStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initialize permissions when app starts
    initializePermissions();
  }, [initializePermissions]);

  useEffect(() => {
    // Configure foreground handler (no-ops safely if native missing)
    configureNotificationHandler();

    // Set up push notifications
    async function initPushNotifications() {
      try {
        // Check if user is authenticated before registering
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return;

        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await registerTokenWithBackend(pushToken);
        }

        // Load initial unread count
        await refreshUnreadCount();
      } catch (error) {
        console.log('Push notification init (non-critical):', error);
      }
    }

    initPushNotifications();

    // Set up notification listeners
    cleanupRef.current = setupNotificationListeners(
      // On notification received in foreground
      (notification) => {
        refreshUnreadCount();
      },
      // On notification tapped
      (response) => {
        refreshUnreadCount();
      }
    );

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
