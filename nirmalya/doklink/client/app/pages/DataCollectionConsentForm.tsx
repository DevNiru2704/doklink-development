//DataCollectionConsentForm.tsx

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import LogoSVGDark from "../../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../../assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "../../assets/images/light_background.png";
import NetworkBackgroundImage from "../../assets/images/network_background.png";
import useThemedStyles from "../../styles/AgreementStyles";

interface DataCollectionConsentFormProps {
  onBack: () => void;
}

export default function DataCollectionConsentForm({
  onBack,
}: DataCollectionConsentFormProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  const handleContactPress = async () => {
    const email = "privacy@doklink.in";
    const subject = "Data Collection Consent Inquiry";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening email client:", error);
    }
  };

  useEffect(() => {
    if (colorScheme === 'dark') {
      // Use full animations for dark mode
      Animated.parallel([
        Animated.timing(fadeInAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideInAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Set to final values immediately for light mode to avoid gradient artifacts
      fadeInAnimation.setValue(1);
      slideInAnimation.setValue(0);
    }
  }, [fadeInAnimation, slideInAnimation, colorScheme]);

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

      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.5)",
          "rgba(2, 10, 14, 0.8)",
          "rgba(0, 0, 0, 0.9)",
        ]}
        style={styles.gradientOverlay}
      />

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          colorScheme === 'dark' ? {
            opacity: fadeInAnimation,
            transform: [{ translateY: slideInAnimation }],
          } : {}
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              {colorScheme === "dark" ? (
                <LogoSVGDark width={100} height={100} />
              ) : (
                <LogoSVGLight width={100} height={100} />
              )}
            </View>
            <Text style={styles.headerTitle}>DATA COLLECTION CONSENT FORM</Text>
            <Text style={styles.headerSubtitle}>
              Personal Health Data Agreement
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Main Consent Document */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionTitle}>
              Consent to Collect, Use & Share Personal Health Data
            </Text>

            <Text style={styles.paragraphText}>
              By continuing, I confirm that I have read, understood, and agree
              to the following:
            </Text>

            {/* Section 1: Data Collected */}
            <View style={styles.sectionContent}>
              <Text style={styles.sectionNumber}>1. Data Collected:</Text>
              <Text style={styles.paragraphText}>
                I authorize <Text style={styles.highlightText}>DokLink</Text> to
                collect and securely store my:
              </Text>
              <View style={styles.dataList}>
                <Text style={styles.dataListItem}>
                  • Name, contact details, Aadhaar number (masked), and ABHA ID
                </Text>
                <Text style={styles.dataListItem}>
                  • Health data (medical reports, prescriptions, diagnosis,
                  allergies)
                </Text>
                <Text style={styles.dataListItem}>
                  • Insurance details (policy number, insurer, TPA information)
                </Text>
                <Text style={styles.dataListItem}>
                  • Emergency contact and real-time location (during emergencies
                  only)
                </Text>
              </View>
            </View>

            {/* Section 2: Purpose of Use */}
            <View style={styles.sectionContent}>
              <Text style={styles.sectionNumber}>2. Purpose of Use:</Text>
              <Text style={styles.paragraphText}>
                This data will be used to:
              </Text>
              <View style={styles.dataList}>
                <Text style={styles.dataListItem}>
                  • Help me find available hospital beds in real-time
                </Text>
                <Text style={styles.dataListItem}>
                  • Facilitate hospital admission and discharge
                </Text>
                <Text style={styles.dataListItem}>
                  • Coordinate with insurance companies and TPAs
                </Text>
                <Text style={styles.dataListItem}>
                  • Provide AI-powered emergency recommendations
                </Text>
              </View>
            </View>

            {/* Section 3: Data Sharing */}
            <View style={styles.sectionContent}>
              <Text style={styles.sectionNumber}>3. Data Sharing:</Text>
              <Text style={styles.paragraphText}>
                I authorize <Text style={styles.highlightText}>DokLink</Text> to
                securely share my data with:
              </Text>
              <View style={styles.dataList}>
                <Text style={styles.dataListItem}>
                  • Partner hospitals and doctors for treatment
                </Text>
                <Text style={styles.dataListItem}>
                  • Insurance providers for claim processing
                </Text>
                <Text style={styles.dataListItem}>
                  • Government-authorized health platforms (like NDHM/ABHA), if
                  opted in
                </Text>
              </View>
            </View>

            {/* Section 4: My Rights */}
            <View style={styles.sectionContent}>
              <Text style={styles.sectionNumber}>4. My Rights:</Text>
              <View style={styles.rightsCard}>
                <Text style={styles.rightItem}>
                  • I can access, edit, or delete my data from my account
                  settings
                </Text>
                <Text style={styles.rightItem}>
                  • I can withdraw this consent at any time
                </Text>
                <Text style={styles.rightItem}>
                  • I can contact the Grievance Officer for complaints or
                  questions
                </Text>
              </View>
            </View>

            {/* Section 5: Data Security */}
            <View style={styles.sectionContent}>
              <Text style={styles.sectionNumber}>5. Data Security:</Text>
              <Text style={styles.paragraphText}>
                My data will be stored securely using industry-standard
                encryption and access controls.
              </Text>
            </View>

            <View style={styles.importantNotice}>
              <Text style={styles.importantText}>
                IMPORTANT: This consent is voluntary and can be withdrawn at any
                time through your account settings. However, withdrawing your
                consent will result in the immediate discontinuation of all
                services outlined in the &apos;Purpose of Use&apos; and
                &apos;Data Sharing&apos; sections.
              </Text>
            </View>
          </View>

          {/* Consent Action Section */}
          <View style={styles.consentSection}>
            <Text style={styles.consentTitle}>Your Consent Decision</Text>
            <Text style={styles.paragraphText}>
              By checking &quot;I agree to Data Collection Consent Form&quot; in
              the Sign Up page, you consent to the collection, use, and sharing
              of your data as described above.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Questions or Concerns?</Text>
            <Text style={styles.contactText}>
              Contact our Grievance Officer at{" "}
              <TouchableOpacity onPress={handleContactPress}>
                <Text style={styles.emailText}>privacy@doklink.in</Text>
              </TouchableOpacity>
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}
