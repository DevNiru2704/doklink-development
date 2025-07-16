import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import LogoSVGDark from "../../assets/images/just_the_logo_dark.svg";
import LogoSVGLight from "../../assets/images/just_the_logo_light.svg";
import LocationLogoDark from "../../assets/images/location_permission_logo_dark.svg";
// import LocationLogoLight from "../../assets/images/location_permission_logo_light.svg";
import NetworkBackgroundImageLight from "../../assets/images/light_background.png";
import NetworkBackgroundImage from "../../assets/images/network_background.png";
import useThemedStyles from "../../styles/LocationPermission";

interface LocationPermissionProps {
  onAllow: () => void;
  onContinue: () => void;
}

export default function LocationPermission({
  onAllow,
  onContinue,
}: LocationPermissionProps) {
  const [allowButtonPressed, setAllowButtonPressed] = useState(false);
  const [continueButtonPressed, setContinueButtonPressed] = useState(false);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles();
  const backgroundImage =
    colorScheme === "dark"
      ? NetworkBackgroundImage
      : NetworkBackgroundImageLight;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={styles.gradientOverlay}
        />

        <View style={styles.content}>
          {/* Location Logo Container */}
          <View style={styles.logoContainer}>
            {colorScheme === "dark" ? (
              <LogoSVGDark width={260} height={260} />
            ) : (
              <LogoSVGLight width={260} height={260} />
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
          {/* <View style={styles.logoContainer}>
            {colorScheme === "dark" ? (
              <LocationLogoDark width={260} height={260} />
            ) : (
              <LocationLogoLight width={260} height={260} />
            )}
          </View> */}

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
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
              >
                <Text style={styles.continueButtonText}>CONTINUE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
