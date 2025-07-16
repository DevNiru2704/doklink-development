//index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useCallback } from "react";
import { StatusBar, Text, View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import useThemedStyles from "../styles/index";

import Home from "./(tabs)/Home";
import StartingScreen from "./pages/StartingScreen";
import AppPermission from "./pages/AppPermission";

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPermissions, setNeedsPermissions] = useState(true);

  // TEMPORARY: Clear all permissions for testing
  const clearAllPermissions = async () => {
    await AsyncStorage.removeItem("permission_location");
    await AsyncStorage.removeItem("permission_files");
    await AsyncStorage.removeItem("selected_directory_uri");
    console.log("All permissions cleared for testing");
  };

  const checkPermissions = useCallback(async () => {
    try {
      // Check ACTUAL system permissions, not just stored state

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

      // BOTH location and file permissions must be granted at SYSTEM level
      const allGranted = locationGranted && fileGranted;
      setNeedsPermissions(!allGranted);

      console.log("SYSTEM Permission check:", {
        locationSystem: locationSystem.status,
        locationGranted,
        mediaSystem: mediaSystem.status,
        mediaGranted,
        imageSystem: imageSystem.status,
        imageGranted,
        fileGranted,
        allGranted,
        needsPermissions: !allGranted,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      setNeedsPermissions(true); // Default to showing permissions if error
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
      }
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
    }
  }, [checkPermissions]);

  // Helper to sync UI state with token state
  const updateAuthState = async () => {
    const { authService } = await import("../services/authService");
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleLogin = updateAuthState;

  const handleLogout = async () => {
    const { authService } = await import("../services/authService");
    await authService.logout();
    // Clear permission states on logout
    await AsyncStorage.removeItem("permission_location");
    await AsyncStorage.removeItem("permission_files");
    await AsyncStorage.removeItem("selected_directory_uri");
    setNeedsPermissions(true); // Reset to needing permissions on logout
    updateAuthState();
  };

  const handleGoToStartingScreen = updateAuthState;

  const handleSignUp = updateAuthState;

  useEffect(() => {
    checkAuthenticationState();

    const timer = setTimeout(() => {
      setTimeout(() => {
        setShowWelcome(false);
      }, 100);
    }, 2500); // Slightly longer for better readability

    return () => clearTimeout(timer);
  }, [checkAuthenticationState]);

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

  // If user is authenticated but needs permissions, show permission screen
  if (isAuthenticated && needsPermissions) {
    return (
      <AppPermission
        onAllPermissionsGranted={async () => {
          console.log(
            "Permission callback triggered, re-checking permissions..."
          );
          // Re-check permissions when callback is triggered
          await checkPermissions();
          console.log("Permissions re-checked, should navigate to Home now");
        }}
      />
    );
  }

  // If user is authenticated and doesn't need permissions, show Home
  if (isAuthenticated && !needsPermissions) {
    return (
      <Home
        onLogout={handleLogout}
        onGoToStartingScreen={handleGoToStartingScreen}
      />
    );
  }

  // If not authenticated, show StartingScreen
  return <StartingScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
}
