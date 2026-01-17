# DokLink Frontend

React Native + Expo mobile app for health management.

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Update IP Address**
Edit `config/api.ts` line 6 with your computer's IP:
```typescript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000'
```

3. **Start Development Server**
```bash
npx expo start
```

4. **Run on Device**
- Install Expo Go app on your phone
- Scan QR code from terminal

## Features

- User authentication
- Profile picture upload
- Aadhaar verification
- Form validation
- Dark/Light mode

## Tech Stack

- React Native + Expo
- TypeScript
- Axios for API calls
- Expo Router
- Cloudinary for images
│   ├── Login.ts                 # Login screen styles
│   ├── SignUp.ts                # Signup screen styles
│   ├── AadharVerification.ts    # Aadhaar verification styles
│   ├── AboutUs.ts               # About us styles
│   └── AgreementStyles.ts       # Terms/Privacy styles
├── utils/                       # Utility functions
│   └── validation.ts            # Form validation schemas
└── package.json                 # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **Expo CLI** (optional but recommended)

For mobile development:
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **Expo Go app** on your mobile device (for quick testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doklink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   Or if you prefer yarn:
   ```bash
   yarn install
   ```

3. **Install Expo CLI globally** (if not already installed)
   ```bash
   npm install -g @expo/cli
   ```

### 🏃‍♂️ Running the Application

#### Option 1: Using Expo Go (Recommended for beginners)

1. **Start the development server**
   ```bash
   npm start
   ```
   Or:
   ```bash
   npx expo start
   ```

2. **Install Expo Go on your mobile device**
   - iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

3. **Scan the QR code**
   - Open Expo Go on your device
   - Scan the QR code displayed in your terminal or browser
   - The app will load on your device

#### Option 2: Using Emulators/Simulators

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Choose your platform**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)
   - Press `w` for web browser

#### Option 3: Direct platform commands

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint for code quality
- `npm run reset-project` - Reset project to clean state

## 📱 App Flow

1. **Splash Screen**: Beautiful animated welcome screen with DokLink branding
2. **Starting Screen**: Choose to login or sign up
3. **Authentication**: Secure login/signup process
4. **Aadhaar Verification**: Indian ID verification system
5. **Data Consent**: Privacy-focused data collection consent
6. **Home Dashboard**: Main app functionality (in development)

## 🎨 Theming

The app supports both light and dark themes that automatically adapt to your device's system preference:

- **Light Theme**: Clean white backgrounds with subtle gradients
- **Dark Theme**: Deep dark backgrounds with blue accent gradients
- **Smooth Transitions**: Animated theme switching for better UX

## 🛡️ Privacy & Security

DokLink prioritizes user privacy and security:

- Transparent data collection practices
- User consent for all data usage
- Secure authentication flows
- Privacy policy and terms clearly accessible

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Node modules issues**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS simulator not starting**
   - Ensure Xcode is installed and updated
   - Try: `npx expo run:ios`

4. **Android emulator issues**
   - Ensure Android Studio is properly configured
   - Check if virtual device is running

### Getting Help

- Check the [Expo Documentation](https://docs.expo.dev/)
- Visit [React Native Documentation](https://reactnative.dev/docs/getting-started)
- Join the [Expo Discord Community](https://chat.expo.dev)

---

## 🔐 Permission System Architecture

DokLink uses a scalable, carousel-based permission system that dynamically handles runtime permissions with a smooth user experience.

### Overview

The permission system is designed to:
- **Only show permissions that aren't granted** - Checks both system permissions and stored state
- **Use a carousel approach** - Users can swipe through required permissions
- **Be easily extensible** - Add new permissions without modifying existing code
- **Support both light and dark themes** - Consistent styling across all permissions

### Architecture Components

The permission system consists of three main layers:

#### 1. **Main Container** - `AppPermission.tsx`
Central orchestrator that:
- Manages the carousel of permission components
- Dynamically filters out granted permissions
- Handles navigation to the next permission or Home screen
- Prevents softlocking by allowing users to skip permissions

#### 2. **Permission Components**
Individual components for each permission type (stored in `components/permissions/`):
- `LocationPermissionComponent.tsx` - GPS/Location access
- `FilesPermissionComponent.tsx` - Media library and file system access

Each component:
- Displays permission-specific UI with icons and descriptions
- Handles the actual permission request
- Stores permission state in AsyncStorage
- Provides "Allow" and "Continue" (skip) options

#### 3. **Permission Store** - `permissionStore.ts`
Manages permission state with Zustand:
```typescript
interface PermissionState {
  permissions: { [key: string]: boolean };
  setPermission: (key: string, value: boolean) => void;
  checkPermission: (key: string) => boolean;
  resetPermissions: () => void;
}
```

### Current Permissions

| Permission | Package Used | Purpose |
|------------|--------------|---------|
| **Location** | `expo-location` | GPS access for hospital search and emergency services |
| **Media Library** | `expo-media-library` | Access to photos, videos, audio files |
| **File System** | `expo-file-system` | Directory selection via Storage Access Framework |

### Adding a New Permission

Follow this standardized process to add any new permission:

#### Step 1: Create Permission Component

Create `components/permissions/CameraPermissionComponent.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { styles } from '../../styles/PermissionComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Camera from 'expo-camera';

interface CameraPermissionProps {
  onPermissionChange: () => void;
}

export default function CameraPermissionComponent({ onPermissionChange }: CameraPermissionProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleAllow = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      await AsyncStorage.setItem('permission_camera', 'granted');
    }
    onPermissionChange(); // Always proceed
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem('permission_camera', 'denied');
    onPermissionChange(); // Proceed without permission
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          isDarkMode
            ? require('../../assets/images/camera_permission_logo_dark.svg')
            : require('../../assets/images/camera_permission_logo_light.svg')
        }
        style={styles.icon}
      />
      <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>
        Camera Access
      </Text>
      <Text style={[styles.description, isDarkMode && { color: '#ccc' }]}>
        DokLink needs camera access to scan prescriptions and capture medical documents.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
          <Text style={styles.allowButtonText}>Allow</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={[styles.continueButtonText, isDarkMode && { color: '#fff' }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

#### Step 2: Add Permission Icons

Create SVG icons:
- `assets/images/camera_permission_logo_dark.svg`
- `assets/images/camera_permission_logo_light.svg`

#### Step 3: Update AppPermission.tsx

Add to `allPermissions` array in `app/pages/AppPermission.tsx`:

```tsx
import CameraPermissionComponent from '../../components/permissions/CameraPermissionComponent';
import * as Camera from 'expo-camera';

// In allPermissions array:
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
}
```

#### Step 4: Install Required Package

```bash
npm install expo-camera
```

### Permission Flow

```
App Start
    ↓
Check Authentication
    ↓
If Authenticated → Check System Permissions
    ↓
Check AsyncStorage for Stored Permissions
    ↓
Filter Out Granted Permissions
    ↓
If Permissions Missing → Show Permission Carousel
    ↓
User Interacts (Allow/Continue)
    ↓
Store Result in AsyncStorage
    ↓
Move to Next Permission or Home Screen
```

### File Access System (Multi-Step)

The file permission system uses a comprehensive two-step approach:

**Step 1: Media Library Permissions**
```tsx
import * as MediaLibrary from 'expo-media-library';

const { status } = await MediaLibrary.requestPermissionsAsync();
// Grants access to: Photos, Videos, Audio, Music
```

**Step 2: Storage Access Framework**
```tsx
import * as FileSystem from 'expo-file-system';

const result = await FileSystem.StorageAccessFramework
  .requestDirectoryPermissionsAsync();
  
// User selects directory via system UI
// Grants access to: Documents, Files, App-specific folders
// Stores directory URI for persistent access
```

**Combined Flow:**
```javascript
// 1. Request media library
const mediaResult = await MediaLibrary.requestPermissionsAsync();

// 2. Request directory selection
const directoryUri = await FileSystem.StorageAccessFramework
  .requestDirectoryPermissionsAsync();

// 3. Store both permissions
await AsyncStorage.setItem("permission_files", "granted");
await AsyncStorage.setItem("selected_directory_uri", directoryUri.directoryUri);
```

### Testing & Development

**Reset Permissions for Testing:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const resetPermissions = async () => {
  await AsyncStorage.removeItem('permission_location');
  await AsyncStorage.removeItem('permission_files');
  await AsyncStorage.removeItem('permission_camera');
  console.log('All permissions reset');
};
```

**Permission State Debugging:**
```javascript
// Check current permission state
const locationPerm = await AsyncStorage.getItem('permission_location');
const filesPerm = await AsyncStorage.getItem('permission_files');

console.log('Location:', locationPerm); // 'granted', 'denied', or null
console.log('Files:', filesPerm);
```

### Key Features

- ✅ **Dynamic filtering** - Only shows ungranted permissions
- ✅ **Persistent state** - Permissions stored in AsyncStorage
- ✅ **No softlocking** - Users can always skip permissions with "Continue"
- ✅ **Carousel navigation** - Swipe between permissions with pagination dots
- ✅ **Theme support** - Light and dark mode icons/styling
- ✅ **Graceful degradation** - App works even if permissions are denied

### Best Practices

1. **Always create both dark and light mode icons** for consistency
2. **Use the same styling** (`PermissionComponent.ts`) for all permission components
3. **Test on both iOS and Android** - Permission behaviors differ
4. **Handle denials gracefully** - Allow users to continue without required permissions
5. **Store permission state** - Use AsyncStorage for persistent permission tracking
6. **Provide clear descriptions** - Explain why each permission is needed

### Troubleshooting

- **Permission not appearing**: Check if system permission is already granted
- **Softlock issue**: Ensure `onPermissionChange()` is called in both Allow and Continue handlers
- **State not persisting**: Verify AsyncStorage keys are consistent
- **File access issues**: Remember to use both MediaLibrary AND StorageAccessFramework
- **Icons not showing**: Check SVG file paths and naming conventions (dark/light variants)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏥 About DokLink

DokLink aims to revolutionize healthcare management by providing a unified platform for all health-related needs. Our mission is to make healthcare accessible, organized, and user-friendly for everyone.

**One Link to Total Health!** 🌟

---

For support or questions, please contact the development team.
