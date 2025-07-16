import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LoginComponentProps } from "../../utils/login/types";

export default function MethodSelection({
  colorScheme,
  styles,
  setLoginMethod,
  setLoginMode,
  setCurrentScreen
}: LoginComponentProps) {
  const [methodButtonPressed, setMethodButtonPressed] = useState<number | null>(null);

  const handleMethodSelect = (method: "phone" | "email" | "username") => {
    setMethodButtonPressed(null);
    setLoginMethod(method);
    setLoginMode("password");
    setCurrentScreen("login_form");
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.subtitle}>Choose Login Method</Text>
      
      {/* Phone Number Option */}
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => handleMethodSelect("phone")}
          onPressIn={() => setMethodButtonPressed(0)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 0
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Phone Number</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => handleMethodSelect("phone")}
        >
          <Ionicons name="call" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Phone Number</Text>
        </TouchableOpacity>
      )}
      
      {/* Email Option */}
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => handleMethodSelect("email")}
          onPressIn={() => setMethodButtonPressed(1)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 1
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Email</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => handleMethodSelect("email")}
        >
          <Ionicons name="mail" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Email</Text>
        </TouchableOpacity>
      )}
      
      {/* Username Option */}
      {colorScheme === "light" ? (
        <Pressable
          onPress={() => handleMethodSelect("username")}
          onPressIn={() => setMethodButtonPressed(2)}
          onPressOut={() => setMethodButtonPressed(null)}
        >
          <LinearGradient
            colors={
              methodButtonPressed === 2
                ? ["#1691A8", "#083A73"]
                : ["#1CA8C9", "#0A4C8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.methodButton}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" style={styles.methodButtonIcon} />
            <Text style={styles.methodButtonText}>Username</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <TouchableOpacity
          style={styles.methodButton}
          onPress={() => handleMethodSelect("username")}
        >
          <Ionicons name="person" size={20} color={colorScheme === "dark" ? "#E2E8F0" : "#005F99"} style={styles.methodButtonIcon} />
          <Text style={styles.methodButtonText}>Username</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}