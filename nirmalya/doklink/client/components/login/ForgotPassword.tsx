import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik, FormikProps } from "formik";
import { LoginComponentProps, ForgotPasswordFormValues } from "../../utils/login/types";
import { forgotPasswordValidationSchema } from "../../utils/login/validation";
import { authService } from "@/services/authService";
import OTPInputs from "./OTPInputs";

export default function ForgotPassword(props: LoginComponentProps) {
  const {
    colorScheme,
    styles,
    loginMethod,
    setCurrentScreen,
    isLoading,
    setIsLoading,
    isResendLoading,
    setIsResendLoading,
    isVerified,
    countdown,
    otpSent,
    setOtpSent,
    resendTimer,
    setResendTimer,
    showResendButton,
    setShowResendButton,
    forgotPasswordOtp,
    setForgotPasswordOtp,
    usernameOTPOptions,
    setUsernameOTPOptions,
    selectedDeliveryMethod,
    setSelectedDeliveryMethod,
    currentUsername,
    setCurrentUsername,
    forgotPasswordStep,
    setForgotPasswordStep,
    resetToken,
    setResetToken
  } = props;

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordButtonPressed, setForgotPasswordButtonPressed] = useState(false);

  const forgotPasswordOtpInputRefs = useRef<(TextInput | null)[]>([]);

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

  // Handle forgot password with real backend
  const handleForgotPassword = async (values: ForgotPasswordFormValues, { setStatus }: any) => {
    setIsLoading(true);
    console.log("handleForgotPassword called", { values, forgotPasswordStep, loginMethod });
    try {
      if (forgotPasswordStep === "send_otp") {
        console.log("Forgot password step: send_otp");
        // For username, navigate to delivery method selection screen
        if (loginMethod === "username") {
          try {
            console.log("Getting username OTP options", values.loginField.trim().toLowerCase());
            const response = await authService.getUsernameOTPOptions(values.loginField.trim().toLowerCase());
            setUsernameOTPOptions(response.options);
            setCurrentUsername(values.loginField.trim().toLowerCase());
            setCurrentScreen("forgot_password_otp_choice");
            setIsLoading(false);
            return;
          } catch (error: any) {
            setStatus({
              type: 'error',
              message: error.message || "Failed to get delivery options for username"
            });
            setIsLoading(false);
            return;
          }
        }

        // Send forgot password OTP through backend for phone/email
        console.log("Sending forgot password OTP", {
          login_field: values.loginField.trim(),
          login_method: loginMethod,
          delivery_method: selectedDeliveryMethod || 'auto'
        });
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
        console.log("Forgot password step: verify_otp");
        // Always use currentUsername for username logins in verify_otp step, and lowercase it
        let loginFieldToUse = values.loginField.trim();
        if (loginMethod === 'username') {
          loginFieldToUse = currentUsername.toLowerCase();
        }
        const payload = {
          login_field: loginFieldToUse,
          login_method: loginMethod,
          otp_code: values.otp
        };
        console.log("Forgot password verify_otp payload", payload);
        // Verify OTP and get reset token
        const response = await authService.verifyForgotPasswordOTP(payload);
        // Store reset token for password reset step
        setResetToken(response.reset_token);
        setForgotPasswordStep("reset_password");
        return;

      } else if (forgotPasswordStep === "reset_password") {
        console.log("Forgot password step: reset_password");
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
      // Show backend error message if available
      let backendMessage = error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";
      setStatus({
        type: 'error',
        message: backendMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP for forgot password flow
  const handleResendForgotPasswordOtp = async () => {
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
            throw new Error("Please select a delivery method for username forgot password.");
          }
        }
        if (deliveryMethod !== "email" && deliveryMethod !== "sms" && deliveryMethod !== "phone") {
          throw new Error("Invalid delivery method for username forgot password.");
        }
      }
      // Use currentUsername for forgot password flow
      const otpPayload = {
        login_field: currentUsername,
        login_method: loginMethod,
        ...(loginMethod === "username" && deliveryMethod && (deliveryMethod === "email" || deliveryMethod === "sms")
          ? { delivery_method: deliveryMethod }
          : {})
      };
      await authService.sendForgotPasswordOTP(otpPayload);
      setOtpSent(true);
      setResendTimer(30);
    } catch (error) {
      console.error("Resend Forgot Password OTP error:", error);
    } finally {
      setIsResendLoading(false);
    }
  };

  return (
    <Formik
      initialValues={{
        loginField: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
        step: forgotPasswordStep,
        method: loginMethod,
      }}
      enableReinitialize={true}
      validationSchema={forgotPasswordValidationSchema}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, { setStatus, setFieldValue, validateForm }) => {
        // Manually validate the form before submission
        const errors = await validateForm(values);
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
          return;
        }
        // Always use the latest step and method from state
        await handleForgotPassword({ ...values, step: forgotPasswordStep, method: loginMethod }, { setStatus });
      }}
    >
      {({ values, errors, touched, status, handleChange, handleBlur, handleSubmit, setFieldValue, setStatus }: FormikProps<ForgotPasswordFormValues>) => {
        
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
                  {loginMethod === "username"
                    ? selectedDeliveryMethod === "email"
                      ? "OTP sent! Please check your email"
                      : selectedDeliveryMethod === "sms" || selectedDeliveryMethod === "phone"
                        ? "OTP sent! Please check your sms!"
                        : "OTP sent! Please check your phone/email"
                    : `OTP sent! Please check your ${loginMethod}`}
                </Text>
                <OTPInputs
                  otp={forgotPasswordOtp}
                  setOtp={setForgotPasswordOtp}
                  setFieldValue={setFieldValue}
                  touched={touched}
                  errors={errors}
                  isVerified={isVerified}
                  styles={styles}
                  inputRefs={forgotPasswordOtpInputRefs}
                  isLogin={false}
                />
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
                      onPress={handleResendForgotPasswordOtp}
                      disabled={isResendLoading}
                    >
                      <Text style={styles.actionLinkText}>
                        {isResendLoading ? "Sending..." : "Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.actionLinkButton}>
                      <Text style={[styles.actionLinkText, { textDecorationLine: 'none' }]}>
                        {`Resend Code (${resendTimer})`}
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
}