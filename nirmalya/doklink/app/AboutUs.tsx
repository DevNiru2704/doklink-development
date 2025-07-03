//About.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import LogoSVGDark from "../assets/images/just_the_logo_dark.svg";
import NetworkBackgroundImage from "../assets/images/network_background.png";

import LogoSVGLight from "../assets/images/just_the_logo_light.svg";
import NetworkBackgroundImageLight from "../assets/images/light_background.png";
import useThemedStyles from "./styles/AboutUs";

interface AboutUsProps {
  onBack: () => void;
}

export default function AboutUs({ onBack }: AboutUsProps) {
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideInAnimation = useRef(new Animated.Value(50)).current;
  const [contactButtonPressed, setContactButtonPressed] = useState(false);
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  const handleContactPress = async () => {
    const url = "https://www.doklink.in";

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open the website");
      }
    } catch (error) {
      Alert.alert("Error", `Something went wrong!\n${error}`);
    }
  };

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

      {/* Enhanced Gradient Overlay */}
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.4)",
          "rgba(2, 10, 14, 0.7)",
          "rgba(0, 0, 0, 0.8)",
        ]}
        style={styles.gradientOverlay}
      />

      {/* Back Button */}
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
            {/* Logo Container */}
            <View style={styles.logoContainer}>
              {colorScheme === "dark" ? (
                <LogoSVGDark width={120} height={120} />
              ) : (
                <LogoSVGLight width={120} height={120} />
              )}
            </View>
            <Text style={styles.headerTitle}>ABOUT US</Text>
            <View style={styles.divider} />
          </View>

          {/* Mission Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <View style={styles.missionCard}>
              <Text style={styles.missionText}>
                DokLink is a trailblazing startup in the healthcare industry,
                founded in 2024 with the mission to make healthcare access as
                simple as a single click.
              </Text>
              <Text style={styles.missionSubtext}>
                We&#39;re committed to transforming the medical landscape in
                India by streamlining how patients connect with critical
                healthcare services.
              </Text>
            </View>
          </View>

          {/* Platform Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What We Do</Text>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.iconText}>🏥</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Universal Access</Text>
                <Text style={styles.featureDescription}>
                  Our platform empowers users—both in urban tech-savvy
                  communities and rural areas with limited access—to take
                  control of medical situations with speed and ease.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.iconText}>📱</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Booking</Text>
                <Text style={styles.featureDescription}>
                  Our standout feature enables patients or their families to
                  pre-book hospital beds online, drastically reducing wait times
                  and eliminating paperwork during emergencies.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.iconText}>⚡</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Streamlined Claims</Text>
                <Text style={styles.featureDescription}>
                  We simplify and accelerate the health insurance claim process,
                  ensuring users receive the care and support they need without
                  unnecessary delays.
                </Text>
              </View>
            </View>
          </View>

          {/* Founders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Founders</Text>
            <View style={styles.foundersCard}>
              <Text style={styles.foundersText}>
                DokLink was founded by two driven innovators:
              </Text>
              <View style={styles.founderItem}>
                <Text style={styles.founderName}>Mr. Rohit Kumar Choubey</Text>
              </View>
              <View style={styles.founderItem}>
                <Text style={styles.founderName}>Mr. Krishnendu Gupta</Text>
              </View>
              <Text style={styles.foundersDescription}>
                Both founders are currently pursuing their B.Tech in Computer
                Science and Engineering from Amity University Kolkata, bringing
                fresh perspectives and technical expertise to healthcare
                innovation.
              </Text>
            </View>
          </View>

          {/* Vision Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Vision</Text>
            <View style={styles.visionCard}>
              <Text style={styles.visionText}>
                &quot;One Link to Total Health!&quot;
              </Text>
              <Text style={styles.visionDescription}>
                To create a unified healthcare ecosystem where every Indian,
                regardless of location or technical expertise, has instant
                access to quality medical services.
              </Text>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Get in Touch</Text>
            <Text style={styles.contactText}>
              Join us in revolutionizing healthcare accessibility across India.
            </Text>
            {colorScheme === "light" ? (
              <Pressable 
                onPress={handleContactPress}
                onPressIn={() => setContactButtonPressed(true)}
                onPressOut={() => setContactButtonPressed(false)}
              >
                <LinearGradient
                  colors={
                    contactButtonPressed
                      ? ["#1691A8", "#083A73"]
                      : ["#1CA8C9", "#0A4C8B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.contactButton}
                >
                  <Text style={styles.contactButtonText}>Contact Us</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactPress}
                activeOpacity={0.2}
              >
                <Text style={styles.contactButtonText}>Contact Us</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}
