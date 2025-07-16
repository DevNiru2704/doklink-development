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
import LocationLogoDark from "../../assets/images/location_permission_logo_dark.svg";
import LocationLogoLight from "../../assets/images/location_permission_logo_light.svg";
import useThemedStyles from "../../styles/PermissionComponent";

interface LocationPermissionComponentProps {
  onAllow: () => void;
  onContinue: () => void;
}

export default function LocationPermissionComponent({
  onAllow,
  onContinue,
}: LocationPermissionComponentProps) {
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
          ALLOW DOKLINK TO ACCESS{"\n"}YOUR LOCATION!
        </Text>
      </View>

      {/* Location Logo Container */}
      <View style={styles.logoContainer}>
        {colorScheme === "dark" ? (
          <LocationLogoDark width={140} height={140} />
        ) : (
          <LocationLogoLight width={140} height={140} />
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
      </View>
    </View>
  );
}
