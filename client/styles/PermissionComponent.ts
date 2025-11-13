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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  brandName: {
    fontSize: 42,
    color: '#8DA3B0',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  permissionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#8DA3B0',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 12,
  },
  allowButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#0c1118',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  brandName: {
    fontSize: 42,
    color: '#005F99',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  permissionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#005F99',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 12,
  },
  allowButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;