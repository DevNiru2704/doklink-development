//TermsAndCondition.tsx
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
interface TermsAndConditionsProps {
  onBack: () => void;
}

export default function TermsAndConditions({
  onBack,
}: TermsAndConditionsProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  useEffect(() => {
    if (colorScheme === "dark") {
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
    const email = "legal@doklink.in";
    const subject = "Legal Inquiry - Terms and Conditions";
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
          colorScheme === "dark"
            ? {
                opacity: fadeInAnimation,
                transform: [{ translateY: slideInAnimation }],
              }
            : {},
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
            <Text style={styles.headerTitle}>TERMS & CONDITIONS</Text>
            <Text style={styles.headerSubtitle}>
              Service Agreement & User Guidelines
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Section 1: Introduction */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>1. Introduction</Text>
            <Text style={styles.paragraphText}>
              These Terms and Conditions (&quot;Terms&quot;) govern your use of
              the <Text style={styles.highlightText}>DokLink</Text> mobile
              application and associated services. By accessing or using the
              app, you agree to be bound by these Terms.
            </Text>
          </View>

          {/* Section 2: Scope of Service */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>2. Scope of Service</Text>
            <Text style={styles.paragraphText}>
              <Text style={styles.highlightText}>DokLink</Text> provides digital
              tools to:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Book hospital beds in emergencies or for planned admissions
              </Text>
              <Text style={styles.dataListItem}>
                • Facilitate and track health insurance claims
              </Text>
              <Text style={styles.dataListItem}>
                • Store and manage medical history
              </Text>
              <Text style={styles.dataListItem}>
                • Generate AI-powered health summaries based on user input
              </Text>
              <Text style={styles.dataListItem}>
                • Suggest potential hospital admission based on AI analysis
              </Text>
            </View>
            <View style={styles.importantNotice}>
              <Text style={styles.importantText}>
                DokLink does not offer direct medical treatment or emergency
                services.
              </Text>
            </View>
          </View>

          {/* Section 3: Use of AI & Health Summary */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>
              3. Use of AI & Health Summary
            </Text>
            <Text style={styles.paragraphText}>
              <Text style={styles.highlightText}>DokLink</Text> employs an AI
              model that:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Collects user symptoms and medical history
              </Text>
              <Text style={styles.dataListItem}>
                • Optionally integrates data from smartwatches and wearable
                devices
              </Text>
              <Text style={styles.dataListItem}>
                • Generates a personalized health summary and recommendation
              </Text>
            </View>
            <View style={styles.importantNotice}>
              <Text style={styles.importantText}>
                IMPORTANT: This output is intended as a health guidance tool
                only and is not a replacement for professional medical advice,
                diagnosis, or treatment. Always consult a certified doctor in
                case of serious symptoms.
              </Text>
            </View>
          </View>

          {/* Section 4: User Responsibilities */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>4. User Responsibilities</Text>
            <Text style={styles.paragraphText}>
              As a user of DokLink, you agree to:
            </Text>
            <View style={styles.rightsCard}>
              <Text style={styles.rightItem}>
                • Provide accurate and updated information
              </Text>
              <Text style={styles.rightItem}>
                • Use the app for lawful purposes only
              </Text>
              <Text style={styles.rightItem}>
                • Maintain confidentiality of login credentials
              </Text>
              <Text style={styles.rightItem}>
                • Acknowledge that all AI-driven insights are supplementary in
                nature
              </Text>
            </View>
          </View>

          {/* Section 5: Data Privacy and Consent */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>
              5. Data Privacy and Consent
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Your data is stored securely and processed in compliance with
                the <Text style={styles.highlightText}>DPDP Act 2023</Text> and{" "}
                <Text style={styles.highlightText}>IT Act 2000</Text>.
              </Text>
              <Text style={styles.dataListItem}>
                • We only collect health and identity data after your explicit
                consent.
              </Text>
              <Text style={styles.dataListItem}>
                • Smartwatch syncing is strictly optional and transparent.
              </Text>
            </View>
          </View>

          {/* Section 6: Limitation of Liability */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>6. Limitation of Liability</Text>
            <Text style={styles.paragraphText}>
              <Text style={styles.highlightText}>DokLink</Text> is not
              responsible for:
            </Text>
            <View style={styles.dataList}>
              <Text style={styles.dataListItem}>
                • Incorrect or incomplete data provided by the user
              </Text>
              <Text style={styles.dataListItem}>
                • Unavailability of hospital beds at partner hospitals
              </Text>
              <Text style={styles.dataListItem}>
                • Denial of insurance claims by third parties
              </Text>
              <Text style={styles.dataListItem}>
                • Any adverse medical outcomes based on AI recommendations
              </Text>
            </View>
          </View>

          {/* Section 7: Intellectual Property */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>7. Intellectual Property</Text>
            <Text style={styles.paragraphText}>
              All software, branding, and content on the{" "}
              <Text style={styles.highlightText}>DokLink</Text> app remain the
              exclusive property of the developers. Unauthorized reproduction or
              misuse is strictly prohibited.
            </Text>
          </View>

          {/* Section 8: Termination */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>8. Termination</Text>
            <Text style={styles.paragraphText}>
              We reserve the right to suspend or terminate user access for
              violating these terms or engaging in fraudulent behavior.
            </Text>
          </View>

          {/* Section 9: Governing Law and Jurisdiction */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>
              9. Governing Law and Jurisdiction
            </Text>
            <Text style={styles.paragraphText}>
              These terms are governed by the laws of{" "}
              <Text style={styles.highlightText}>India</Text>. Disputes shall be
              subject to the exclusive jurisdiction of the courts in{" "}
              <Text style={styles.highlightText}>Kolkata, West Bengal</Text>.
            </Text>
          </View>

          {/* Section 10: Contact */}
          <View style={styles.documentCard}>
            <Text style={styles.sectionNumber}>10. Contact</Text>
            <Text style={styles.paragraphText}>
              For legal or policy-related concerns:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Legal Department</Text>
              <TouchableOpacity onPress={handleContactPress}>
                <Text style={styles.emailText}>legal@doklink.in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Footer */}
          <View style={styles.documentCard}>
            <Text style={styles.legalText}>
              These Terms and Conditions constitute a legal agreement between
              you and DokLink. By using our services, you acknowledge that you
              have read, understood, and agree to be bound by these terms.
            </Text>
            <Text style={styles.legalText}>
              We may update these terms from time to time. Continued use of the
              app after changes constitutes acceptance of the new terms.
            </Text>
            <Text style={styles.legalText}>Last updated: January 2025</Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}
