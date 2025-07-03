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

import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "../assets/images/light_background.png";
import NetworkBackgroundImage from "../assets/images/network_background.png";

import useThemedStyles from "../styles/Login";

interface LoginScreenProps {
  onBack: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

// Types
type LoginMethodType = "phone" | "email" | "username";
type LoginModeType = "password" | "otp";
type ForgotPasswordStep = "send_otp" | "verify_otp" | "reset_password";
type ScreenType = "method_selection" | "login_form" | "forgot_password";

// Hardcoded credentials - only for password and OTP validation
const HARDCODED_CREDENTIALS = {
  password: "Aa#1234",
  otp: "123456",
};

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
    setOtp(["", "", "", "", "", ""]);
    setForgotPasswordOtp(["", "", "", "", "", ""]);
    // Reset button press states
    setMethodButtonPressed(null);
    setLoginButtonPressed(false);
    setSendOtpButtonPressed(false);
    setForgotPasswordButtonPressed(false);
  };

  const validateCredentials = (method: LoginMethodType, loginField: string, password: string): boolean => {
    // Only validate password against hardcoded value
    return password === HARDCODED_CREDENTIALS.password;
  };

  const validateOtp = (otpString: string): boolean => {
    return otpString === HARDCODED_CREDENTIALS.otp;
  };

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

  // Handle login
  const handleLogin = async (values: LoginFormValues, { setFieldError }: any) => {
    setIsLoading(true);
    setIsAuthenticationFailed(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (values.mode === "password") {
        if (validateCredentials(loginMethod, values.loginField, values.password)) {
          setIsVerified(true);
          setIsAuthenticationFailed(false);
          return;
        } else {
          setIsVerified(false);
          setIsAuthenticationFailed(true);
        }
      } else if (values.mode === "otp") {
        if (validateOtp(values.otp)) {
          setIsVerified(true);
          setIsAuthenticationFailed(false);
          return;
        } else {
          setIsVerified(false);
          setIsAuthenticationFailed(true);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setFieldError("general", "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send OTP
  const handleSendOtp = async (values: LoginFormValues, { setFieldError, setFieldTouched, validateField }: any) => {
    // First validate the login field before sending OTP
    setFieldTouched("loginField", true); // Mark field as touched to show errors
    
    // Trigger Formik validation first
    const validationResult = await validateField("loginField");
    if (validationResult) {
      // There's a validation error from Formik
      setFieldError("loginField", validationResult);
      return;
    }
    
    // Additional manual validation based on current login method
    const loginField = values.loginField.trim();
    let validationError = "";
    
    if (!loginField) {
      validationError = "This field is required";
    } else {
      switch (loginMethod) {
        case "phone":
          if (!/^[6-9][0-9]{9}$/.test(loginField)) {
            validationError = "Please enter a valid 10-digit phone number starting with 6-9";
          }
          break;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginField)) {
            validationError = "Please enter a valid email address";
          }
          break;
        case "username":
          if (!/^[a-z][a-z0-9]*$/.test(loginField)) {
            validationError = "Username must start with a lowercase letter and contain only lowercase letters and digits";
          }
          break;
      }
    }
    
    if (validationError) {
      setFieldError("loginField", validationError);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setOtpSent(true);
      setResendTimer(30);
      setShowResendButton(false);
    } catch (error) {
      console.error("Send OTP error:", error);
      setFieldError("general", "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsResendLoading(true);
    setShowResendButton(false);
    setResendTimer(30);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
    } catch (error) {
      console.error("Resend OTP error:", error);
    } finally {
      setIsResendLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (values: ForgotPasswordFormValues, { setFieldError }: any) => {
    setIsLoading(true);
    setIsAuthenticationFailed(false);

    try {
      if (values.step === "send_otp") {
        // Simulate sending OTP - always succeeds for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setOtpSent(true);
        setResendTimer(30);
        setShowResendButton(false);
        return { step: "verify_otp" };
      } else if (values.step === "verify_otp") {
        if (validateOtp(values.otp)) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIsAuthenticationFailed(false);
          return { step: "reset_password" };
        } else {
          setIsAuthenticationFailed(true);
        }
      } else if (values.step === "reset_password") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setCurrentScreen("login_form");
        setOtpSent(false);
        setForgotPasswordOtp(["", "", "", "", "", ""]);
        return { success: true };
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setFieldError("general", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change - like AadharVerification
  const handleOtpChange = (text: string, index: number, setFieldValue: any, isLogin: boolean = true) => {
    if (text.length > 1) return;

    const currentOtp = isLogin ? otp : forgotPasswordOtp;
    const setOtpState = isLogin ? setOtp : setForgotPasswordOtp;
    const inputRefs = isLogin ? otpInputRefs : forgotPasswordOtpInputRefs;

    const newOtp = [...currentOtp];
    newOtp[index] = text;
    setOtpState(newOtp);

    setFieldValue("otp", newOtp.join(""));

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
    
    return (
      <View style={styles.otpContainer}>
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
        mode: "password" as LoginModeType,
        method: loginMethod, // Add method for validation context
      }}
      validationSchema={loginValidationSchema}
      enableReinitialize={true} // This will update form when loginMethod changes
      onSubmit={handleLogin}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldError, validateField, setFieldTouched }: FormikProps<LoginFormValues>) => (
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
                onChangeText={handleChange("loginField")}
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
                  onChangeText={handleChange("password")}
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
                    onPress={() => handleSendOtp(values, { setFieldError, setFieldTouched, validateField })}
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
                    onPress={() => handleSendOtp(values, { setFieldError, setFieldTouched, validateField })}
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
                    setFieldValue("mode", values.mode === "password" ? "otp" : "password");
                    setOtpSent(false);
                    setResendTimer(30);
                    setShowResendButton(false);
                    setOtp(["", "", "", "", "", ""]);
                    setFieldValue("otp", "");
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
                    setOtp(["", "", "", "", "", ""]);
                    setOtpSent(false);
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
          {errors.general && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={styles.errorText}>{errors.general}</Text>
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
      )}
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
      onSubmit={async (values, { setFieldError, setFieldValue, validateForm }) => {
        // Manually validate the form before submission
        const errors = await validateForm(values);
        
        // Check if there are any validation errors for the current step
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
          return; // Stop submission if there are validation errors
        }
        
        const result = await handleForgotPassword(values, { setFieldError });
        if (result?.step) {
          setFieldValue("step", result.step);
        }
        if (result?.success) {
          // Reset form and go back to login
          setFieldValue("loginField", "");
          setFieldValue("otp", "");
          setFieldValue("newPassword", "");
          setFieldValue("confirmPassword", "");
          setFieldValue("step", "send_otp");
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }: FormikProps<ForgotPasswordFormValues>) => (
        <View style={styles.formContainer}>
          <Text style={styles.forgotTitle}>Reset Password</Text>
          
          {values.step === "send_otp" && (
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
                onChangeText={handleChange("loginField")}
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

          {values.step === "verify_otp" && (
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

          {values.step === "reset_password" && (
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
                  onChangeText={handleChange("newPassword")}
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
                  onChangeText={handleChange("confirmPassword")}
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
          {colorScheme === "light" ? (
            <Pressable
              onPress={() => handleSubmit()}
              onPressIn={() => setForgotPasswordButtonPressed(true)}
              onPressOut={() => setForgotPasswordButtonPressed(false)}
              disabled={isLoading}
            >
              <LinearGradient
                colors={
                  forgotPasswordButtonPressed
                    ? ["#1691A8", "#083A73"]
                    : ["#1CA8C9", "#0A4C8B"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Processing..." : 
                    values.step === "send_otp" ? "Send OTP" :
                    values.step === "verify_otp" ? "Verify OTP" :
                    "Reset Password"
                  }
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
                {isLoading ? "Processing..." : 
                  values.step === "send_otp" ? "Send OTP" :
                  values.step === "verify_otp" ? "Verify OTP" :
                  "Reset Password"
                }
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Links for Forgot Password */}
          <View style={styles.actionLinksContainer}>
            <View style={styles.actionLinksRow}>
              {/* Back to Login */}
              <TouchableOpacity
                style={styles.actionLinkButton}
                onPress={() => {
                  setCurrentScreen("login_form");
                  setForgotPasswordOtp(["", "", "", "", "", ""]);
                  setOtpSent(false);
                  setIsAuthenticationFailed(false);
                }}
              >
                <Text style={styles.actionLinkText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Resend OTP - Only show in verify_otp step when OTP is sent */}
              {values.step === "verify_otp" && otpSent && (
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
          {errors.general && (
            <View style={styles.statusContainer}>
              <View style={styles.errorStatus}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <Text style={styles.errorText}>{errors.general}</Text>
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
      )}
    </Formik>
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


      </Animated.View>
    </ImageBackground>
  );
}