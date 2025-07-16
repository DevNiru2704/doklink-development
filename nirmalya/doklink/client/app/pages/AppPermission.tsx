import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  ScrollView,
  Dimensions,
  StatusBar,
  ImageBackground,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LocationPermissionComponent from "../../components/permissions/LocationPermissionComponent";
import FilesPermissionComponent from "../../components/permissions/FilesPermissionComponent";
import NetworkBackgroundImage from "../../assets/images/network_background.png";
import NetworkBackgroundImageLight from "../../assets/images/light_background.png";
import useThemedStyles from "../../styles/AppPermission";

interface AppPermissionProps {
  onAllPermissionsGranted: () => void;
}

interface PermissionItem {
  id: string;
  component: React.ComponentType<any>;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

const { width: screenWidth } = Dimensions.get("window");

export default function AppPermission({
  onAllPermissionsGranted,
}: AppPermissionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingPermissions, setPendingPermissions] = useState<
    PermissionItem[]
  >([]);
  const [permissionStates, setPermissionStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();

  // Define all possible permissions using useMemo to prevent re-creation
  const allPermissions: PermissionItem[] = useMemo(
    () => [
      {
        id: "location",
        component: LocationPermissionComponent,
        checkPermission: async () => {
          // Check ACTUAL system permission for location
          const { status } = await Location.getForegroundPermissionsAsync();
          return status === "granted";
        },
        requestPermission: async () => {
          try {
            console.log("Requesting location permission...");
            const result = await Location.requestForegroundPermissionsAsync();
            console.log("Location permission result:", result);

            const granted = result.status === "granted";

            // Store the permission state
            await AsyncStorage.setItem(
              "permission_location",
              granted ? "granted" : "denied"
            );

            console.log(
              "Location permission stored:",
              granted ? "granted" : "denied"
            );
            return granted;
          } catch (error) {
            console.error("Location permission request error:", error);
            await AsyncStorage.setItem("permission_location", "denied");
            return false;
          }
        },
      },
      {
        id: "files",
        component: FilesPermissionComponent,
        checkPermission: async () => {
          // Check ACTUAL system permissions for files
          try {
            // Check media library permission
            const mediaResult = await MediaLibrary.getPermissionsAsync();
            const mediaGranted = mediaResult.status === "granted";

            // Check image picker permission  
            const imageResult = await ImagePicker.getMediaLibraryPermissionsAsync();
            const imageGranted = imageResult.status === "granted";

            // Both must be granted for file permission to be considered granted
            const filePermissionGranted = mediaGranted && imageGranted;
            
            console.log("File permission check:", {
              mediaStatus: mediaResult.status,
              mediaGranted,
              imageStatus: imageResult.status, 
              imageGranted,
              filePermissionGranted
            });

            return filePermissionGranted;
          } catch (error) {
            console.error("File permission check error:", error);
            return false;
          }
        },
        requestPermission: async () => {
          try {
            console.log("Starting comprehensive file permission request...");

            // Step 1: Request Music & Audio permissions
            console.log("Step 1: Requesting music & audio permissions...");
            const audioResult = await MediaLibrary.requestPermissionsAsync();
            console.log("Music & audio permission result:", audioResult);

            if (audioResult.status !== "granted") {
              console.log("Music & audio permission denied");
              await AsyncStorage.setItem("permission_files", "denied");
              return false;
            }

            // Step 2: Request Photos & Videos permissions (using ImagePicker)
            console.log("Step 2: Requesting photos & videos permissions...");
            const photoResult =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("Photos & videos permission result:", photoResult);

            if (photoResult.status !== "granted") {
              console.log("Photos & videos permission denied");
              await AsyncStorage.setItem("permission_files", "denied");
              return false;
            } else {
              console.log("Photos & videos permission already granted or just granted");
            }

            // Step 3: Request Storage Access Framework directory access
            console.log(
              "Step 2: Requesting directory access via Storage Access Framework..."
            );

            try {
              // Use FileSystem to request directory access via Storage Access Framework
              const directoryUri =
                await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
              console.log("Directory access result:", directoryUri);

              if (directoryUri.granted) {
                // Store both the permission state and the directory URI for future use
                await AsyncStorage.setItem("permission_files", "granted");
                await AsyncStorage.setItem(
                  "selected_directory_uri",
                  directoryUri.directoryUri
                );

                console.log("All file permissions granted successfully!");
                console.log(
                  "Selected directory URI:",
                  directoryUri.directoryUri
                );

                return true;
              } else {
                console.log("Directory access denied");
                await AsyncStorage.setItem("permission_files", "denied");
                return false;
              }
            } catch (directoryError) {
              console.log("Directory access error:", directoryError);
              // Even if directory access fails, we still have media permissions
              // So we'll consider it partially granted
              await AsyncStorage.setItem("permission_files", "granted");
              return true;
            }
          } catch (error) {
            console.log("File permission request failed:", error);
            await AsyncStorage.setItem("permission_files", "denied");
            return false;
          }
        },
      },
    ],
    []
  );

  const checkPendingPermissions = useCallback(async () => {
    setIsLoading(true);
    const pending: PermissionItem[] = [];
    const states: { [key: string]: boolean } = {};

    for (const permission of allPermissions) {
      const isGranted = await permission.checkPermission();
      states[permission.id] = isGranted;

      if (!isGranted) {
        pending.push(permission);
      }
    }

    setPermissionStates(states);
    setPendingPermissions(pending);
    setIsLoading(false);
  }, [allPermissions]);

  useEffect(() => {
    checkPendingPermissions();
  }, [checkPendingPermissions]);

  // Handle when all permissions are granted
  useEffect(() => {
    if (!isLoading && pendingPermissions.length === 0) {
      console.log("All permissions granted, calling callback...");
      onAllPermissionsGranted();
    }
  }, [isLoading, pendingPermissions.length, onAllPermissionsGranted]);

  const handleAllow = async () => {
    const currentPermission = pendingPermissions[currentIndex];
    if (currentPermission) {
      try {
        console.log(`Requesting permission for: ${currentPermission.id}`);
        const result = await currentPermission.requestPermission();
        console.log(`Permission result for ${currentPermission.id}:`, result);

        // Re-check permissions after request
        await checkPendingPermissions();
      } catch (error) {
        console.log("Permission request error:", error);
        // Mark as handled even if error occurred
        await AsyncStorage.setItem(
          `permission_${currentPermission.id}`,
          "denied"
        );
        handleNext();
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < pendingPermissions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    } else {
      // All permissions handled, re-check and proceed
      checkPendingPermissions();
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  // Show loading or return null if no permissions needed
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      </View>
    );
  }

  if (pendingPermissions.length === 0) {
    return null; // useEffect will handle the callback
  }

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

        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={styles.gradientOverlay}
        />

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {pendingPermissions.map((permission) => {
            const PermissionComponent = permission.component;
            return (
              <View key={permission.id} style={styles.permissionContainer}>
                <PermissionComponent
                  onAllow={handleAllow}
                  onContinue={handleNext}
                />
              </View>
            );
          })}
        </ScrollView>

        {/* Pagination Dots */}
        {pendingPermissions.length > 1 && (
          <View style={styles.paginationContainer}>
            {pendingPermissions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </ImageBackground>
    </View>
  );
}
