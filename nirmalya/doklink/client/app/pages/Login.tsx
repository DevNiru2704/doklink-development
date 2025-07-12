//Login.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik, FormikProps } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import * as Yup from "yup";

import LogoSVGDark from "@/assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "@/assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "@/assets/images/light_background.png";
import NetworkBackgroundImage from "@/assets/images/network_background.png";
import useThemedStyles from "@/styles/Login";
import { authService } from "@/services/authService";

interface LoginScreenProps {
  onBack: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

// Types
type LoginMethodType = "phone" | "email" | "username";
type LoginModeType = "password" | "otp";
type ForgotPasswordStep = "send_otp" | "verify_otp" | "reset_password";
type ScreenType = "method_selection" | "login_form" | "forgot_password" | "username_otp_choice" | "forgot_password_otp_choice";
type DeliveryMethodType = "email" | "sms";

// Validation schemas
const loginValidationSchema = Yup.object({
  loginField: Yup.string()
    .required("This field is required")
    .test("valid-format", function(value) {
      if (!value) return this.createError({ message: "This field is required" });
      
      const { parent } = this;
      const method = parent.method || "phone"; // Get method from context or default
      
      switch (method) {
        case "phone":
          if (!/^[6-9][0-9]{9}$/.test(value)) {
            return this.createError({ message: "Please enter a valid 10-digit phone number starting with 6-9" });
          }
          return true;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return this.createError({ message: "Please enter a valid email address" });
          }
          return true;
        case "username":
          if (!/^[a-z][a-z0-9]*$/.test(value)) {
            return this.createError({ message: "Username must start with a lowercase letter and contain only lowercase letters and digits" });
          }
          return true;
        default:
          return true;
      }
    }),
  password: Yup.string().when("mode", {
    is: "password",
    then: (schema) => schema.required("Password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  otp: Yup.string().when("mode", {
    is: "otp",
    then: (schema) => schema.matches(/^\d{6}$/, "OTP must be 6 digits").required("OTP is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const forgotPasswordValidationSchema = Yup.object({
  loginField: Yup.string().when("step", {
    is: "send_otp",
    then: (schema) => schema
      .required("This field is required")
      .test("valid-format", function(value) {
        if (!value) return this.createError({ message: "This field is required" });
        
        const { parent } = this;
        const method = parent.method || "phone"; // Get method from context or default
        
        switch (method) {
          case "phone":
            if (!/^[6-9][0-9]{9}$/.test(value)) {
              return this.createError({ message: "Please enter a valid 10-digit phone number starting with 6-9" });
            }
            return true;
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return this.createError({ message: "Please enter a valid email address" });
            }
            return true;
          case "username":
            if (!/^[a-z][a-z0-9]*$/.test(value)) {
              return this.createError({ message: "Username must start with a lowercase letter and contain only lowercase letters and digits" });
            }
            return true;
          default:
            return true;
        }
      }),
    otherwise: (schema) => schema.notRequired(),
  }),
  otp: Yup.string().when("step", {
    is: "verify_otp",
    then: (schema) => schema.matches(/^\d{6}$/, "OTP must be 6 digits").required("OTP is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  newPassword: Yup.string().when("step", {
    is: "reset_password",
    then: (schema) => schema
      .required("New password is required")
      .min(8, "Password must be at least 8 characters long")
      .test("has-lowercase", "Password must have at least one lowercase letter", (value) => {
        return value ? /[a-z]/.test(value) : false;
      })
      .test("has-uppercase", "Password must have at least one uppercase letter", (value) => {
        return value ? /[A-Z]/.test(value) : false;
      })
      .test("has-digit", "Password must have at least one digit", (value) => {
        return value ? /[0-9]/.test(value) : false;
      })
      .test("has-special", "Password must have at least one special character", (value) => {
        return value ? /[@$!%*#?&]/.test(value) : false;
      }),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPassword: Yup.string().when(["step", "newPassword"], {
    is: (step: string, newPassword: string) => step === "reset_password",
    then: (schema) => schema.oneOf([Yup.ref("newPassword")], "Passwords do not match").required("Confirm password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Form values interfaces
interface LoginFormValues {
  loginField: string;
  password: string;
  otp: string;
  mode: LoginModeType;
  method: LoginMethodType;
  general?: string;
}

interface ForgotPasswordFormValues {
  loginField: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  step: ForgotPasswordStep;
  method: LoginMethodType;
  general?: string;
}

// OTP delivery option interface
interface OTPDeliveryOption {
  method: 'email' | 'sms';
  display: string;
  destination: string;
  description: string;
}

export default function Login({ onBack, onLogin, onSignUp }: LoginScreenProps) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthenticationFailed, setIsAuthenticationFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [showResendButton, setShowResendButton] = useState(false);
  
  // OTP state managemen
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState(["", "", "", "", "", ""]);

  // Username OTP delivery options state
  const [usernameOTPOptions, setUsernameOTPOptions] = useState<OTPDeliveryOption[]>([]);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethodType | null>(null);
  const [isLoadingOTPOptions, setIsLoadingOTPOptions] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>("send_otp");

  // Button press states for light mode gradients
  const [loginButtonPressed, setLoginButtonPressed] = useState(false);
  const [methodButtonPressed, setMethodButtonPressed] = useState<number | null>(null);
  const [sendOtpButtonPressed, setSendOtpButtonPressed] = useState(false);
  const [forgotPasswordButtonPressed, setForgotPasswordButtonPressed] = useState(false);

  // OTP input refs
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const forgotPasswordOtpInputRefs = useRef<(TextInput | null)[]>([]);

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

  // Reset button press states when screen changes
  useEffect(() => {
    setMethodButtonPressed(null);
    setLoginButtonPressed(false);
    setSendOtpButtonPressed(false);
    setForgotPasswordButtonPressed(false);
  }, [currentScreen]);

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
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setIsResendLoading(false);
    setIsVerified(false);
    setIsAuthenticationFailed(false);
    setCountdown(5);
    setOtpSent(false);
    setResendTimer(30);
    setShowResendButton(false);
    // Clear OTP arrays securely
    setOtp(["", "", "", "", "", ""]);
    setForgotPasswordOtp(["", "", "", "", "", ""]);
    // Clear sensitive data
    setResetToken("");
    setCurrentLoginField("");
    // Reset button press states
    setMethodButtonPressed(null);
    setLoginButtonPressed(false);
    setSendOtpButtonPressed(false);
    setForgotPasswordButtonPressed(false);
  };

  // Enhanced OTP clearing function
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
      // Clear any sensitive data when component is unmounted
      setResetToken("");
      setCurrentLoginField("");
      // Clear OTP data for security
      clearOtpData();
    };
  }, []);

  // State for storing reset token for forgot password
  const [resetToken, setResetToken] = useState<string>("");
  
  // State for storing current login field for resend OTP functionality
  const [currentLoginField, setCurrentLoginField] = useState<string>("");

  const getPlaceholderText = (method: LoginMethodType): string => {
    switch (method) {
      case "phone":
        return "Enter 10-digit Phone Number";
      case "email":
        return "Enter Email Address";
      case "username":
        return "Enter Username";
      default:
        return "";
    }
  };

  const getKeyboardType = (method: LoginMethodType) => {
    switch (method) {
      case "phone":
        return "phone-pad";
      case "email":
        return "email-address";
      case "username":
        return "default";
      default:
        return "default";
    }
  };

  // Handle login with real backend authentication
  const handleLogin = async (values: LoginFormValues, { setStatus }: any) => {
    setIsLoading(true);
    setIsAuthenticationFailed(false);

    try {
      // Call appropriate authentication method based on mode
      if (values.mode === 'password') {
        // Password-based authentication
        const loginData = {
          login_field: values.loginField.trim(),
          login_method: loginMethod,
          auth_mode: 'password' as const,
          password: values.password
        };
        await authService.login(loginData);
      } else {
        // OTP-based authentication
        const otpData = {
          login_field: values.loginField.trim(),
          login_method: loginMethod,
          otp_code: values.otp
        };
        await authService.verifyLoginOTP(otpData);
      }
      
      // Login successful
      setIsVerified(true);
      setIsAuthenticationFailed(false);
      
      // Navigate to main app
      onLogin();
      
    } catch (error: any) {
      console.error("Login error:", error);
      setIsVerified(false);
      setIsAuthenticationFailed(true);
      
      // Set error message for display in form (like SignUp.tsx)
      setStatus({
        type: 'error',
        message: error.message || "Login failed. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle getting username OTP delivery options
  const handleGetUsernameOTPOptions = async (username: string, { setStatus }: any) => {
    setIsLoadingOTPOptions(true);
    
    try {
      const response = await authService.getUsernameOTPOptions(username.trim());
      setUsernameOTPOptions(response.options);
      setCurrentUsername(username.trim());
      setCurrentScreen("username_otp_choice");
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || "Failed to get OTP options. Please try again."
      });
    } finally {
      setIsLoadingOTPOptions(false);
    }
  };

  // Handle send OTP with real backend
  const handleSendOtp = async (values: LoginFormValues, { setStatus, setFieldTouched, validateField }: any) => {
    // First validate the login field before sending OTP
    setFieldTouched("loginField", true); // Mark field as touched to show errors
    
    // Trigger Formik validation first
    const validationResult = await validateField("loginField");
    if (validationResult) {
      // There's a validation error from Formik - let Formik handle it
      return;
    }

    // For username login with OTP mode, first get delivery options
    if (loginMethod === "username" && values.mode === "otp") {
      await handleGetUsernameOTPOptions(values.loginField, { setStatus });
      return;
    }

    setIsLoading(true);

    try {
      // Send login OTP through backend
      await authService.sendLoginOTP({
        login_field: values.loginField.trim(),
        login_method: loginMethod,
        delivery_method: selectedDeliveryMethod || 'auto'
      });
      
      // Store login field for resend functionality
      setCurrentLoginField(values.loginField.trim());
      
      setOtpSent(true);
      setResendTimer(30); // Default to 30s
      setShowResendButton(false);
      setLoginMode("otp"); // Ensure login mode is set to OTP
      
    } catch (error: any) {
      console.error("Send OTP error:", error);
      
      // Set error message for display in form (like SignUp.tsx)
      setStatus({
        type: 'error',
        message: error.message || "Failed to send OTP. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send OTP after delivery method selection for username
  const handleSendOtpWithDeliveryMethod = async (values: LoginFormValues, deliveryMethod: DeliveryMethodType, { setStatus }: any) => {
    setIsLoading(true);

    try {
      await authService.sendLoginOTP({
        login_field: values.loginField.trim(),
        login_method: loginMethod,
        delivery_method: deliveryMethod
      });
      
      // Store login field for resend functionality
      setCurrentLoginField(values.loginField.trim());
      
      setOtpSent(true);
      setResendTimer(30);
      setShowResendButton(false);
      setLoginMode("otp"); // Ensure login mode is set to OTP
      setCurrentScreen("login_form"); // Go back to login form with OTP sent
      
    } catch (error: any) {
      console.error("Send OTP error:", error);
      
      setStatus({
        type: 'error',
        message: error.message || "Failed to send OTP. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP with real backend
  const handleResendOtp = async () => {
    setIsResendLoading(true);
    setShowResendButton(false);
    setResendTimer(30);

    try {
      // Resend login OTP using stored login field
      await authService.sendLoginOTP({
        login_field: currentLoginField,
        login_method: loginMethod
      });
      
      setOtpSent(true);
      setResendTimer(30);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      // Handle error - could show a toast or alert
    } finally {
      setIsResendLoading(false);
    }
  };

  // Handle forgot password with real backend
  const handleForgotPassword = async (values: ForgotPasswordFormValues, { setStatus }: any) => {
    setIsLoading(true);
    setIsAuthenticationFailed(false);

    try {
      if (forgotPasswordStep === "send_otp") {
        // For username, navigate to delivery method selection screen
        if (loginMethod === "username") {
          try {
            const response = await authService.getUsernameOTPOptions(values.loginField.trim());
            setUsernameOTPOptions(response.options);
            setCurrentUsername(values.loginField.trim());
            setCurrentScreen("forgot_password_otp_choice");
            setIsLoading(false);
            return;
          } catch (error: any) {
            throw new Error(error.message || "Failed to get delivery options for username");
          }
        }

        // Send forgot password OTP through backend for phone/email
        await authService.sendForgotPasswordOTP({
          login_field: values.loginField.trim(),
          login_method: loginMethod,
          delivery_method: selectedDeliveryMethod || 'auto'
        });
        
        setOtpSent(true);
        setResendTimer(30);
        setShowResendButton(false);
        setForgotPasswordStep("verify_otp");
        return;
        
      } else if (forgotPasswordStep === "verify_otp") {
        // Verify OTP and get reset token
        const response = await authService.verifyForgotPasswordOTP({
          login_field: values.loginField.trim(),
          login_method: loginMethod,
          otp_code: values.otp
        });
        
        // Store reset token for password reset step
        setResetToken(response.reset_token);
        setIsAuthenticationFailed(false);
        setForgotPasswordStep("reset_password");
        return;
        
      } else if (forgotPasswordStep === "reset_password") {
        // Reset password with the token
        await authService.confirmPasswordReset({
          reset_token: resetToken,
          new_password: values.newPassword,
          confirm_password: values.confirmPassword
        });
        
        // Reset form and go back to login
        setCurrentScreen("login_form");
        setOtpSent(false);
        setForgotPasswordOtp(["", "", "", "", "", ""]);
        setResetToken("");
        setUsernameOTPOptions([]);
        setSelectedDeliveryMethod(null);
        setForgotPasswordStep("send_otp");
        return;
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setIsAuthenticationFailed(true);
      
      // Set error message for display in form (like SignUp.tsx)
      setStatus({
        type: 'error',
        message: error.message || "Something went wrong. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send forgot password OTP after delivery method selection for username
  const handleSendForgotPasswordOtpWithDeliveryMethod = async (values: ForgotPasswordFormValues, deliveryMethod: DeliveryMethodType, { setStatus }: any) => {
    setIsLoading(true);

    try {
      await authService.sendForgotPasswordOTP({
        login_field: values.loginField.trim(),
        login_method: loginMethod,
        delivery_method: deliveryMethod
      });
      
      setOtpSent(true);
      setResendTimer(30);
      setShowResendButton(false);
      setForgotPasswordStep("verify_otp");
      setCurrentScreen("forgot_password"); // Go back to forgot password form with OTP sent
      
    } catch (error: any) {
      console.error("Send forgot password OTP error:", error);
      
      setStatus({
        type: 'error',
        message: error.message || "Failed to send OTP. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change - Enhanced with better validation
  const handleOtpChange = (text: string, index: number, setFieldValue: any, isLogin: boolean = true) => {
    // Only allow numeric input
    if (text && !/^\d$/.test(text)) return;
    
    if (text.length > 1) return; // Only allow single digit

    const currentOtp = isLogin ? otp : forgotPasswordOtp;
    const setOtpState = isLogin ? setOtp : setForgotPasswordOtp;
    const inputRefs = isLogin ? otpInputRefs : forgotPasswordOtpInputRefs;

    // Update OTP array
    const newOtp = [...currentOtp];
    newOtp[index] = text;
    setOtpState(newOtp);

    // Update Formik field with joined OTP
    const otpString = newOtp.join("");
    setFieldValue("otp", otpString);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when OTP is complete (optional UX improvement)
    if (otpString.length === 6 && isLogin) {
      // Could auto-submit here, but let's keep manual submission for security
      console.log("OTP Complete:", otpString);
    }
  };

  const handleKeyPress = (key: string, index: number, isLogin: boolean = true) => {
    const currentOtp = isLogin ? otp : forgotPasswordOtp;
    const inputRefs = isLogin ? otpInputRefs : forgotPasswordOtpInputRefs;
    
    if (key === "Backspace" && !currentOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Render OTP inputs - like AadharVerification
  const renderOtpInputs = (values: any, setFieldValue: any, touched: any, errors: any, isLogin: boolean = true) => {
    const currentOtp = isLogin ? otp : forgotPasswordOtp;
    const inputRefs = isLogin ? otpInputRefs : forgotPasswordOtpInputRefs;
    
    // Apply different container styles based on context
    const containerStyle = isLogin 
      ? styles.otpContainer 
      : [styles.otpContainer, { 
          maxWidth: 360, // Increase maxWidth for forgot password to accommodate compactFormContainer
          position: "relative" as "relative",
          right: 10,
          paddingHorizontal: 0, // Remove existing padding to maximize space
          marginHorizontal: 0 // Reset margins
        }];
    
    return (
      <View style={containerStyle}>
        {currentOtp.map((digit: string, index: number) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              isVerified && styles.otpInputDimmed,
              touched.otp && errors.otp && styles.errorInput,
            ]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index, setFieldValue, isLogin)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index, isLogin)
            }
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            placeholderTextColor="#6B7280"
            editable={!isVerified}
          />
        ))}
      </View>
    );
  };

  // Render method selection screen
  const renderMethodSelection = () => (
    <View style={styles.formContainer}>
      <Text style={styles.subtitle}>Choose Login Method</Text>
      
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => {
            setMethodButtonPressed(null); // Reset immediately
            setLoginMethod("phone");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
          onPressIn={() => setMethodButtonPressed(0)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 0
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Phone Number</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => {
            setLoginMethod("phone");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
        >
          <Ionicons name="call" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Phone Number</Text>
        </TouchableOpacity>
      )}
      
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => {
            setMethodButtonPressed(null); // Reset immediately
            setLoginMethod("email");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
          onPressIn={() => setMethodButtonPressed(1)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 1
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Email</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => {
            setLoginMethod("email");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
        >
          <Ionicons name="mail" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Email</Text>
        </TouchableOpacity>
      )}
      
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => {
            setMethodButtonPressed(null); // Reset immediately
            setLoginMethod("username");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
          onPressIn={() => setMethodButtonPressed(2)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 2
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Username</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => {
            setLoginMethod("username");
            setLoginMode("password");
            setCurrentScreen("login_form");
          }}
        >
          <Ionicons name="person" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Username</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render login form screen
  const renderLoginForm = () => (
    <Formik
      initialValues={{
        loginField: "",
        password: "",
        otp: "",
        mode: loginMode,
        method: loginMethod, // Add method for validation context
      }}
      validationSchema={loginValidationSchema}
      enableReinitialize={true} // This will update form when loginMethod changes
      onSubmit={handleLogin}
    >
      {({ values, errors, touched, status, handleChange, handleBlur, handleSubmit, setFieldValue, setStatus, validateField, setFieldTouched }: FormikProps<LoginFormValues>) => {
        
        // Clear any error status when user starts typing (like SignUp.tsx)
        const clearErrorStatus = () => {
          if (status && status.type === 'error') {
            setStatus(null);
          }
        };

        return (
        <View style={styles.formContainer}>
          
          {/* Login Field Input - Only show when not in OTP mode or OTP not sent */}
          {!(values.mode === "otp" && otpSent) && (
            <>
              <TextInput
                style={[
                  styles.input,
                  touched.loginField && errors.loginField ? styles.errorInput : {},
                ]}
                placeholder={getPlaceholderText(loginMethod)}
                placeholderTextColor="#6B7280"
                value={values.loginField}
                onChangeText={(text) => {
                  handleChange("loginField")(text);
                  clearErrorStatus();
                }}
                onBlur={handleBlur("loginField")}
                keyboardType={getKeyboardType(loginMethod)}
                autoCapitalize="none"
                maxLength={loginMethod === "phone" ? 10 : undefined}
              />
              {touched.loginField && errors.loginField && (
                <Text style={styles.errorText}>{errors.loginField}</Text>
              )}
            </>
          )}

          {/* Password Mode */}
          {values.mode === "password" && (
            <>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    touched.password && errors.password ? styles.errorInput : {},
                  ]}
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  value={values.password}
                  onChangeText={(text) => {
                    handleChange("password")(text);
                    clearErrorStatus();
                  }}
                  onBlur={handleBlur("password")}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </>
          )}

          {/* OTP Mode */}
          {values.mode === "otp" && (
            <>
              {!otpSent ? (
                /* Send OTP Button */
                colorScheme === "light" ? (
                  <Pressable
                    onPress={() => handleSendOtp(values, { setStatus, setFieldTouched, validateField })}
                    onPressIn={() => setSendOtpButtonPressed(true)}
                    onPressOut={() => setSendOtpButtonPressed(false)}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={
                        sendOtpButtonPressed
                          ? ["#1691A8", "#083A73"]
                          : ["#1CA8C9", "#0A4C8B"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                    onPress={() => handleSendOtp(values, { setStatus, setFieldTouched, validateField })}
                    disabled={isLoading}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Text>
                  </TouchableOpacity>
                )
              ) : (
                /* OTP Input Section */
                <>
                  <Text style={styles.otpLabel}>
                    OTP sent! {loginMethod === "username" ? "Check your phone/email" : `Check your ${loginMethod}`}
                  </Text>
                  
                  {renderOtpInputs(values, setFieldValue, touched, errors, true)}
                  
                  {touched.otp && errors.otp && (
                    <Text style={styles.errorText}>{errors.otp}</Text>
                  )}
                </>
              )}
            </>
          )}

          {/* Submit Button - Show when password mode or when OTP is sent */}
          {(values.mode === "password" || (values.mode === "otp" && otpSent)) && (
            colorScheme === "light" ? (
              <Pressable
                onPress={() => handleSubmit()}
                onPressIn={() => setLoginButtonPressed(true)}
                onPressOut={() => setLoginButtonPressed(false)}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={
                    loginButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Logging in..." : values.mode === "otp" ? "Verify OTP" : "Login"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                onPress={() => handleSubmit()}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Logging in..." : values.mode === "otp" ? "Verify OTP" : "Login"}
                </Text>
              </TouchableOpacity>
            )
          )}

          {/* Action Links - Only show when not verified */}
          {!isVerified && (
            <View style={styles.actionLinksContainer}>
              {/* First Row: Forgot Password, Login with OTP/Password, Try another way, Resend OTP */}
              <View style={styles.actionLinksRow}>
                {/* Forgot Password - Only show in password mode */}
                {values.mode === "password" && (
                  <TouchableOpacity
                    style={styles.actionLinkButton}
                    onPress={() => {
                      setCurrentScreen("forgot_password");
                      setForgotPasswordStep("send_otp");
                      setIsAuthenticationFailed(false);
                    }}
                  >
                    <Text style={styles.actionLinkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}
                
                {/* Login with OTP/Password Toggle */}
                <TouchableOpacity
                  style={styles.actionLinkButton}
                  onPress={() => {
                    const newMode = values.mode === "password" ? "otp" : "password";
                    setFieldValue("mode", newMode);
                    setLoginMode(newMode);
                    clearOtpData();
                    setIsAuthenticationFailed(false);
                  }}
                >
                  <Text style={styles.actionLinkText}>
                    {values.mode === "password" ? "Login with OTP" : "Login with Password"}
                  </Text>
                </TouchableOpacity>

                {/* Try Another Way - Keep as link */}
                <TouchableOpacity
                  style={styles.actionLinkButton}
                  onPress={() => {
                    setCurrentScreen("method_selection");
                    setLoginMode("password");
                    clearOtpData();
                    setIsAuthenticationFailed(false);
                  }}
                >
                  <Text style={styles.actionLinkText}>Try another way</Text>
                </TouchableOpacity>

                {/* Resend OTP - Only show in OTP mode when OTP is sent */}
                {values.mode === "otp" && otpSent && (
                  showResendButton ? (
                    <TouchableOpacity
                      style={styles.actionLinkButton}
                      onPress={handleResendOtp}
                      disabled={isResendLoading}
                    >
                      <Text style={styles.actionLinkText}>
                        {isResendLoading ? "Sending..." : "Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.actionLinkButton}>
                      <Text style={[styles.actionLinkText, { textDecorationLine: 'none' }]}>
                        Resend OTP ({resendTimer})
                      </Text>
                    </View>
                  )
                )}
              </View>

              {/* Second Row: Sign up link */}
              <TouchableOpacity onPress={onSignUp} style={styles.signupLink}>
                <Text style={styles.signupLinkText}>
                  Don&#39;t have an account? Sign up
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Messages */}
          {status && status.type === 'error' && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={styles.backendErrorText}>{status.message}</Text>
              </View>
            </View>
          )}

          {/* Authentication Failed Status */}
          {isAuthenticationFailed && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={[styles.errorText, { marginLeft: 8, marginTop: 0 }]}>
                  Authentication failed
                </Text>
              </View>
            </View>
          )}

          {/* Success Status */}
          {isVerified && (
            <View style={styles.statusContainer}>
              <View style={styles.successStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.successText}>Login successful!</Text>
              </View>
              <View style={styles.proceedSection}>
                <Text style={styles.countdownText}>
                  Welcome back! Connecting you to doklink in {countdown} seconds...
                </Text>
              </View>
            </View>
          )}
        </View>
        );
      }}
    </Formik>
  );

  // Render forgot password screen
  const renderForgotPassword = () => (
    <Formik
      initialValues={{
        loginField: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
        step: "send_otp" as ForgotPasswordStep,
        method: loginMethod, // Add method for validation context
      }}
      validationSchema={forgotPasswordValidationSchema}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, { setStatus, setFieldValue, validateForm }) => {
        // Manually validate the form before submission
        const errors = await validateForm(values);
        
        // Check if there are any validation errors for the current step
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
          return; // Stop submission if there are validation errors
        }
        
        await handleForgotPassword(values, { setStatus });
      }}
    >
      {({ values, errors, touched, status, handleChange, handleBlur, handleSubmit, setFieldValue, setStatus }: FormikProps<ForgotPasswordFormValues>) => {
        
        // Clear any error status when user starts typing (like SignUp.tsx)
        const clearErrorStatus = () => {
          if (status && status.type === 'error') {
            setStatus(null);
          }
        };

        return (
        <View style={[styles.formContainer, styles.compactFormContainer]}>
          <Text style={styles.forgotTitle}>Reset Password</Text>
          
          {forgotPasswordStep === "send_otp" && (
            <>
              <Text style={styles.forgotSubtitle}>
                Enter your {loginMethod} to receive a reset code
              </Text>
              
              <TextInput
                style={[
                  styles.input,
                  touched.loginField && errors.loginField ? styles.errorInput : {},
                ]}
                placeholder={getPlaceholderText(loginMethod)}
                placeholderTextColor="#6B7280"
                value={values.loginField}
                onChangeText={(text) => {
                  handleChange("loginField")(text);
                  clearErrorStatus();
                  // Reset delivery options when input changes
                  if (loginMethod === "username") {
                    setUsernameOTPOptions([]);
                    setSelectedDeliveryMethod(null);
                  }
                }}
                onBlur={handleBlur("loginField")}
                keyboardType={getKeyboardType(loginMethod)}
                autoCapitalize="none"
                maxLength={loginMethod === "phone" ? 10 : undefined}
              />
              {touched.loginField && errors.loginField && (
                <Text style={styles.errorText}>{errors.loginField}</Text>
              )}
            </>
          )}

          {forgotPasswordStep === "verify_otp" && (
            <>
              <Text style={styles.forgotSubtitle}>
                Enter the verification code sent to your {loginMethod}
                {loginMethod === "username" ? " (phone/email)" : ""}
              </Text>
              
              {renderOtpInputs(values, setFieldValue, touched, errors, false)}
              
              {touched.otp && errors.otp && (
                <Text style={styles.errorText}>{errors.otp}</Text>
              )}
            </>
          )}

          {forgotPasswordStep === "reset_password" && (
            <>
              <Text style={styles.forgotSubtitle}>
                Create a new password for your account
              </Text>
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    touched.newPassword && errors.newPassword ? styles.errorInput : {},
                  ]}
                  placeholder="New Password"
                  placeholderTextColor="#6B7280"
                  value={values.newPassword}
                  onChangeText={(text) => {
                    handleChange("newPassword")(text);
                    clearErrorStatus();
                  }}
                  onBlur={handleBlur("newPassword")}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordText}>
                    {showNewPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {touched.newPassword && errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    touched.confirmPassword && errors.confirmPassword ? styles.errorInput : {},
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#6B7280"
                  value={values.confirmPassword}
                  onChangeText={(text) => {
                    handleChange("confirmPassword")(text);
                    clearErrorStatus();
                  }}
                  onBlur={handleBlur("confirmPassword")}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </>
          )}

          {/* Submit Button */}
          {(() => {
            // Button is only disabled when loading
            const buttonDisabled = isLoading;

            return colorScheme === "light" ? (
              <Pressable
                onPress={() => handleSubmit()}
                onPressIn={() => setForgotPasswordButtonPressed(true)}
                onPressOut={() => setForgotPasswordButtonPressed(false)}
                disabled={buttonDisabled}
              >
                <LinearGradient
                  colors={
                    forgotPasswordButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, buttonDisabled && { opacity: 0.6 }]}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Processing..." : 
                      forgotPasswordStep === "send_otp" ? "Send OTP" :
                      forgotPasswordStep === "verify_otp" ? "Verify OTP" :
                      "Reset Password"
                    }
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={[styles.loginButton, buttonDisabled && { opacity: 0.6 }]}
                onPress={() => handleSubmit()}
                disabled={buttonDisabled}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Processing..." : 
                    forgotPasswordStep === "send_otp" ? "Send OTP" :
                    forgotPasswordStep === "verify_otp" ? "Verify OTP" :
                    "Reset Password"
                  }
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Action Links for Forgot Password */}
          <View style={styles.compactActionLinks}>
            <View style={styles.actionLinksRow}>
              {/* Back to Login */}
              <TouchableOpacity
                style={styles.actionLinkButton}
                onPress={() => {
                  setCurrentScreen("login_form");
                  setForgotPasswordOtp(["", "", "", "", "", ""]);
                  setOtpSent(false);
                  setIsAuthenticationFailed(false);
                  setUsernameOTPOptions([]);
                  setSelectedDeliveryMethod(null);
                  setForgotPasswordStep("send_otp");
                }}
              >
                <Text style={styles.actionLinkText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Resend OTP - Only show in verify_otp step when OTP is sent */}
              {forgotPasswordStep === "verify_otp" && otpSent && (
                showResendButton ? (
                  <TouchableOpacity
                    style={styles.actionLinkButton}
                    onPress={handleResendOtp}
                    disabled={isResendLoading}
                  >
                    <Text style={styles.actionLinkText}>
                      {isResendLoading ? "Sending..." : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actionLinkButton}>
                    <Text style={[styles.actionLinkText, { textDecorationLine: 'none' }]}>
                      Resend Code ({resendTimer})
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Error Messages */}
          {status && status.type === 'error' && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={styles.backendErrorText}>{status.message}</Text>
              </View>
            </View>
          )}

          {/* Authentication Failed Status */}
          {isAuthenticationFailed && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={[styles.errorText, { marginLeft: 8, marginTop: 0 }]}>
                  Authentication failed
                </Text>
              </View>
            </View>
          )}

          {/* Success Status */}
          {isVerified && (
            <View style={styles.statusContainer}>
              <View style={styles.successStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.successText}>Password reset successful!</Text>
              </View>
              <View style={styles.proceedSection}>
                <Text style={styles.countdownText}>
                  Password updated! Redirecting to login in {countdown} seconds...
                </Text>
              </View>
            </View>
          )}
        </View>
        );
      }}
    </Formik>
  );

  // Render username OTP delivery choice screen  
  const renderUsernameOTPChoice = () => (
    <View style={[styles.formContainer, styles.compactFormContainer]}>
      {/* Title */}
      <Text style={styles.alternativeTitle}>Choose OTP Delivery Method</Text>
      <Text style={styles.subtitle}>
        Select how you&apos;d like to receive your verification code
      </Text>

      {/* Delivery Options */}
      {isLoadingOTPOptions ? (
        <Text style={styles.subtitle}>Loading options...</Text>
      ) : (
        <>
          <View style={styles.compactAlternativeContainer}>
            {usernameOTPOptions.map((option, index) => (
            <TouchableOpacity
              key={option.method}
              style={[
                styles.methodOption,
                styles.compactMethodOption,
                selectedDeliveryMethod === option.method && styles.methodOptionSelected
              ]}
              onPress={() => setSelectedDeliveryMethod(option.method as DeliveryMethodType)}
            >
              <Ionicons 
                name={option.method === 'email' ? 'mail' : 'phone-portrait'} 
                size={20} 
                color={selectedDeliveryMethod === option.method ? "#3B82F6" : (colorScheme === "dark" ? "#FFFFFF" : "#000000")}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.methodOptionText, styles.compactMethodOptionText]}>
                  {option.display}
                </Text>
                <Text style={[styles.forgotSubtitle, styles.compactDestinationText]}>
                  {option.destination}
                </Text>
              </View>
              {selectedDeliveryMethod === option.method && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
            ))}
          </View>

          {/* Send OTP Button */}
          {selectedDeliveryMethod && (
            colorScheme === "light" ? (
              <Pressable
                onPress={() => {
                  handleSendOtpWithDeliveryMethod(
                    { loginField: currentUsername, password: '', otp: '', mode: 'otp', method: 'username' },
                    selectedDeliveryMethod,
                    { setStatus: () => {} }
                  );
                }}
                onPressIn={() => setLoginButtonPressed(true)}
                onPressOut={() => setLoginButtonPressed(false)}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={
                    loginButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Sending..." : "Send OTP"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && { opacity: 0.6 }
                ]}
                disabled={isLoading}
                onPress={() => {
                  handleSendOtpWithDeliveryMethod(
                    { loginField: currentUsername, password: '', otp: '', mode: 'otp', method: 'username' },
                    selectedDeliveryMethod,
                    { setStatus: () => {} }
                  );
                }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Text>
              </TouchableOpacity>
            )
          )}

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.compactActionLinks}
            onPress={() => {
              setCurrentScreen("login_form");
              setUsernameOTPOptions([]);
              setSelectedDeliveryMethod(null);
            }}
          >
            <Text style={styles.alternativeLinkText}>← Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // Render forgot password OTP delivery choice screen  
  const renderForgotPasswordOTPChoice = () => (
    <View style={[styles.formContainer, styles.compactFormContainer]}>
      {/* Title */}
      <Text style={styles.alternativeTitle}>Choose OTP Delivery Method</Text>
      <Text style={styles.subtitle}>
        Select how you&apos;d like to receive your reset code
      </Text>

      {/* Delivery Options */}
      {isLoadingOTPOptions ? (
        <Text style={styles.subtitle}>Loading options...</Text>
      ) : (
        <>
          <View style={styles.compactAlternativeContainer}>
            {usernameOTPOptions.map((option, index) => (
            <TouchableOpacity
              key={option.method}
              style={[
                styles.methodOption,
                styles.compactMethodOption,
                selectedDeliveryMethod === option.method && styles.methodOptionSelected
              ]}
              onPress={() => setSelectedDeliveryMethod(option.method as DeliveryMethodType)}
            >
              <Ionicons 
                name={option.method === 'email' ? 'mail' : 'phone-portrait'} 
                size={20} 
                color={selectedDeliveryMethod === option.method ? "#3B82F6" : (colorScheme === "dark" ? "#FFFFFF" : "#000000")}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.methodOptionText, styles.compactMethodOptionText]}>
                  {option.display}
                </Text>
                <Text style={[styles.forgotSubtitle, styles.compactDestinationText]}>
                  {option.destination}
                </Text>
              </View>
              {selectedDeliveryMethod === option.method && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
            ))}
          </View>

          {/* Send OTP Button */}
          {selectedDeliveryMethod && (
            colorScheme === "light" ? (
              <Pressable
                onPress={() => {
                  handleSendForgotPasswordOtpWithDeliveryMethod(
                    { loginField: currentUsername, otp: '', newPassword: '', confirmPassword: '', step: 'send_otp', method: 'username' },
                    selectedDeliveryMethod,
                    { setStatus: () => {} }
                  );
                }}
                onPressIn={() => setLoginButtonPressed(true)}
                onPressOut={() => setLoginButtonPressed(false)}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={
                    loginButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && { opacity: 0.6 }
                ]}
                disabled={isLoading}
                onPress={() => {
                  handleSendForgotPasswordOtpWithDeliveryMethod(
                    { loginField: currentUsername, otp: '', newPassword: '', confirmPassword: '', step: 'send_otp', method: 'username' },
                    selectedDeliveryMethod,
                    { setStatus: () => {} }
                  );
                }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Text>
              </TouchableOpacity>
            )
          )}

          {/* Back to Forgot Password */}
          <TouchableOpacity
            style={styles.compactActionLinks}
            onPress={() => {
              setCurrentScreen("forgot_password");
              setUsernameOTPOptions([]);
              setSelectedDeliveryMethod(null);
              setForgotPasswordStep("send_otp");
            }}
          >
            <Text style={styles.alternativeLinkText}>← Back to Reset Password</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

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
        {currentScreen === "method_selection" && renderMethodSelection()}
        {currentScreen === "login_form" && renderLoginForm()}
        {currentScreen === "forgot_password" && renderForgotPassword()}
        {currentScreen === "username_otp_choice" && renderUsernameOTPChoice()}
        {currentScreen === "forgot_password_otp_choice" && renderForgotPasswordOTPChoice()}
      </Animated.View>
    </ImageBackground>
  );
}