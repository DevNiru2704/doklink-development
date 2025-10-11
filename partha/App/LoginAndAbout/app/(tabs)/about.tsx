// This file is part of DokLink, a healthcare startup focused on simplifying medical access in India.

import React from 'react';
import { View, Text, ScrollView, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';



export default function AboutUsScreen() {
  const router = useRouter();
  return (
    <ImageBackground
      source={require('@/assets/images/doklink-image.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>ABOUT US:</Text>
          <Text style={styles.text}>
            DokLink is a trailblazing startup in the healthcare industry, founded in 2024 with the mission to make
            healthcare access as simple as a single click. We are committed to transforming the medical landscape in India
            by streamlining how patients connect with critical healthcare services.
          </Text>
          <Text style={styles.text}>
            Our platform is designed to empower users—both in urban tech-savvy communities and rural areas with limited
            access—to take control of medical situations with speed and ease.
          </Text>
          <Text style={styles.text}>
            Our standout feature enables patients or their families to pre-book hospital beds online, drastically reducing
            wait times and eliminating cumbersome paperwork during emergencies.
          </Text>
          <Text style={styles.text}>
            In addition, we simplify and accelerate the health insurance claim process, ensuring users receive the care and
            support they need without unnecessary delays.
          </Text>
          <Text style={styles.text}>
            DokLink was founded by two driven innovators, Mr. Rohit Kumar Choubey and Mr. Krishnendu Gupta, both of whom
            are currently pursuing their B.Tech in Computer Science and Engineering from Amity University Kolkata.
          </Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
});