// app/pages/auth/SignUp.tsx - Refactored version
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";

import DefaultProfileImage from "@/assets/images/default.png";
import NetworkBackgroundImage from "@/assets/images/network_background.png";
import NetworkBackgroundImageLight from "@/assets/images/light_background.png";
import useThemedStyles from "@/styles/SignUp";

// Import page components
import DataCollectionConsentForm from "./DataCollectionConsentForm";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndCondition";

// Import signup components
import ProfilePictureSection from "@/components/signup/ProfilePictureSection";
import BasicInfoSection from "@/components/signup/BasicInfoSection";
import PersonalInfoSection from "@/components/signup/PersonalInfoSection";
import AddressSection from "@/components/signup/AddressSection";
import MiscellaneousSection from "@/components/signup/MiscellaneousSection";
import AgreementsSection from "@/components/signup/AgreementsSection";
import { signUpValidationSchema } from "@/components/signup/validation";

// Import API services
import { authService, INDIAN_STATES } from "@/services/authService";
import { cloudinaryService } from "@/services/cloudinaryService";

interface SignUpProps {
  onBack: () => void;
  onSignUp: () => void;
  onLogin: () => void;
  aadhaarNumber: string;
}

export default function SignUp({
  onBack,
  onSignUp,
  onLogin,
  aadhaarNumber,
}: SignUpProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentScreen, setCurrentScreen] = useState<
    "signup" | "terms" | "privacy" | "consent"
  >("signup");
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const [signUpButtonPressed, setSignUpButtonPressed] = useState(false);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage = colorScheme === 'dark' ? NetworkBackgroundImage : NetworkBackgroundImageLight;

  const initialValues = {
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    dob: "",
    phoneNumber: "",
    profilePicture: DefaultProfileImage,
    permanentAddress: {
      address: "",
      state: "Select State",
      city: "",
      pin: "",
    },
    currentAddress: {
      address: "",
      state: "Select State",
      city: "",
      pin: "",
    },
    sameAsPermanent: false,
    language: "English",
    referralCode: "",
    agreements: {
      termsConditions: false,
      privacyPolicy: false,
      dataConsent: false,
      notifications: false,
    },
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Indian states for dropdown (from API service)
  const indianStates = ["Select State", ...INDIAN_STATES];

  const languages = [
    "English",
    "Hindi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Marathi",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Punjabi",
  ];

  // Animation
  useEffect(() => {
    if (colorScheme === 'dark') {
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

  // Auto-fill username from email
  const generateUsername = (email: string) => {
    return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Handle form submission with real API call
  const handleSignUp = async (values: any, { setStatus, setSubmitting }: any) => {
    setStatus(null);
    setIsLoading(true);
    setSubmitting(true);
    
    try {
      const valuesWithAadhaar = {
        ...values,
        aadhaarNumber: aadhaarNumber
      };
      
      // Upload profile picture to Cloudinary if selected
      let profilePictureUrl = null;
      if (valuesWithAadhaar.profilePicture?.uri && valuesWithAadhaar.profilePicture.uri.startsWith('file://')) {
        setStatus({
          type: 'info',
          message: 'Uploading profile picture...'
        });
        
        try {
          profilePictureUrl = await cloudinaryService.uploadImage(
            valuesWithAadhaar.profilePicture.uri,
            valuesWithAadhaar.username
          );
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          setStatus({
            type: 'warning',
            message: 'Image upload failed, but continuing with signup...'
          });
        }
      }
      
      const finalValues = {
        ...valuesWithAadhaar,
        profilePicture: profilePictureUrl ? { url: profilePictureUrl } : null
      };
      
      setStatus({
        type: 'info',
        message: 'Creating your account...'
      });
      
      const signUpData = authService.transformSignUpData(finalValues);
      await authService.signUp(signUpData);
      
      onSignUp();
      
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || "Registration failed. Please try again."
      });
      console.error('SignUp Error:', error);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date, setFieldValue?: (field: string, value: any) => void) => {
    setShowDatePicker(false);
    if (selectedDate && setFieldValue) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString("en-GB");
      setFieldValue("dob", formattedDate);
    }
  };

  const handleTermsPress = () => setCurrentScreen("terms");
  const handlePrivacyPress = () => setCurrentScreen("privacy");
  const handleConsentPress = () => setCurrentScreen("consent");
  const handleBackToSignup = () => setCurrentScreen("signup");

  if (currentScreen === "terms") {
    return <TermsAndConditions onBack={handleBackToSignup} />;
  }

  if (currentScreen === "privacy") {
    return <PrivacyPolicy onBack={handleBackToSignup} />;
  }

  if (currentScreen === "consent") {
    return <DataCollectionConsentForm onBack={handleBackToSignup} />;
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={signUpValidationSchema}
      onSubmit={handleSignUp}
    >
      {({ values, errors, touched, status, handleChange, handleBlur, setFieldValue, setStatus, handleSubmit, isSubmitting }) => {
        // Auto-generate username when email changes
        const handleEmailChange = (text: string) => {
          handleChange("email")(text);
          if (status && status.type === 'error') {
            setStatus(null);
          }
          if (text.includes("@")) {
            const username = generateUsername(text);
            setFieldValue("username", username);
          }
        };

        // Handle same as permanent address
        const handleSameAsPermament = (value: boolean) => {
          setFieldValue("sameAsPermanent", value);
          if (value) {
            setFieldValue("currentAddress", values.permanentAddress);
          }
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
                colorScheme === 'dark' ? {
                  opacity: fadeInAnimation,
                  transform: [{ translateY: slideInAnimation }],
                } : {}
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
                <Text style={styles.headerTitle}>Create Account</Text>
              </View>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Profile Picture Section */}
                <ProfilePictureSection
                  values={values}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  setStatus={setStatus}
                />

                {/* Basic Information */}
                <BasicInfoSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowPassword={setShowPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  handleEmailChange={handleEmailChange}
                />

                {/* Personal Information */}
                <PersonalInfoSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  showDatePicker={showDatePicker}
                  selectedDate={selectedDate}
                  setShowDatePicker={setShowDatePicker}
                  onDateChange={onDateChange}
                  aadhaarNumber={aadhaarNumber}
                />

                {/* Address Information */}
                <AddressSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  indianStates={indianStates}
                  handleSameAsPermament={handleSameAsPermament}
                />

                {/* Miscellaneous */}
                <MiscellaneousSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  languages={languages}
                />

                {/* Agreements */}
                <AgreementsSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  colorScheme={colorScheme}
                  styles={styles}
                  handleTermsPress={handleTermsPress}
                  handlePrivacyPress={handlePrivacyPress}
                  handleConsentPress={handleConsentPress}
                />

                {/* Error Display */}
                {status && status.type === 'error' && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{status.message}</Text>
                  </View>
                )}

                {/* Sign Up Button */}
                {colorScheme === "light" ? (
                  <Pressable
                    onPress={() => handleSubmit()}
                    disabled={isLoading || isSubmitting}
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
                      style={[styles.signUpButton, (isLoading || isSubmitting) && styles.disabledButton]}
                    >
                      <Text style={styles.signUpButtonText}>
                        {(isLoading || isSubmitting) ? "Creating Account..." : "Sign Up"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={[styles.signUpButton, (isLoading || isSubmitting) && styles.disabledButton]}
                    onPress={() => handleSubmit()}
                    disabled={isLoading || isSubmitting}
                  >
                    <Text style={styles.signUpButtonText}>
                      {(isLoading || isSubmitting) ? "Creating Account..." : "Sign Up"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Login Link */}
                <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>
                    Already have an account? Login
                  </Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
              </ScrollView>
            </Animated.View>
          </ImageBackground>
        );
      }}
    </Formik>
  );
}
