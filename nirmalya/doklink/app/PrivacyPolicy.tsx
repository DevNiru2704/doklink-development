//PrivacyPolicy.tsx
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
import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "../assets/images/light_background.png";
import NetworkBackgroundImage from "../assets/images/network_background.png";
import useThemedStyles from "../styles/AgreementStyles";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

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

  const handleContactPress = async () => {
    const email = "privacy@doklink.in";
    const subject = "Privacy Policy Inquiry";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening email client:", error);
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
            <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
            <Text style={styles.headerSubtitle}>
              Data Protection & User Rights
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Section 1: What Data We Collect */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>1. What Data We Collect</Text>
            <Text style={styles.paragraphText}>
              <Text style={styles.highlightText}>DokLink</Text> collects the
              following information to provide you with seamless healthcare
              services:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • <Text style={styles.highlightText}>Aadhaar number</Text> (for
                identity verification)
              </Text>
              <Text style={styles.dataListItem}>
                • <Text style={styles.highlightText}>Health records</Text> (past
                and present conditions)
              </Text>
              <Text style={styles.dataListItem}>
                • <Text style={styles.highlightText}>Insurance details</Text>
              </Text>
              <Text style={styles.dataListItem}>
                •{" "}
                <Text style={styles.highlightText}>
                  Optional smartwatch data
                </Text>
              </Text>
              <Text style={styles.dataListItem}>
                •{" "}
                <Text style={styles.highlightText}>
                  Device info & app usage
                </Text>{" "}
                (for improvements)
              </Text>
            </View>
          </View>

          {/* Section 2: Why We Collect It */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>2. Why We Collect It</Text>
            <Text style={styles.paragraphText}>
              We use your data to enhance your healthcare experience:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Verify your identity quickly
              </Text>
              <Text style={styles.dataListItem}>
                • Help book hospital beds in emergencies
              </Text>
              <Text style={styles.dataListItem}>
                • Speed up insurance claims
              </Text>
              <Text style={styles.dataListItem}>
                • Generate AI-based health summaries
              </Text>
              <Text style={styles.dataListItem}>
                • Give better health insights (with your permission)
              </Text>
            </View>
          </View>

          {/* Section 3: Your Consent */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>3. Your Consent</Text>
            <Text style={styles.paragraphText}>
              We ask for your clear permission before:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Collecting Aadhaar and health data
              </Text>
              <Text style={styles.dataListItem}>
                • Syncing your smartwatch or wearable
              </Text>
              <Text style={styles.dataListItem}>
                • Sharing with hospitals or insurance partners
              </Text>
            </View>
            <View style={styles.importantNotice}>
              <Text style={styles.importantText}>
                You control what you share.
              </Text>
            </View>
          </View>

          {/* Section 4: How We Keep It Safe */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>4. How We Keep It Safe</Text>
            <Text style={styles.paragraphText}>
              Your data security is our top priority:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • <Text style={styles.highlightText}>Encrypted</Text> and stored
                securely
              </Text>
              <Text style={styles.dataListItem}>
                • Stored on{" "}
                <Text style={styles.highlightText}>Indian servers</Text>
              </Text>
              <Text style={styles.dataListItem}>
                • Managed as per the{" "}
                <Text style={styles.highlightText}>
                  DPDP Act 2023 & IT Act 2000
                </Text>
              </Text>
              <Text style={styles.dataListItem}>
                • Accessed only by authorized and trusted partners (hospitals,
                insurers)
              </Text>
            </View>
          </View>

          {/* Section 5: When We Share It */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>5. When We Share It</Text>
            <Text style={styles.paragraphText}>We only share your data:</Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • With hospitals for admissions
              </Text>
              <Text style={styles.dataListItem}>
                • With insurers for claim processing
              </Text>
              <Text style={styles.dataListItem}>
                • Through government-approved Aadhaar partners (if used)
              </Text>
            </View>
            <View style={styles.importantNotice}>
              <Text style={styles.importantText}>We never sell your data.</Text>
            </View>
          </View>

          {/* Section 6: Your Rights */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>6. Your Rights</Text>
            <Text style={styles.paragraphText}>
              You have complete control over your data:
            </Text>
            <View style={styles.rightsCard}>
              <Text style={styles.rightItem}>
                • <Text style={styles.highlightText}>Access</Text> your data
                anytime
              </Text>
              <Text style={styles.rightItem}>
                • <Text style={styles.highlightText}>Edit or correct</Text>{" "}
                mistakes
              </Text>
              <Text style={styles.rightItem}>
                • <Text style={styles.highlightText}>Delete</Text> your data (on
                request)
              </Text>
              <Text style={styles.rightItem}>
                • <Text style={styles.highlightText}>Withdraw consent</Text>{" "}
                when you want
              </Text>
            </View>
          </View>

          {/* Section 7: Contact Us */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>7. Contact Us</Text>
            <Text style={styles.paragraphText}>
              Questions or concerns about your privacy?
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Privacy Officer</Text>
              <Text style={styles.contactText}>
                <TouchableOpacity onPress={handleContactPress}>
                  <Text style={styles.emailText}>privacy@doklink.in</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>

          {/* Legal Notice */}
          <View style={styles.documentCard}>
            <Text style={styles.legalText}>
              By using DokLink, you agree to this Privacy Policy. This policy is
              governed by Indian data protection laws and regulations. We may
              update this policy from time to time, and any changes will be
              communicated to you through the app.
            </Text>
            <Text style={styles.legalText}>Last updated: January 2025</Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}
