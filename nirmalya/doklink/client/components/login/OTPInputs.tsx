import React from "react";
import { View, TextInput } from "react-native";

interface OTPInputsProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  setFieldValue: (field: string, value: any) => void;
  touched: any;
  errors: any;
  isVerified: boolean;
  styles: any;
  inputRefs: React.MutableRefObject<(TextInput | null)[]>;
  isLogin: boolean;
}

export default function OTPInputs({
  otp,
  setOtp,
  setFieldValue,
  touched,
  errors,
  isVerified,
  styles,
  inputRefs,
  isLogin
}: OTPInputsProps) {

  // Handle OTP input change
  const handleOtpChange = (text: string, index: number) => {
    // Only allow numeric input
    if (text && !/^\d$/.test(text)) return;
    
    if (text.length > 1) return; // Only allow single digit

    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Update Formik field with joined OTP
    const otpString = newOtp.join("");
    setFieldValue("otp", otpString);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when OTP is complete (optional UX improvement)
    if (otpString.length === 6 && isLogin) {
      console.log("OTP Complete:", otpString);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Apply different container styles based on context
  const containerStyle = isLogin 
    ? styles.otpContainer 
    : [styles.otpContainer, { 
        maxWidth: 360,
        position: "relative" as "relative",
        right: 10,
        paddingHorizontal: 0,
        marginHorizontal: 0
      }];

  return (
    <View style={containerStyle}>
      {otp.map((digit: string, index: number) => (
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
          onChangeText={(text) => handleOtpChange(text, index)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
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
}