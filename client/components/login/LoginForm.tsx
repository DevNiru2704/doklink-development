import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik, FormikProps } from "formik";
import { LoginComponentProps, LoginFormValues } from "../../utils/login/types";
import { loginValidationSchema } from "../../utils/login/validation";
import { authService } from "@/services/authService";
import OTPInputs from "./OTPInputs";

export default function LoginForm(props: LoginComponentProps) {
  const {
    colorScheme,
    styles,
    loginMethod,
    loginMode,
    setLoginMode,
    setCurrentScreen,
    isLoading,
    setIsLoading,
    isResendLoading,
    setIsResendLoading,
    isVerified,
    setIsVerified,
    countdown,
    otpSent,
    setOtpSent,
    resendTimer,
    setResendTimer,
    showResendButton,
    setShowResendButton,
    otp,
    setOtp,
    usernameOTPOptions,
    setUsernameOTPOptions,
    selectedDeliveryMethod,
    setSelectedDeliveryMethod,
    setCurrentUsername,
    setForgotPasswordStep,
    currentLoginField,
    setCurrentLoginField,
    clearOtpData,
    onSignUp
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const [loginButtonPressed, setLoginButtonPressed] = useState(false);
  const [sendOtpButtonPressed, setSendOtpButtonPressed] = useState(false);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const getPlaceholderText = (method: string): string => {
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

  const getKeyboardType = (method: string) => {
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
    console.log("handleLogin called", values);

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
        let loginFieldToUse = values.loginField.trim();
        // If username login and OTP sent, use currentLoginField (input is hidden)
        if (loginMethod === 'username' && otpSent && !loginFieldToUse) {
          loginFieldToUse = currentLoginField;
        }
        console.log("Verifying OTP", { loginFieldToUse, otp: values.otp });
        const otpData = {
          login_field: loginFieldToUse,
          login_method: loginMethod,
          otp_code: values.otp
        };
        await authService.verifyLoginOTP(otpData);
      }

      // Login successful
      setIsVerified(true);

    } catch (error: any) {
      console.error("Login error:", error);
      setIsVerified(false);

      // Set error message for display in form
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
    setIsLoading(true);
    
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
      setIsLoading(false);
    }
  };

  // Handle send OTP with real backend
  const handleSendOtp = async (values: LoginFormValues, { setStatus, setFieldTouched, validateField }: any) => {
    // First validate the login field before sending OTP
    setFieldTouched("loginField", true);
    
    // Trigger Formik validation first
    const validationResult = await validateField("loginField");
    if (validationResult) {
      return;
    }

    // For username login with OTP mode, first get delivery options
    if (loginMethod === "username" && values.mode === "otp") {
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Getting ready...' });
      await handleGetUsernameOTPOptions(values.loginField, { setStatus });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setStatus({ type: 'info', message: 'Getting ready...' });
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
      setResendTimer(30);
      setShowResendButton(false);
      setLoginMode("otp");
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
      let deliveryMethod = selectedDeliveryMethod;
      if (loginMethod === "username") {
        if (!deliveryMethod) {
          if (usernameOTPOptions.length > 0) {
            deliveryMethod = usernameOTPOptions[0].method;
            setSelectedDeliveryMethod(deliveryMethod);
          } else {
            throw new Error("Please select a delivery method for username login.");
          }
        }
        if (deliveryMethod !== "email" && deliveryMethod !== "sms" && deliveryMethod !== "phone") {
          throw new Error("Invalid delivery method for username login.");
        }
      }
      const otpPayload: any = {
        login_field: currentLoginField,
        login_method: loginMethod
      };
      if (loginMethod === "username" && deliveryMethod && (deliveryMethod === "email" || deliveryMethod === "sms")) {
        otpPayload.delivery_method = deliveryMethod;
      }
      await authService.sendLoginOTP(otpPayload);
      setOtpSent(true);
      setResendTimer(30);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
    } finally {
      setIsResendLoading(false);
    }
  };

  return (
    <Formik
      initialValues={{
        loginField: "",
        password: "",
        otp: "",
        mode: loginMode,
        method: loginMethod,
      }}
      validationSchema={loginValidationSchema}
      enableReinitialize={true}
      onSubmit={handleLogin}
    >
      {({ values, errors, touched, status, handleChange, handleBlur, handleSubmit, setFieldValue, setStatus, validateField, setFieldTouched }: FormikProps<LoginFormValues>) => {
        
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
                          {isLoading ? (status?.type === 'info' ? (status.message || 'Getting ready...') : 'Sending OTP...') : 'Send OTP'}
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
                        {isLoading ? (status?.type === 'info' ? (status.message || 'Getting ready...') : 'Sending OTP...') : 'Send OTP'}
                      </Text>
                    </TouchableOpacity>
                  )
                ) : (
                  /* OTP Input Section */
                  <>
                    <Text style={styles.otpLabel}>
                      {loginMethod === "username"
                        ? selectedDeliveryMethod === "email"
                          ? "OTP sent! Please check your email"
                          : selectedDeliveryMethod === "sms" || selectedDeliveryMethod === "phone"
                            ? "OTP sent! Please check your sms!"
                            : "OTP sent! Please check your phone/email"
                        : `OTP sent! Please check your ${loginMethod}`}
                    </Text>
                    <OTPInputs
                      otp={otp}
                      setOtp={setOtp}
                      setFieldValue={setFieldValue}
                      touched={touched}
                      errors={errors}
                      isVerified={isVerified}
                      styles={styles}
                      inputRefs={otpInputRefs}
                      isLogin={true}
                    />
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
                  onPress={() => {
                    console.log("Verify OTP button pressed", values);
                    handleSubmit();
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
                      {isLoading ? "Logging in..." : values.mode === "otp" ? "Verify OTP" : "Login"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                  onPress={() => {
                    console.log("Verify OTP button pressed", values);
                    handleSubmit();
                  }}
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
                <View style={styles.actionLinksRow}>
                  {/* Forgot Password - Only show in password mode */}
                  {values.mode === "password" && (
                    <TouchableOpacity
                      style={styles.actionLinkButton}
                      onPress={() => {
                        setCurrentScreen("forgot_password");
                        setForgotPasswordStep("send_otp");
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
                    }}
                  >
                    <Text style={styles.actionLinkText}>
                      {values.mode === "password" ? "Login with OTP" : "Login with Password"}
                    </Text>
                  </TouchableOpacity>

                  {/* Try Another Way */}
                  <TouchableOpacity
                    style={styles.actionLinkButton}
                    onPress={() => {
                      setCurrentScreen("method_selection");
                      setLoginMode("password");
                      clearOtpData();
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

                {/* Sign up link */}
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
}