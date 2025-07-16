import { StyleSheet, useColorScheme, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get('window');

const dark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  permissionContainer: {
    width: screenWidth,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(141, 163, 176, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#8DA3B0',
    width: 10,
    height: 10,
    borderRadius: 5,
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
  scrollView: {
    flex: 1,
  },
  permissionContainer: {
    width: screenWidth,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 95, 153, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#005F99',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;