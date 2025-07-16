//index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StatusBar, Text, View, useColorScheme } from "react-native";

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import useThemedStyles from "../styles/index";

import Home from "./(tabs)/Home";
import StartingScreen from "./pages/StartingScreen";

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthenticationState = async () => {
    try {
      // Import the authService dynamically to avoid circular deps
      const { authService } = await import('../services/authService');
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
    }
  };

  // Helper to sync UI state with token state
  const updateAuthState = async () => {
    const { authService } = await import('../services/authService');
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleLogin = updateAuthState;

  const handleLogout = async () => {
    const { authService } = await import('../services/authService');
    await authService.logout();
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
  }, []);

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#1a2332" : "#ffffff"}
        />
        <LinearGradient
          colors={colorScheme === 'dark' 
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

  // If user is already authenticated, skip StartingScreen and go directly to Home
  if (isAuthenticated) {
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
