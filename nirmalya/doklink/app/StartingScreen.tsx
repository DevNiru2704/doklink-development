//Starting Screen
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "../assets/images/light_background.png";
import NetworkBackgroundImage from "../assets/images/network_background.png";
import useThemedStyles from "./styles/StartingScreen";

import AadhaarVerification from "./AadharVerification";
import AboutUs from "./AboutUs";
import Login from "./Login";
import SignUp from "./SignUp";

interface StartingScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function StartingScreen({
  onSignUp,
  onLogin,
}: StartingScreenProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const [loginButtonPressed, setLoginButtonPressed] = useState(false);
  const [signUpButtonPressed, setSignUpButtonPressed] = useState(false);
  const [aboutButtonPressed, setAboutButtonPressed] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<
    "main" | "about" | "signup" | "aadhaar" | "login"
  >("main");
  const [aadhaarNumber, setAadhaarNumber] = useState("");

  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  const handleSignUpPress = () => {
    setCurrentScreen("aadhaar");
  };

  const handleAboutPress = () => {
    setCurrentScreen("about");
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  const handleProceedToSignUp = (aadhaarId: string) => {
    setAadhaarNumber(aadhaarId);
    setCurrentScreen("signup");
  };

  const handleLoginPress = () => {
    setCurrentScreen("login");
  };

  useEffect(() => {
    if (colorScheme === 'dark') {
      // Use fade animation for dark mode
      Animated.timing(fadeInAnimation, {
        toValue: 1,
        duration: 500, // 500ms fade in
        useNativeDriver: true,
      }).start();
    } else {
      // Set to visible immediately for light mode to avoid gradient artifacts
      fadeInAnimation.setValue(1);
    }
  }, [fadeInAnimation, colorScheme]);

  if (currentScreen === "about") {
    return <AboutUs onBack={handleBackToMain} />;
  }

  if (currentScreen === "aadhaar") {
    return (
      <AadhaarVerification
        onBack={handleBackToMain}
        onProceed={handleProceedToSignUp}
        onLogin={handleLoginPress}
      />
    );
  }

  if (currentScreen === "signup") {
    return (
      <SignUp
        onBack={() => setCurrentScreen("aadhaar")}
        onSignUp={onSignUp}
        onLogin={handleLoginPress}
        aadhaarNumber={aadhaarNumber}
      />
    );
  }

  if (currentScreen === "login") {
    return (
      <Login
        onBack={handleBackToMain}
        onLogin={onLogin}
        onSignUp={() => setCurrentScreen("aadhaar")}
      />
    );
  }

  const containerStyle = colorScheme === 'dark' 
    ? { flex: 1, opacity: fadeInAnimation }
    : { flex: 1 };

  return (
    <Animated.View style={containerStyle}>
      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={styles.gradientOverlay}
        />

        <View style={styles.content}>
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            {colorScheme === "dark" ? (
              <LogoSVGDark width={260} height={260} />
            ) : (
              <LogoSVGLight width={260} height={260} />
            )}
          </View>

          {/* Brand Name and Tagline */}
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>Doklink</Text>
            <Text style={styles.tagline}>One Link to Total Health!</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {colorScheme === "light" ? (
              <Pressable 
                onPress={handleLoginPress}
                onPressIn={() => setLoginButtonPressed(true)}
                onPressOut={() => setLoginButtonPressed(false)}
              >
                <LinearGradient
                  colors={
                    loginButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Log in to your account</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLoginPress}
              >
                <Text style={styles.loginButtonText}>Log in to your account</Text>
              </TouchableOpacity>
            )}

            {colorScheme === "light" ? (
              <Pressable 
                onPress={handleSignUpPress}
                onPressIn={() => setSignUpButtonPressed(true)}
                onPressOut={() => setSignUpButtonPressed(false)}
              >
                <LinearGradient
                  colors={
                    signUpButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signupButton}
                >
                  <Text style={styles.signupButtonText}>New? Sign up now</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUpPress}
              >
                <Text style={styles.signupButtonText}>New? Sign up now</Text>
              </TouchableOpacity>
            )}

            {colorScheme === "light" ? (
              <Pressable 
                onPress={handleAboutPress}
                onPressIn={() => setAboutButtonPressed(true)}
                onPressOut={() => setAboutButtonPressed(false)}
              >
                <LinearGradient
                  colors={
                    aboutButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.aboutButton}
                >
                  <Text style={styles.aboutButtonText}>About Us</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={styles.aboutButton}
                onPress={handleAboutPress}
              >
                <Text style={styles.aboutButtonText}>About Us</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}
