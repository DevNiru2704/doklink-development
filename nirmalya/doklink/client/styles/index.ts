//index.tsx styles

import { StyleSheet, useColorScheme } from "react-native";

const dark = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    position: "relative",
    top: 30,
    left: 15,
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 32,
    color: "#7F929E",
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: "#8da3b0",
    textShadowRadius: 3,
    elevation: 2,
  },
  brandName: {
    fontSize: 48,
    color: "#7F929E",
    fontWeight: "bold",
    letterSpacing: 4,
    marginBottom: 12,
    textShadowColor: "#8da3b0",
    textShadowRadius: 3,
    elevation: 2,
  },
  tagline: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "400",
    letterSpacing: 1,
    textAlign: "center",
    fontStyle: "italic",
  },
});


// Light mode styles
const light = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    position: "relative",
    top: 30,
    left: 15,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    color: '#005F99', // Blue-gray matching the logo theme
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: '#B0C4DE',
    textShadowRadius: 2,
    elevation: 1,
  },
  brandName: {
    fontSize: 48,
    color: '#005F99', // Darker blue matching the Doklink brand
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 12,
    textShadowColor: '#B0C4DE',
    textShadowRadius: 2,
    elevation: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#0571b4', // Lighter blue for the tagline
    fontWeight: '400',
    letterSpacing: 1,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;
