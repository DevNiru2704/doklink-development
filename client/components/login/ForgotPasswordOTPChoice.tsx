import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LoginComponentProps, DeliveryMethodType } from "../../utils/login/types";
import { authService } from "@/services/authService";

export default function ForgotPasswordOTPChoice(props: LoginComponentProps) {
  const {
    colorScheme,
    styles,
    setCurrentScreen,
    isLoading,
    setIsLoading,
    setOtpSent,
    setResendTimer,
    setShowResendButton,
    usernameOTPOptions,
    setUsernameOTPOptions,
    selectedDeliveryMethod,
    setSelectedDeliveryMethod,
    isLoadingOTPOptions,
    currentUsername,
    setForgotPasswordStep
  } = props;

  const [loginButtonPressed, setLoginButtonPressed] = useState(false);

  // Handle send forgot password OTP after delivery method selection for username
  const handleSendForgotPasswordOtpWithDeliveryMethod = async (deliveryMethod: DeliveryMethodType) => {
    setIsLoading(true);

    try {
      await authService.sendForgotPasswordOTP({
        login_field: currentUsername.trim(),
        login_method: "username",
        delivery_method: deliveryMethod
      });
      
      setOtpSent(true);
      setResendTimer(30);
      setShowResendButton(false);
      setForgotPasswordStep("verify_otp");
      setCurrentScreen("forgot_password");
      
    } catch (error: any) {
      console.error("Send forgot password OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                onPress={() => handleSendForgotPasswordOtpWithDeliveryMethod(selectedDeliveryMethod)}
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
                onPress={() => handleSendForgotPasswordOtpWithDeliveryMethod(selectedDeliveryMethod)}
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
}