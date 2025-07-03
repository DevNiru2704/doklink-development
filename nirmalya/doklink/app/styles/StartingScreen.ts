//StartingScreen.tsx styles
import { StyleSheet, useColorScheme } from "react-native";

const dark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 36,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
    left: 15
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 64,
    color: '#8DA3B0',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  signupButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  aboutButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
});


const light = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientOverlay: {
    display: 'none',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 36,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
    left: 15
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 64,
    color: '#005F99', 
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#0571b4', 
    fontWeight: '400',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aboutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;
