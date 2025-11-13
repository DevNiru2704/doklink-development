//LoginNew.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";

import LogoSVGDark from "@/assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "@/assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "@/assets/images/light_background.png";
import NetworkBackgroundImage from "@/assets/images/network_background.png";
import useThemedStyles from "@/styles/Login";

// Import components
import MethodSelection from "../../components/login/MethodSelection";
import LoginForm from "../../components/login/LoginForm";
import ForgotPassword from "../../components/login/ForgotPassword";
import UsernameOTPChoice from "../../components/login/UsernameOTPChoice";
import ForgotPasswordOTPChoice from "../../components/login/ForgotPasswordOTPChoice";

// Import types and validation
import { 
  LoginMethodType, 
  LoginModeType, 
  ForgotPasswordStep, 
  ScreenType, 
  DeliveryMethodType,
  OTPDeliveryOption 
} from "../../utils/login/types";

interface LoginScreenProps {
  onBack: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LoginNew({ onBack, onLogin, onSignUp }: LoginScreenProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();

  // Background image logic
  const backgroundImage = colorScheme === "dark" ? NetworkBackgroundImage : NetworkBackgroundImageLight;

  // State variables
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("method_selection");
  const [loginMethod, setLoginMethod] = useState<LoginMethodType>("phone");
  const [loginMode, setLoginMode] = useState<LoginModeType>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [showResendButton, setShowResendButton] = useState(false);
  
  // OTP state management
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState(["", "", "", "", "", ""]);

  // Username OTP delivery options state
  const [usernameOTPOptions, setUsernameOTPOptions] = useState<OTPDeliveryOption[]>([]);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethodType | null>(null);
  const [isLoadingOTPOptions, setIsLoadingOTPOptions] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>("send_otp");

  // State for storing reset token for forgot password
  const [resetToken, setResetToken] = useState<string>("");
  
  // State for storing current login field for resend OTP functionality
  const [currentLoginField, setCurrentLoginField] = useState<string>("");

  // Animation effect
  useEffect(() => {
    if (colorScheme === "dark") {
      Animated.parallel([
        Animated.timing(fadeInAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideInAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeInAnimation.setValue(1);
      slideInAnimation.setValue(0);
    }
  }, [fadeInAnimation, slideInAnimation, colorScheme]);

  // Countdown effect for successful login
  useEffect(() => {
    if (isVerified) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              resetForm();
              onLogin();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVerified, onLogin]);

  // Resend timer effect
  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowResendButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [otpSent, resendTimer]);

  // Helper functions
  const resetForm = () => {
    setCurrentScreen("method_selection");
    setLoginMethod("phone");
    setLoginMode("password");
    setIsLoading(false);
    setIsResendLoading(false);
    setIsVerified(false);
    setCountdown(5);
    setOtpSent(false);
    setResendTimer(30);
    setShowResendButton(false);
    setOtp(["", "", "", "", "", ""]);
    setForgotPasswordOtp(["", "", "", "", "", ""]);
    setResetToken("");
    setCurrentLoginField("");
  };

  const clearOtpData = () => {
    setOtp(["", "", "", "", "", ""]);
    setForgotPasswordOtp(["", "", "", "", "", ""]);
    setOtpSent(false);
    setResendTimer(30);
    setShowResendButton(false);
  };

  // Cleanup sensitive data when component unmounts
  useEffect(() => {
    return () => {
      setResetToken("");
      setCurrentLoginField("");
      clearOtpData();
    };
  }, []);

  // Common props for all components
  const commonProps = {
    colorScheme,
    styles,
    loginMethod,
    setLoginMethod,
    loginMode,
    setLoginMode,
    currentScreen,
    setCurrentScreen,
    isLoading,
    setIsLoading,
    isResendLoading,
    setIsResendLoading,
    isVerified,
    setIsVerified,
    countdown,
    setCountdown,
    otpSent,
    setOtpSent,
    resendTimer,
    setResendTimer,
    showResendButton,
    setShowResendButton,
    otp,
    setOtp,
    forgotPasswordOtp,
    setForgotPasswordOtp,
    usernameOTPOptions,
    setUsernameOTPOptions,
    selectedDeliveryMethod,
    setSelectedDeliveryMethod,
    isLoadingOTPOptions,
    setIsLoadingOTPOptions,
    currentUsername,
    setCurrentUsername,
    forgotPasswordStep,
    setForgotPasswordStep,
    resetToken,
    setResetToken,
    currentLoginField,
    setCurrentLoginField,
    clearOtpData,
    onSignUp
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#000000" : "#F8F9FA"}
      />

      {/* Only show gradient overlay in dark mode */}
      {colorScheme === "dark" && (
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={styles.gradientOverlay}
        />
      )}

      <Animated.View
        style={[
          styles.content,
          colorScheme === "dark"
            ? {
                opacity: fadeInAnimation,
                transform: [{ translateY: slideInAnimation }],
              }
            : {},
        ]}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          {colorScheme === "dark" ? (
            <LogoSVGDark width={160} height={160} />
          ) : (
            <LogoSVGLight width={170} height={170} />
          )}
        </View>

        {/* Brand Name */}
        <Text style={styles.brandName}>Doklink</Text>

        {/* Welcome Back Message */}
        <Text style={styles.welcomeMessage}>Welcome Back</Text>

        {/* Main Content */}
        {currentScreen === "method_selection" && <MethodSelection {...commonProps} />}
        {currentScreen === "login_form" && <LoginForm {...commonProps} />}
        {currentScreen === "forgot_password" && <ForgotPassword {...commonProps} />}
        {currentScreen === "username_otp_choice" && <UsernameOTPChoice {...commonProps} />}
        {currentScreen === "forgot_password_otp_choice" && <ForgotPasswordOTPChoice {...commonProps} />}
      </Animated.View>
    </ImageBackground>
  );
}