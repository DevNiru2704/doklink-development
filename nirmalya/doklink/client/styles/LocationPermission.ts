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
    left: 15,
    marginBottom: 20,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    fontSize: 64,
    color: '#8DA3B0',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  permissionSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  permissionText: {
    fontSize: 18,
    color: '#8DA3B0',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  locationIcon: {
    width: 80,
    height: 100,
    borderWidth: 4,
    borderColor: '#8DA3B0',
    borderRadius: 40,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomWidth: 0,
    position: 'relative',
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8DA3B0',
    transform: [{ rotate: '45deg' }],
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  allowButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
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
    left: 15,
    marginBottom: 20,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    fontSize: 64,
    color: '#005F99',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  permissionSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  permissionText: {
    fontSize: 18,
    color: '#005F99',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  locationIcon: {
    width: 80,
    height: 100,
    borderWidth: 4,
    borderColor: '#005F99',
    borderRadius: 40,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomWidth: 0,
    position: 'relative',
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#005F99',
    transform: [{ rotate: '45deg' }],
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  allowButton: {
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
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;