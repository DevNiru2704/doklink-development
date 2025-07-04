# 🏥 DokLink - One Link to Total Health!

DokLink is a comprehensive health management mobile application built with React Native and Expo. It provides users with a unified platform to manage their healthcare needs, including authentication, Aadhaar verification, and health data management.

## 📱 Features

- **🔐 User Authentication**: Secure login and signup functionality
- **📄 Aadhaar Verification**: Integrated Aadhaar verification system
- **🌙 Dark/Light Mode**: Automatic theme switching based on device preferences
- **📊 Data Collection**: Consent-based health data collection
- **🔒 Privacy & Security**: Built-in privacy policy and terms & conditions
- **📱 Cross-Platform**: Works on iOS, Android, and Web
- **🎨 Modern UI**: Beautiful gradient designs with smooth animations
- **📋 Form Validation**: Robust form validation using Formik and Yup

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Forms**: Formik with Yup validation
- **UI Components**: React Native with custom styled components
- **Animations**: React Native Animated API
- **Icons**: Expo Vector Icons
- **Images**: Expo Image with SVG support
- **Gradients**: Expo Linear Gradient

## 📁 Project Structure

```
doklink/
├── app/                          # Main application screens
│   ├── _layout.tsx              # Root layout component
│   ├── index.tsx                # Main app entry point with splash screen
│   ├── StartingScreen.tsx       # Welcome screen with login/signup options
│   ├── Login.tsx                # User login screen
│   ├── SignUp.tsx               # User registration screen
│   ├── AadharVerification.tsx   # Aadhaar verification flow
│   ├── DataCollectionConsentForm.tsx  # Data consent form
│   ├── AboutUs.tsx              # About us page
│   ├── PrivacyPolicy.tsx        # Privacy policy page
│   ├── TermsAndCondition.tsx    # Terms and conditions page
│   └── (tabs)/                  # Tab-based navigation screens
│       └── Home.tsx             # Main dashboard (coming soon)
├── assets/                      # Static assets
│   ├── fonts/                   # Custom fonts
│   └── images/                  # Images and SVG logos
├── styles/                      # Styled components and themes
│   ├── index.ts                 # Main theme styles
│   ├── StartingScreen.ts        # Starting screen styles
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
