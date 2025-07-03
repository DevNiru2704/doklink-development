//AadhaarVerification.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
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
    useColorScheme,
} from "react-native";
import * as Yup from "yup";

import AadhaarLogoSVG from "../assets/images/aadhaar_logo.svg";
import AadhaarLogoSVGLight from "../assets/images/aadhaar_logo_light.svg";
import NetworkBackgroundImageLight from "../assets/images/light_background.png";
import NetworkBackgroundImage from "../assets/images/network_background.png";
import useThemedStyles from "../styles/AadharVerification";

interface AadhaarVerificationProps {
  onBack: () => void;
  onProceed: (aadhaarNumber: string) => void;
  onLogin: () => void;
}

export default function AadhaarVerification({
  onBack,
  onProceed,
  onLogin,
}: AadhaarVerificationProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const [button1Pressed, setButton1Pressed] = useState(false);
  const [button2Pressed, setButton2Pressed] = useState(false);
  const [aadhaarId, setAadhaarId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthenticationFailed, setIsAuthenticationFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  //For animation
  useEffect(() => {
    if (colorScheme === "dark") {
      // Use full animations for dark mode
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
      // Set to final values immediately for light mode to avoid gradient artifacts
      fadeInAnimation.setValue(1);
      slideInAnimation.setValue(0);
    }
  }, [fadeInAnimation, slideInAnimation, colorScheme]);

  const handleAadhaarSubmit = (values: any) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
      setIsAuthenticationFailed(false);
    }, 2000);
  };

  const handleOtpSubmit = (values: any) => {
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      // Simulate success/failure (you can modify this logic)
      if (values.otp === "123456") {
        setIsVerified(true);
        setIsAuthenticationFailed(false);
      } else {
        setIsVerified(false);
        setIsAuthenticationFailed(true);
      }
    }, 2000);
  };

  const handleOtpChange = (text: string, index: number, setFieldValue: any) => {
    if (text.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    setFieldValue("otp", newOtp.join(""));

    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const resetForm = () => {
    setAadhaarId("");
    setOtp(["", "", "", "", "", ""]);
    setIsOtpSent(false);
    setIsVerified(false);
    setIsAuthenticationFailed(false);
  };

  // Initial values
  const aadhaarInitialValues = { aadhaarNumber: "" };

  // Validation schemas
  const aadhaarValidationSchema = Yup.object().shape({
    aadhaarNumber: Yup.string()
      .required("Aadhaar number is required")
      .test(
        "starts-with-valid",
        "Aadhaar must not start with 0 or 1",
        (value) => {
          return value ? /^[2-9]/.test(value) : false;
        }
      )
      .test("valid-format", "Aadhaar must be exactly 12 digits", (value) => {
        return value ? /^[2-9][0-9]{11}$/.test(value) : false;
      }),
  });

  const otpValidationSchema = Yup.object().shape({
    otp: Yup.string()
      .required("OTP is required")
      .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
  });

  return (
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        </View>

        {/* Aadhaar Logo */}

        <View style={styles.logoContainer}>
          {colorScheme === "dark" ? (
            <AadhaarLogoSVG width={270} height={230} />
          ) : (
            <AadhaarLogoSVGLight width={270} height={230} />
          )}
        </View>

        {!isOtpSent ? (
          /* Aadhaar ID Input */
          <Formik
            initialValues={aadhaarInitialValues}
            validationSchema={aadhaarValidationSchema}
            onSubmit={handleAadhaarSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
            }) => (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Enter your Aadhaar number</Text>
                <TextInput
                  style={[
                    styles.aadhaarInput,
                    errors.aadhaarNumber &&
                      touched.aadhaarNumber &&
                      styles.errorInput,
                  ]}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor="#6B7280"
                  value={values.aadhaarNumber}
                  onChangeText={(text) => {
                    handleChange("aadhaarNumber")(text);
                    setAadhaarId(text);
                  }}
                  onBlur={handleBlur("aadhaarNumber")}
                  keyboardType="numeric"
                  maxLength={12}
                  autoFocus
                />
                {errors.aadhaarNumber && touched.aadhaarNumber && (
                  <Text style={styles.errorText}>{errors.aadhaarNumber}</Text>
                )}

                {/* Submit button */}
                {colorScheme === "light" ? (
                  <Pressable
                    onPress={() => handleSubmit()}
                    disabled={isLoading}
                    onPressIn={() => setButton1Pressed(true)}
                    onPressOut={() => setButton1Pressed(false)}
                  >
                    <LinearGradient
                      colors={
                        button1Pressed
                          ? ["#1691A8", "#083A73"]
                          : ["#1CA8C9", "#0A4C8B"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.submitButton,
                        isLoading && styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.submitButtonText}>
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={isLoading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Formik>
        ) : (
          /* OTP Input Section */
          <Formik
            initialValues={{ otp: otp.join("") }}
            validationSchema={otpValidationSchema}
            enableReinitialize={true}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={async (values, { setFieldError, setFieldTouched, validateForm, setTouched }) => {
              // Mark all fields as touched to show validation errors
              setTouched({ otp: true });
              
              // Manually validate the form before submission
              const errors = await validateForm(values);
              
              // Check if there are any validation errors
              const hasErrors = Object.keys(errors).length > 0;
              if (hasErrors) {
                return; // Stop submission if there are validation errors
              }
              
              handleOtpSubmit(values);
            }}
          >
            {({ values, errors, touched, setFieldValue, handleSubmit, setFieldTouched }) => (
              <View style={styles.otpSection}>
                <Text style={styles.otpLabel}>
                  OTP sent to registered phone number
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        isVerified && styles.otpInputDimmed,
                        errors.otp && touched.otp && styles.errorInput,
                      ]}
                      value={digit}
                      onChangeText={(text) =>
                        handleOtpChange(text, index, setFieldValue)
                      }
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      editable={!isVerified}
                    />
                  ))}
                </View>
                {errors.otp && touched.otp && (
                  <Text style={styles.errorText}>{errors.otp}</Text>
                )}

                {/* Submit button */}
                {colorScheme === "light" ? (
                  <Pressable
                    onPress={
                      isVerified
                        ? () => onProceed(aadhaarId)
                        : () => handleSubmit()
                    }
                    disabled={isLoading}
                    onPressIn={() => setButton2Pressed(true)}
                    onPressOut={() => setButton2Pressed(false)}
                  >
                    <LinearGradient
                      colors={
                        button2Pressed
                          ? ["#1691A8", "#083A73"]
                          : ["#1CA8C9", "#0A4C8B"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.submitButton,
                        isLoading && styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.submitButtonText}>
                        {isLoading
                          ? "Verifying..."
                          : isVerified
                          ? "Proceed"
                          : "Verify OTP"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={
                      isVerified
                        ? () => onProceed(aadhaarId)
                        : () => handleSubmit()
                    }
                    disabled={isLoading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading
                        ? "Verifying..."
                        : isVerified
                        ? "Proceed"
                        : "Verify OTP"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Status Messages */}
                {isVerified && (
                  <Animated.View style={styles.statusContainer}>
                    <View style={styles.successStatus}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <Text style={styles.successText}>Verified successfully</Text>
                    </View>
                  </Animated.View>
                )}

                {isAuthenticationFailed && (
                  <Animated.View style={styles.statusContainer}>
                    <View style={styles.errorStatus}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                      <Text style={[styles.errorText, { marginLeft: 8, marginTop: 0 }]}>
                        Authentication not verified
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.retryButton} onPress={resetForm}>
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            )}
          </Formik>
        )}

        {/* Login Link */}
        <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
}
