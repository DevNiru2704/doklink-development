//SignUp.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import * as Yup from "yup";

import DefaultProfileImage from "@/assets/images/default.png";
import NetworkBackgroundImage from "@/assets/images/network_background.png";

import NetworkBackgroundImageLight from "@/assets/images/light_background.png";
import useThemedStyles from "@/styles/SignUp";

import DataCollectionConsentForm from "./DataCollectionConsentForm";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndCondition";

interface SignUpProps {
  onBack: () => void;
  onSignUp: () => void;
  onLogin: () => void;
  aadhaarNumber: string;
}


const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters"),
  
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  
  username: Yup.string()
    .required("Username is required")
    .test("starts-with-lowercase", "Username must start with a lowercase letter", (value) => {
      return value ? /^[a-z]/.test(value) : false;
    })
    .test("lowercase-digits-only", "Username can only contain lowercase letters and digits", (value) => {
      return value ? /^[a-z0-9]+$/.test(value) : false;
    }),
  
  password: Yup.string()
    .required("Password is required")
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
  
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref('password')], "Passwords do not match"),
  
  dob: Yup.string()
    .required("Date of birth is required")
    .test("valid-age", "Please give a valid date of birth", (value) => {
      if (!value) return false;
      
      const today = new Date();
      let birthDate: Date;
      
      // Detect date format and parse accordingly
      if (value.includes('/')) {
        // Check if it's DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
        const parts = value.split('/');
        
        if (parts.length !== 3) return false;
        
        const [first, second, third] = parts.map(p => parseInt(p, 10));
        
        // Check for invalid numbers
        if (isNaN(first) || isNaN(second) || isNaN(third)) return false;
        
        // Determine format based on values
        if (third > 31 && third > 12) {
          // Third part is year (YYYY/MM/DD or YYYY/DD/MM)
          if (second > 12) {
            // YYYY/DD/MM format
            birthDate = new Date(third, first - 1, second);
          } else {
            // YYYY/MM/DD format
            birthDate = new Date(third, second - 1, first);
          }
        } else if (first > 31 || (first > 12 && second <= 12)) {
          // First part is year (YYYY/MM/DD)
          birthDate = new Date(first, second - 1, third);
        } else if (first > 12 && second <= 12) {
          // DD/MM/YYYY format (most common)
          birthDate = new Date(third, second - 1, first);
        } else if (second > 12) {
          // MM/DD/YYYY format
          birthDate = new Date(third, first - 1, second);
        } else {
          // Ambiguous case, assume DD/MM/YYYY (common in many countries)
          birthDate = new Date(third, second - 1, first);
        }
      } else if (value.includes('-')) {
        // ISO format YYYY-MM-DD or variants
        const parts = value.split('-');
        if (parts.length !== 3) return false;
        
        const [first, second, third] = parts.map(p => parseInt(p, 10));
        
        if (isNaN(first) || isNaN(second) || isNaN(third)) return false;
        
        if (first > 31) {
          // YYYY-MM-DD format
          birthDate = new Date(first, second - 1, third);
        } else {
          // DD-MM-YYYY format
          birthDate = new Date(third, second - 1, first);
        }
      } else {
        // Try to parse as-is
        birthDate = new Date(value);
      }
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return false;
      
      // Check if birth date is not in the future
      if (birthDate >= today) return false;
      
      // Calculate age
      const age = today.getFullYear() - birthDate.getFullYear() - 
        ((today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);
      
      // Check reasonable age limits (0 to 120 years)
      return age >= 0 && age <= 120;
    }),
  
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .test("valid-phone", "Please enter a valid phone number", (value) => {
      return value ? /^[6-9][0-9]{9}$/.test(value) : false;
    }),
  
  permanentAddress: Yup.object().shape({
    address: Yup.string()
      .trim()
      .required("Permanent address is required"),
    state: Yup.string()
      .required("State is required")
      .notOneOf(["Select State"], "Please select a valid state"),
    city: Yup.string()
      .trim()
      .required("City is required"),
    pin: Yup.string()
      .required("PIN code is required")
      .test("valid-pin", "PIN code must be exactly 6 digits", (value) => {
        return value ? /^[1-9][0-9]{5}$/.test(value) : false;
      })
  }),
  
  currentAddress: Yup.object().shape({
    address: Yup.string().when('sameAsPermanent', {
      is: false,
      then: (schema) => schema.trim().required("Current address is required"),
      otherwise: (schema) => schema
    }),
    state: Yup.string().when('sameAsPermanent', {
      is: false,
      then: (schema) => schema.required("State is required").notOneOf(["Select State"], "Please select a valid state"),
      otherwise: (schema) => schema
    }),
    city: Yup.string().when('sameAsPermanent', {
      is: false,
      then: (schema) => schema.trim().required("City is required"),
      otherwise: (schema) => schema
    }),
    pin: Yup.string().when('sameAsPermanent', {
      is: false,
      then: (schema) => schema.required("PIN code is required").test("valid-pin", "PIN code must be exactly 6 digits", (value) => {
        return value ? /^[1-9][0-9]{5}$/.test(value) : false;
      }),
      otherwise: (schema) => schema
    })
  }),
  
  language: Yup.string().required("Preferred language is required"),
  
  agreements: Yup.object().shape({
    termsConditions: Yup.boolean().oneOf([true], "You must accept the Terms & Conditions"),
    privacyPolicy: Yup.boolean().oneOf([true], "You must accept the Privacy Policy"),
    dataConsent: Yup.boolean().oneOf([true], "You must give consent for data collection"),
    notifications: Yup.boolean()
  })
});

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

  // Indian states for dropdown
  const indianStates = [
    "Select State",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

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

  // Auto-fill username from email - will be handled in Formik
  const generateUsername = (email: string) => {
    return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Handle profile picture selection
  const handleSignUp = (values: any) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSignUp();
    }, 2000);
  };

  const selectProfilePicture = async (setFieldValue: (field: string, value: any) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to select a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFieldValue("profilePicture", { uri: result.assets[0].uri });
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
      validationSchema={validationSchema}
      onSubmit={handleSignUp}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
        // Auto-generate username when email changes
        const handleEmailChange = (text: string) => {
          handleChange("email")(text);
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
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.profilePictureContainer}
                onPress={() => selectProfilePicture(setFieldValue)}
                activeOpacity={0.7}
              >
                <Image
                  source={values.profilePicture}
                  style={styles.profilePicture}
                />
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={16} color="#E2E8F0" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileLabel}>Profile Picture</Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Name<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.name && touched.name && styles.errorInput
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#6B7280"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                />
                {errors.name && touched.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Email Address<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.email && touched.email && styles.errorInput
                  ]}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#6B7280"
                  value={values.email}
                  onChangeText={handleEmailChange}
                  onBlur={handleBlur("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && touched.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Username<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput, 
                    styles.disabledInput,
                    errors.username && touched.username && styles.errorInput
                  ]}
                  placeholder="Auto-generated from email"
                  placeholderTextColor="#6B7280"
                  value={values.username}
                  editable={false}
                />
                {errors.username && touched.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Aadhaar Number<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={aadhaarNumber}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Date of Birth<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.textInput, 
                    styles.dateInput,
                    errors.dob && touched.dob && styles.errorInput
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      !values.dob && styles.placeholderText,
                    ]}
                  >
                    {values.dob || "Select Date of Birth"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {errors.dob && touched.dob && (
                  <Text style={styles.errorText}>{errors.dob}</Text>
                )}
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => onDateChange(event, selectedDate, setFieldValue)}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Phone Number<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.phoneInput,
                      errors.phoneNumber && touched.phoneNumber && styles.errorInput
                    ]}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#6B7280"
                    value={values.phoneNumber}
                    onChangeText={handleChange("phoneNumber")}
                    onBlur={handleBlur("phoneNumber")}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                {errors.phoneNumber && touched.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Password<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.passwordInput,
                      errors.password && touched.password && styles.errorInput
                    ]}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#6B7280"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && touched.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Confirm Password<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.passwordInput,
                      errors.confirmPassword && touched.confirmPassword && styles.errorInput
                    ]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#6B7280"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && touched.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </View>

            {/* Address Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>

              <Text style={styles.subsectionTitle}>
                Permanent Address<Text style={styles.requiredAsterisk}> *</Text>
              </Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[
                    styles.textInput, 
                    styles.addressInput,
                    errors.permanentAddress?.address && touched.permanentAddress?.address && styles.errorInput
                  ]}
                  placeholder="Enter your permanent address"
                  placeholderTextColor="#6B7280"
                  value={values.permanentAddress.address}
                  onChangeText={handleChange("permanentAddress.address")}
                  onBlur={handleBlur("permanentAddress.address")}
                  multiline
                  numberOfLines={3}
                />
                {errors.permanentAddress?.address && touched.permanentAddress?.address && (
                  <Text style={styles.errorText}>{errors.permanentAddress.address}</Text>
                )}
              </View>

              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>
                    State<Text style={styles.requiredAsterisk}> *</Text>
                  </Text>
                  <View style={[
                    styles.pickerContainer,
                    errors.permanentAddress?.state && touched.permanentAddress?.state && styles.errorInput
                  ]}>
                    <Picker
                      selectedValue={values.permanentAddress.state}
                      style={styles.picker}
                      onValueChange={(value) => setFieldValue("permanentAddress.state", value)}
                      dropdownIconColor="#6B7280"
                    >
                      {indianStates.map((state, index) => (
                        <Picker.Item key={index} label={state} value={state} />
                      ))}
                    </Picker>
                  </View>
                  {errors.permanentAddress?.state && touched.permanentAddress?.state && (
                    <Text style={styles.errorText}>{errors.permanentAddress.state}</Text>
                  )}
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>
                    City<Text style={styles.requiredAsterisk}> *</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.permanentAddress?.city && touched.permanentAddress?.city && styles.errorInput
                    ]}
                    placeholder="Enter city"
                    placeholderTextColor="#6B7280"
                    value={values.permanentAddress.city}
                    onChangeText={handleChange("permanentAddress.city")}
                    onBlur={handleBlur("permanentAddress.city")}
                  />
                  {errors.permanentAddress?.city && touched.permanentAddress?.city && (
                    <Text style={styles.errorText}>{errors.permanentAddress.city}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  PIN Code<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.permanentAddress?.pin && touched.permanentAddress?.pin && styles.errorInput
                  ]}
                  placeholder="Enter PIN code"
                  placeholderTextColor="#6B7280"
                  value={values.permanentAddress.pin}
                  onChangeText={handleChange("permanentAddress.pin")}
                  onBlur={handleBlur("permanentAddress.pin")}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.permanentAddress?.pin && touched.permanentAddress?.pin && (
                  <Text style={styles.errorText}>{errors.permanentAddress.pin}</Text>
                )}
              </View>

              {/* Current Address */}
              <Text style={styles.subsectionTitle}>Current Address</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleSameAsPermament(!values.sameAsPermanent)}
              >
                <View
                  style={[
                    styles.checkbox,
                    values.sameAsPermanent && styles.checkedBox,
                  ]}
                >
                  {values.sameAsPermanent && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Same as permanent address
                </Text>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.addressInput,
                    values.sameAsPermanent && styles.disabledInput,
                    errors.currentAddress?.address && touched.currentAddress?.address && styles.errorInput
                  ]}
                  placeholder="Enter your current address"
                  placeholderTextColor="#6B7280"
                  value={values.currentAddress.address}
                  onChangeText={handleChange("currentAddress.address")}
                  onBlur={handleBlur("currentAddress.address")}
                  multiline
                  numberOfLines={3}
                  editable={!values.sameAsPermanent}
                />
                {errors.currentAddress?.address && touched.currentAddress?.address && (
                  <Text style={styles.errorText}>{errors.currentAddress.address}</Text>
                )}
              </View>

              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>State</Text>
                  <View
                    style={[
                      styles.pickerContainer,
                      values.sameAsPermanent && styles.disabledInput,
                      errors.currentAddress?.state && touched.currentAddress?.state && styles.errorInput
                    ]}
                  >
                    <Picker
                      selectedValue={values.currentAddress.state}
                      style={styles.picker}
                      onValueChange={(value) => setFieldValue("currentAddress.state", value)}
                      dropdownIconColor="#6B7280"
                      enabled={!values.sameAsPermanent}
                    >
                      {indianStates.map((state, index) => (
                        <Picker.Item key={index} label={state} value={state} />
                      ))}
                    </Picker>
                  </View>
                  {errors.currentAddress?.state && touched.currentAddress?.state && (
                    <Text style={styles.errorText}>{errors.currentAddress.state}</Text>
                  )}
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      values.sameAsPermanent && styles.disabledInput,
                      errors.currentAddress?.city && touched.currentAddress?.city && styles.errorInput
                    ]}
                    placeholder="Enter city"
                    placeholderTextColor="#6B7280"
                    value={values.currentAddress.city}
                    onChangeText={handleChange("currentAddress.city")}
                    onBlur={handleBlur("currentAddress.city")}
                    editable={!values.sameAsPermanent}
                  />
                  {errors.currentAddress?.city && touched.currentAddress?.city && (
                    <Text style={styles.errorText}>{errors.currentAddress.city}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    values.sameAsPermanent && styles.disabledInput,
                    errors.currentAddress?.pin && touched.currentAddress?.pin && styles.errorInput
                  ]}
                  placeholder="Enter PIN code"
                  placeholderTextColor="#6B7280"
                  value={values.currentAddress.pin}
                  onChangeText={handleChange("currentAddress.pin")}
                  onBlur={handleBlur("currentAddress.pin")}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!values.sameAsPermanent}
                />
                {errors.currentAddress?.pin && touched.currentAddress?.pin && (
                  <Text style={styles.errorText}>{errors.currentAddress.pin}</Text>
                )}
              </View>
            </View>

            {/* Miscellaneous */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Miscellaneous</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Preferred Language<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={[
                  styles.pickerContainer,
                  errors.language && touched.language && styles.errorInput
                ]}>
                  <Picker
                    selectedValue={values.language}
                    style={styles.picker}
                    onValueChange={(value) => setFieldValue("language", value)}
                    dropdownIconColor="#6B7280"
                  >
                    {languages.map((language, index) => (
                      <Picker.Item
                        key={index}
                        label={language}
                        value={language}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.language && touched.language && (
                  <Text style={styles.errorText}>{errors.language}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter referral code"
                  placeholderTextColor="#6B7280"
                  value={values.referralCode}
                  onChangeText={handleChange("referralCode")}
                  onBlur={handleBlur("referralCode")}
                />
              </View>
            </View>

            {/* Agreements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agreements</Text>

              {[
                {
                  key: "termsConditions",
                  label: "I agree to ",
                  linkText: "Terms & Conditions",
                  onPress: handleTermsPress,
                  required: true,
                },
                {
                  key: "privacyPolicy",
                  label: "I agree to ",
                  linkText: "Privacy Policy",
                  onPress: handlePrivacyPress,
                  required: true,
                },
                {
                  key: "dataConsent",
                  label: "I consent to ",
                  linkText: "Data Collection Consent Form",
                  onPress: handleConsentPress,
                  required: true,
                },
                {
                  key: "notifications",
                  label: "Send me notifications about offers and news",
                  required: false,
                },
              ].map((agreement) => (
                <View key={agreement.key}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setFieldValue(
                        `agreements.${agreement.key}`,
                        !values.agreements[agreement.key as keyof typeof values.agreements]
                      )
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        values.agreements[agreement.key as keyof typeof values.agreements] && styles.checkedBox,
                      ]}
                    >
                      {values.agreements[agreement.key as keyof typeof values.agreements] && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.checkboxTextContainer}>
                      <Text style={styles.checkboxLabel}>
                        {agreement.label}
                        {agreement.linkText && (
                          <Text
                            style={styles.linkText}
                            onPress={agreement.onPress}
                          >
                            {agreement.linkText}
                          </Text>
                        )}
                        {agreement.required && (
                          <Text style={styles.requiredAsterisk}> *</Text>
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {agreement.required && (
                    <>
                      {errors.agreements?.[agreement.key as keyof typeof errors.agreements] && 
                       touched.agreements?.[agreement.key as keyof typeof touched.agreements] && (
                        <Text style={styles.agreementErrorText}>
                          {errors.agreements[agreement.key as keyof typeof errors.agreements]}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* Sign Up Button */}
            {colorScheme === "light" ? (
              <Pressable
                onPress={() => handleSubmit()}
                disabled={isLoading}
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
                  style={[styles.signUpButton, isLoading && styles.disabledButton]}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.disabledButton]}
                onPress={() => handleSubmit()}
                disabled={isLoading}
              >
                <Text style={styles.signUpButtonText}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
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
