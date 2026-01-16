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
import { usePermissionStore } from "../../store/permissionStore";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const styles = useThemedStyles();

  // Use permission store
  const {
    checkLocationPermission,
    checkFilesPermission,
    setLocationPermission,
    setFilesPermission,
    initializePermissions
  } = usePermissionStore();

  // Define all possible permissions using useMemo to prevent re-creation
  const allPermissions: PermissionItem[] = useMemo(
    () => [
      {
        id: "location",
        component: LocationPermissionComponent,
        checkPermission: async () => {
          return (await checkLocationPermission()) === 'granted';
        },
        requestPermission: async () => {
          try {
            console.log("Requesting location permission...");
            const result = await Location.requestForegroundPermissionsAsync();
            console.log("Location permission result:", result);

            const granted = result.status === "granted";

            // Update store (which also updates AsyncStorage)
            setLocationPermission(granted ? 'granted' : 'denied');

            console.log(
              "Location permission stored:",
              granted ? "granted" : "denied"
            );
            return granted;
          } catch (error) {
            console.error("Location permission request error:", error);
            setLocationPermission('denied');
            return false;
          }
        },
      },
      {
        id: "files",
        component: FilesPermissionComponent,
        checkPermission: async () => {
          return (await checkFilesPermission()) === 'granted';
        },
        requestPermission: async () => {
          try {
            console.log("Starting comprehensive file permission request...");

            console.log("Step 1: Requesting music & audio permissions...");
            const audioResult = await MediaLibrary.requestPermissionsAsync();
            console.log("Music & audio permission result:", audioResult);

            if (audioResult.status !== "granted") {
              console.log("Music & audio permission denied");
              setFilesPermission('denied');
              return false;
            }

            console.log("Step 2: Requesting photos & videos permissions...");
            const photoResult =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("Photos & videos permission result:", photoResult);

            if (photoResult.status !== "granted") {
              console.log("Photos & videos permission denied");
              setFilesPermission('denied');
              return false;
            }

            console.log(
              "Step 3: Requesting directory access via Storage Access Framework..."
            );

            try {
              const directoryUri =
                await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
              console.log("Directory access result:", directoryUri);

              if (directoryUri.granted) {
                await AsyncStorage.setItem(
                  "selected_directory_uri",
                  directoryUri.directoryUri
                );
                setFilesPermission('granted');

                console.log("All file permissions granted successfully!");
                return true;
              } else {
                console.log("Directory access denied");
                setFilesPermission('denied');
                return false;
              }
            } catch (directoryError) {
              console.log("Directory access error:", directoryError);
              setFilesPermission('granted');
              return true;
            }
          } catch (error) {
            console.log("File permission request failed:", error);
            setFilesPermission('denied');
            return false;
          }
        },
      },
    ],
    []
  );

  const checkPendingPermissions = useCallback(async () => {
    setIsLoading(true);

    // Initialize permissions in store first
    await initializePermissions();

    const pending: PermissionItem[] = [];

    for (const permission of allPermissions) {
      const isGranted = await permission.checkPermission();
      if (!isGranted) {
        pending.push(permission);
      }
    }

    setPendingPermissions(pending);
    setIsLoading(false);
  }, [allPermissions, initializePermissions]);

  useEffect(() => {
    checkPendingPermissions();
  }, [checkPendingPermissions]);

  // Handle when all permissions are granted
  useEffect(() => {
    if (!isLoading && pendingPermissions.length === 0) {
      console.log("All permissions handled, calling callback...");
      onAllPermissionsGranted();
    }
  }, [isLoading, pendingPermissions.length, onAllPermissionsGranted]);

  const handleAllow = async () => {
    if (isProcessing) return; // Prevent multiple simultaneous requests

    const currentPermission = pendingPermissions[currentIndex];
    if (!currentPermission) return;

    setIsProcessing(true);

    try {
      console.log(`Requesting permission for: ${currentPermission.id}`);
      const granted = await currentPermission.requestPermission();

      console.log(`Permission result for ${currentPermission.id}:`, granted);

      // Store the actual state
      await AsyncStorage.setItem(
        `permission_${currentPermission.id}`,
        granted ? "granted" : "denied"
      );

      // Remove the current permission from pending list
      const newPendingPermissions = pendingPermissions.filter(
        (_, index) => index !== currentIndex
      );

      setPendingPermissions(newPendingPermissions);

      // Adjust currentIndex if necessary
      if (currentIndex >= newPendingPermissions.length && newPendingPermissions.length > 0) {
        setCurrentIndex(newPendingPermissions.length - 1);
      } else if (newPendingPermissions.length > 0) {
        // Stay at the same index to show the next permission
        // Scroll to the current position
        scrollViewRef.current?.scrollTo({
          x: currentIndex * screenWidth,
          animated: true,
        });
      }

    } catch (error) {
      console.log("Permission request error:", error);
      await AsyncStorage.setItem(
        `permission_${currentPermission.id}`,
        "denied"
      );

      // Remove the current permission from pending list even if error occurred
      const newPendingPermissions = pendingPermissions.filter(
        (_, index) => index !== currentIndex
      );

      setPendingPermissions(newPendingPermissions);

      // Adjust currentIndex if necessary
      if (currentIndex >= newPendingPermissions.length && newPendingPermissions.length > 0) {
        setCurrentIndex(newPendingPermissions.length - 1);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (isProcessing) return; // Prevent actions while processing

    const currentPermission = pendingPermissions[currentIndex];
    if (!currentPermission) return;

    // Store as denied when user chooses to continue
    AsyncStorage.setItem(`permission_${currentPermission.id}`, "denied");

    // Remove the current permission from pending list
    const newPendingPermissions = pendingPermissions.filter(
      (_, index) => index !== currentIndex
    );

    setPendingPermissions(newPendingPermissions);

    // Adjust currentIndex if necessary
    if (currentIndex >= newPendingPermissions.length && newPendingPermissions.length > 0) {
      setCurrentIndex(newPendingPermissions.length - 1);
    } else if (newPendingPermissions.length > 0) {
      // Stay at the same index to show the next permission
      scrollViewRef.current?.scrollTo({
        x: currentIndex * screenWidth,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    if (isProcessing) return; // Prevent scroll during processing

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
          scrollEnabled={!isProcessing} // Disable scroll during processing
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