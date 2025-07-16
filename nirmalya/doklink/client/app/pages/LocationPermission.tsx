import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  StatusBar,
  View,
  useColorScheme,
} from "react-native";

import LocationPermissionComponent from "../../components/permissions/LocationPermissionComponent";
import NetworkBackgroundImageLight from "../../assets/images/light_background.png";
import NetworkBackgroundImage from "../../assets/images/network_background.png";
import useThemedStyles from "../../styles/PermissionComponent";

interface LocationPermissionProps {
  onAllow: () => void;
  onContinue: () => void;
}

export default function LocationPermission({
  onAllow,
  onContinue,
}: LocationPermissionProps) {
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

        <LocationPermissionComponent
          onAllow={onAllow}
          onContinue={onContinue}
        />
      </ImageBackground>
    </View>
  );
}
