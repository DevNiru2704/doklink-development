import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import LogoSVGDark from "../../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../../assets/images/just_the_logo_light.svg";
import FilesLogoDark from "../../assets/images/folder_permission_logo_dark.svg";
import FilesLogoLight from "../../assets/images/folder_permission_logo_light.svg";
import useThemedStyles from "../../styles/PermissionComponent";

interface FilesPermissionComponentProps {
  onAllow: () => void;
  onContinue: () => void;
}

export default function FilesPermissionComponent({
  onAllow,
  onContinue,
}: FilesPermissionComponentProps) {
  const [allowButtonPressed, setAllowButtonPressed] = useState(false);
  const [continueButtonPressed, setContinueButtonPressed] = useState(false);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles();

  return (
    <View style={styles.content}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        {colorScheme === "dark" ? (
          <LogoSVGDark width={120} height={120} />
        ) : (
          <LogoSVGLight width={120} height={120} />
        )}
      </View>

      {/* Brand Name */}
      <View style={styles.brandSection}>
        <Text style={styles.brandName}>Doklink</Text>
      </View>

      {/* Permission Text */}
      <View style={styles.permissionSection}>
        <Text style={styles.permissionText}>
          ALLOW DOKLINK TO ACCESS{"\n"}YOUR MEDIA & FILES!
        </Text>
      </View>

      {/* Files Logo Container */}
      <View style={styles.logoContainer}>
        {colorScheme === "dark" ? (
          <FilesLogoDark width={140} height={140} />
        ) : (
          <FilesLogoLight width={140} height={140} />
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {colorScheme === "light" ? (
          <Pressable
            onPress={onAllow}
            onPressIn={() => setAllowButtonPressed(true)}
            onPressOut={() => setAllowButtonPressed(false)}
          >
            <LinearGradient
              colors={
                allowButtonPressed
                  ? ["#1691A8", "#083A73"]
                  : ["#1CA8C9", "#0A4C8B"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allowButton}
            >
              <Text style={styles.allowButtonText}>ALLOW</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
            <Text style={styles.allowButtonText}>ALLOW</Text>
          </TouchableOpacity>
        )}

        {colorScheme === "light" ? (
          <Pressable
            onPress={onContinue}
            onPressIn={() => setContinueButtonPressed(true)}
            onPressOut={() => setContinueButtonPressed(false)}
          >
            <LinearGradient
              colors={
                continueButtonPressed
                  ? ["#1691A8", "#083A73"]
                  : ["#1CA8C9", "#0A4C8B"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        )}

        {/* Manual permission note */}
        <View style={{ marginTop: 16, paddingHorizontal: 10 }}>
          <Text
            style={{
              fontSize: 12,
              textAlign: "center",
              color: colorScheme === "dark" ? "#8DA3B0" : "#005F99",
              opacity: 0.8,
            }}
          >
            Important: If you deny Doklink permission, it will be treated as
            permanently denied, and you will need to manually enable it through
            the system settings. This page is displayed only once unless you
            uninstall the app or log out.
          </Text>
        </View>
      </View>
    </View>
  );
}
