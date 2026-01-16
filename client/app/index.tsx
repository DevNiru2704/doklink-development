//index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useCallback } from "react";
import { StatusBar, Text, View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { Redirect } from "expo-router";

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import useThemedStyles from "../styles/index";

import StartingScreen from "./pages/StartingScreen";
import AppPermission from "./pages/AppPermission";

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPermissions, setNeedsPermissions] = useState(true);
  const [permissionCheckComplete, setPermissionCheckComplete] = useState(false);

  // TEMPORARY: Clear all permissions for testing
  // const clearAllPermissions = async () => {
  //   await AsyncStorage.removeItem("permission_location");
  //   await AsyncStorage.removeItem("permission_files");
  //   await AsyncStorage.removeItem("selected_directory_uri");
  //   console.log("All permissions cleared for testing");
  // };

  const checkPermissions = useCallback(async () => {
    try {
      console.log("Starting permission check...");

      // Check location permission - SYSTEM PERMISSION
      const locationSystem = await Location.getForegroundPermissionsAsync();
      const locationGranted = locationSystem.status === "granted";

      // Check media library permission - SYSTEM PERMISSION
      const mediaSystem = await MediaLibrary.getPermissionsAsync();
      const mediaGranted = mediaSystem.status === "granted";

      // Check image picker permission - SYSTEM PERMISSION
      const imageSystem = await ImagePicker.getMediaLibraryPermissionsAsync();
      const imageGranted = imageSystem.status === "granted";

      // File permission is granted if BOTH media and image permissions are granted
      const fileGranted = mediaGranted && imageGranted;

      // Check if permissions have been handled (either granted or denied)
      const locationHandled = await AsyncStorage.getItem("permission_location");
      const fileHandled = await AsyncStorage.getItem("permission_files");

      // Permissions are considered "complete" if they're either granted OR have been handled
      const locationComplete = locationGranted || locationHandled === "denied";
      const fileComplete = fileGranted || fileHandled === "denied";

      // We only need to show permission screen if permissions are not complete
      const allComplete = locationComplete && fileComplete;

      console.log("Permission check results:", {
        locationSystem: locationSystem.status,
        locationGranted,
        locationHandled,
        locationComplete,
        mediaSystem: mediaSystem.status,
        mediaGranted,
        imageSystem: imageSystem.status,
        imageGranted,
        fileGranted,
        fileHandled,
        fileComplete,
        allComplete,
        needsPermissions: !allComplete,
      });

      setNeedsPermissions(!allComplete);
      setPermissionCheckComplete(true);

      return allComplete;
    } catch (error) {
      console.error("Permission check error:", error);
      setNeedsPermissions(true); // Default to showing permissions if error
      setPermissionCheckComplete(true);
      return false;
    }
  }, []);

  const checkAuthenticationState = useCallback(async () => {
    try {
      // Import the authService dynamically to avoid circular deps
      const { authService } = await import("../services/authService");
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      // If authenticated, also check permissions
      if (authenticated) {
        await checkPermissions();
      } else {
        // If not authenticated, we don't need to check permissions
        // but we should mark permission check as complete
        setPermissionCheckComplete(true);
        setNeedsPermissions(false); // Don't show permission screen for unauthenticated users
      }
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
      setPermissionCheckComplete(true);
      setNeedsPermissions(false); // Don't show permission screen on error
    }
  }, [checkPermissions]);

  // Helper to sync UI state with token state
  const updateAuthState = async () => {
    const { authService } = await import("../services/authService");
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    // If authenticated, check permissions
    if (authenticated) {
      await checkPermissions();
    } else {
      // If not authenticated, reset permission states
      setPermissionCheckComplete(true);
      setNeedsPermissions(false);
    }
  };

  const handleLogin = updateAuthState;

  const handleLogout = async () => {
    const { authService } = await import("../services/authService");
    await authService.logout();
    // Clear permission states on logout
    await AsyncStorage.removeItem("permission_location");
    await AsyncStorage.removeItem("permission_files");
    await AsyncStorage.removeItem("selected_directory_uri");

    // Reset states immediately for logout
    setIsAuthenticated(false);
    setNeedsPermissions(false); // Don't show permissions for unauthenticated users
    setPermissionCheckComplete(true); // Mark as complete so we don't show loading
  };

  const handleSignUp = updateAuthState;

  const handleAllPermissionsGranted = useCallback(() => {
    console.log("All permissions handled, updating UI state...");
    setNeedsPermissions(false);
  }, []);

  useEffect(() => {
    checkAuthenticationState();

    const timer = setTimeout(() => {
      setTimeout(() => {
        setShowWelcome(false);
      }, 100);
    }, 2500); // Slightly longer for better readability

    return () => clearTimeout(timer);
  }, [checkAuthenticationState]);

  // Show welcome screen
  if (showWelcome) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#1a2332" : "#ffffff"}
        />
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#020a0e", "#0a1520", "#020a0e"]
              : ["#f8fafc", "#ffffff", "#f1f5f9"]
          }
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Logo Container */}
            <View style={styles.logoContainer}>
              {colorScheme === "dark" ? (
                <LogoSVGDark width={260} height={260} />
              ) : (
                <LogoSVGLight width={260} height={260} />
              )}
            </View>
            {/* Welcome Text */}
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>WELCOME TO</Text>
              <Text style={styles.brandName}>DOKLINK</Text>
              <Text style={styles.tagline}>One Link to Total Health!</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Only wait for permission check to complete if user is authenticated
  // For unauthenticated users, we should show StartingScreen immediately
  if (isAuthenticated && !permissionCheckComplete) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#1a2332" : "#ffffff"}
        />
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#020a0e", "#0a1520", "#020a0e"]
              : ["#f8fafc", "#ffffff", "#f1f5f9"]
          }
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* You can add a loading spinner here if needed */}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // If user is authenticated but needs permissions, show permission screen
  if (isAuthenticated && needsPermissions) {
    return (
      <AppPermission
        onAllPermissionsGranted={handleAllPermissionsGranted}
      />
    );
  }

  // If user is authenticated and doesn't need permissions, redirect to Home (Emergency)
  if (isAuthenticated && !needsPermissions) {
    return <Redirect href="/(tabs)/Home" />;
  }

  // If not authenticated, show StartingScreen
  return <StartingScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
}