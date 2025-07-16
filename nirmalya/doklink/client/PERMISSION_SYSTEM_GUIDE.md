# Permission System Guide

This guide explains how to use and extend the scalable permission system implemented in the DokLink app.

## Overview

The permission system is built with a carousel approach that dynamically shows only the permissions that haven't been granted yet. This makes it highly scalable and user-friendly.

## Architecture

### Main Components

1. **AppPermission.tsx** - Main container that manages the carousel and permission logic
2. **LocationPermissionComponent.tsx** - Individual permission component for location
3. **FilesPermissionComponent.tsx** - Individual permission component for files/folders
4. **AppPermission.ts** - Styles for the main container

### How It Works

1. The system checks all defined permissions on startup
2. Only permissions that haven't been granted are added to the carousel
3. Users can swipe through permissions or use the pagination dots
4. Once all permissions are granted, the user proceeds to the Home screen

## Adding New Permissions

To add a new permission (e.g., Camera permission), follow these steps:

### Step 1: Create the Permission Component

Create a new file: `client/components/permissions/CameraPermissionComponent.tsx`

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import LogoSVGDark from '../../assets/images/just_the_logo_dark.svg';
import LogoSVGLight from '../../assets/images/just_the_logo_light.svg';
import CameraLogoDark from '../../assets/images/camera_permission_logo_dark.svg';
import CameraLogoLight from '../../assets/images/camera_permission_logo_light.svg';
import useThemedStyles from '../../styles/LocationPermission';

interface CameraPermissionComponentProps {
  onAllow: () => void;
  onContinue: () => void;
}

export default function CameraPermissionComponent({
  onAllow,
  onContinue,
}: CameraPermissionComponentProps) {
  const [allowButtonPressed, setAllowButtonPressed] = useState(false);
  const [continueButtonPressed, setContinueButtonPressed] = useState(false);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles();

  return (
    <View style={styles.content}>
      {/* Logo Container */}
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
          ALLOW DOKLINK TO ACCESS{"\n"}YOUR CAMERA!
        </Text>
      </View>

      {/* Camera Logo Container */}
      <View style={styles.logoContainer}>
        {colorScheme === "dark" ? (
          <CameraLogoDark width={260} height={260} />
        ) : (
          <CameraLogoLight width={260} height={260} />
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
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

### Step 2: Add Permission Icons

Create SVG icons for your permission:
- `client/assets/images/camera_permission_logo_dark.svg`
- `client/assets/images/camera_permission_logo_light.svg`

### Step 3: Update AppPermission.tsx

Add the new permission to the `allPermissions` array:

```tsx
import CameraPermissionComponent from '../../components/permissions/CameraPermissionComponent';
import * as Camera from 'expo-camera';

// Add to allPermissions array:
{
  id: 'camera',
  component: CameraPermissionComponent,
  checkPermission: async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  },
  requestPermission: async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  },
},
```

### Step 4: Install Required Dependencies

```bash
npm install expo-camera
```

## Current Permissions

The system currently supports:

1. **Location Permission** - Uses `expo-location`
2. **Comprehensive File Access** - Multi-step process:
   - **Media Library Access** (photos, videos, audio, music) - Uses `expo-media-library`
   - **Storage Access Framework** (app-specific directory selection) - Uses `expo-file-system`

## Features

- **Dynamic Permission Checking** - Only shows permissions that haven't been granted
- **Carousel Navigation** - Users can swipe between permissions
- **Pagination Dots** - Visual indicator of current permission
- **Consistent Theming** - Supports both light and dark modes
- **Scalable Architecture** - Easy to add new permissions

## Integration

The permission system is integrated into the main app flow in `client/app/index.tsx`:

1. After user authentication
2. Before accessing the Home screen
3. Permissions are reset on logout

## Styling

All permission components use the same styling from `LocationPermission.ts` to maintain consistency. The main container uses `AppPermission.ts` for carousel-specific styles.

## Best Practices

1. Always create both dark and light mode icons
2. Use consistent text formatting for permission requests
3. Follow the same component structure for new permissions
4. Test permission flows on both iOS and Android
5. Handle permission denial gracefully with the "Continue" button

This system makes it easy to add new permissions without modifying existing code, just by adding new components to the carousel!

## Testing & Development

### Reset Permissions for Testing

To test the permission flow during development, you can reset all permissions by running this code in your app:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to reset all permissions for testing
const resetPermissions = async () => {
  try {
    await AsyncStorage.removeItem('permission_location');
    await AsyncStorage.removeItem('permission_files');
    console.log('All permissions reset for testing');
  } catch (error) {
    console.error('Error resetting permissions:', error);
  }
};

// Call this function to reset permissions
resetPermissions();
```

### Permission Flow Summary

1. **App starts** → Check authentication
2. **If authenticated** → Check permissions (both system and stored state)
3. **If permissions missing** → Show permission carousel
4. **User interacts with permissions** → Store results in AsyncStorage
5. **All permissions handled** → Proceed to Home screen

### Comprehensive File Permission System

The file permission system now uses a **multi-step approach** for complete file access:

#### **Step 1: Media Library Permissions**
- **Photos & Videos**: Access to user's photo gallery and video library
- **Music & Audio**: Access to user's music library and audio files
- **Uses**: `expo-media-library` with `MediaLibrary.requestPermissionsAsync()`

#### **Step 2: Storage Access Framework**
- **Directory Selection**: User selects an app-specific directory via system UI
- **Broad File Access**: Access to documents, files, and folders in selected directory
- **Uses**: `expo-file-system` with `FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()`

#### **Permission Flow Example:**
```javascript
// When user clicks "Allow" on file permission:
// 1. Request media library access
const mediaResult = await MediaLibrary.requestPermissionsAsync();

// 2. If granted, request directory access via Storage Access Framework
const directoryUri = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

// 3. Store both permissions and directory URI for future use
await AsyncStorage.setItem("permission_files", "granted");
await AsyncStorage.setItem("selected_directory_uri", directoryUri.directoryUri);
```

### Troubleshooting

- **Softlock Issue**: Fixed by always proceeding to next permission regardless of user choice
- **Permission Detection**: Uses both system permissions and AsyncStorage for persistent state
- **File Access**: Multi-step process using MediaLibrary + Storage Access Framework
- **Location Access**: Uses expo-location for precise location permissions
- **Directory Access**: Stored URI can be used later for file operations in selected directory

### File Access Capabilities

After permissions are granted, your app can:
- **Read/Write Media**: Photos, videos, music, audio files via MediaLibrary
- **Access Selected Directory**: Read/write files in user-selected directory via FileSystem
- **Persistent Access**: Directory URI is stored for future app sessions

This system makes it easy to add new permissions without modifying existing code, just by adding new components to the carousel!