//index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StatusBar, Text, View, useColorScheme } from "react-native";

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import useThemedStyles from "../styles/index";

import Home from "./(tabs)/Home";
import StartingScreen from "./pages/StartingScreen";

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthenticationState = async () => {
    //later
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleGoToStartingScreen = () => {
    setIsAuthenticated(false);
  };

  const handleSignUp = () => {
    // This will be called when user completes signup
    setIsAuthenticated(true);
  };

  useEffect(() => {
    checkAuthenticationState();

    const timer = setTimeout(() => {
      if (colorScheme === 'dark') {
        // Use opacity animation for dark mode (works well)
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowWelcome(false);
        });
      } else {
        // Use faster transition for light mode to avoid gradient artifacts
        setTimeout(() => {
          setShowWelcome(false);
        }, 100);
      }
    }, 2500); // Slightly longer for better readability

    return () => clearTimeout(timer);
  }, [fadeAnimation, colorScheme]);

  if (showWelcome) {
    const animationStyle = colorScheme === 'dark' 
      ? [styles.container, { opacity: fadeAnimation }]
      : styles.container;

    return (
      <Animated.View style={animationStyle}>
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
      </Animated.View>
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


// ok i want to break down the codes into components. i have created a components folder outside the app folder and an utils folder. inside the components folder there will be a common folder and also folders representing each page/ For your reference i have created a login folder for Login.tsx/ similarly you will create signup for SignUp.tsx and so on.

// Let me also tell you how the navigation works so that you do not mess up the navigation.

// index.tsx to StartingScreen.tsx
// StartingScreen.tsx to 3 pages (Login.tsx, AadharVerification.tsx, AboutUs.tsx)
// Login.tsx to Home.tsx Optionally can travel to AafharVerification.tsx by clicking the signup option
// AadharVerification.tsx to SignUp.tsx optionally can travel to Login,tsx by clicking the login option.
// SignUp.tsx can travel to four pages(TermsAndConditions.tsx, DataCollectionConsentForm.tsx, PrivacyPolicy.tsx and Home.tsx) Optionally can travel Login.tsx by clicking the login option. 
// index.tsx can also travel directly to Home.tsx under certain conditions. 

// Any page with a back button can travel to the previous page.

// So first analuze the entire project and only then  get to work

// Any common components should be stored inside the components/common