import { Stack } from "expo-router";
import { useEffect } from "react";
import { usePermissionStore } from "../store/permissionStore";

export default function RootLayout() {
  const initializePermissions = usePermissionStore((state) => state.initializePermissions);

  useEffect(() => {
    // Initialize permissions when app starts
    initializePermissions();
  }, [initializePermissions]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
