//SignUp.tsx styles
import { StyleSheet, useColorScheme } from "react-native";

const dark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1F2937",
    borderWidth: 2,
    borderColor: "#374151",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0c1118",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#374151",
    zIndex: 10,
    elevation: 10,
  },
  profileLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },

  // Section Styles
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#E2E8F0",
    fontWeight: "600",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    color: "#E2E8F0",
    fontWeight: "500",
    marginBottom: 15,
    marginTop: 10,
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginTop:20,
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#374151",
  },
  disabledInput: {
    backgroundColor: "#111827",
    opacity: 0.7,
    color: "#6B7280",
  },
  addressInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCode: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#374151",
    marginRight: 12,
    minWidth: 60,
    textAlign: "center",
  },
  phoneInput: {
    flex: 1,
  },

  // Password Input
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  // Row Container
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Picker Styles
  pickerContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  picker: {
    color: "#E2E8F0",
    backgroundColor: "transparent",
    height: 50,
  },

  // Checkbox Styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#374151",
    backgroundColor: "transparent",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#E2E8F0",
    flex: 1,
    lineHeight: 20,
  },

  // Button Styles
  signUpButton: {
    backgroundColor: "#0c1118",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
  },
  signUpButtonText: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Spacing
  bottomSpacing: {
    height: 50,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#E2E8F0",
    fontSize: 16,
  },
  placeholderText: {
    color: "#6B7280",
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    color: "#3B82F6",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  requiredAsterisk: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  loginLinkText: {
    color: "#8DA3B0",
    fontSize: 14,
    fontWeight: "500",
  },
  // Error styles
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderColor: "#DC2626",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom:8,
  },
  agreementErrorText: {
    position: "relative",
    bottom: 10,
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 32,
  },
  errorInput: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },
});

const light = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  gradientOverlay: {
    display: "none", // No gradient overlay in light mode
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: "#005F99",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#005F99",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 10,
    elevation: 10,
  },
  profileLabel: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Section Styles
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#005F99",
    fontWeight: "600",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 15,
    marginTop: 10,
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledInput: {
    backgroundColor: "#F9FAFB",
    opacity: 0.7,
    color: "#9CA3AF",
  },
  addressInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCode: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 12,
    minWidth: 60,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  phoneInput: {
    flex: 1,
  },

  // Password Input
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  // Row Container
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Picker Styles
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    color: "#1F2937",
    backgroundColor: "transparent",
    height: 50,
  },

  // Checkbox Styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#005F99",
    borderColor: "#005F99",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
    lineHeight: 20,
  },

  // Button Styles
  signUpButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Spacing
  bottomSpacing: {
    height: 50,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#1F2937",
    fontSize: 16,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    color: "#005F99",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  requiredAsterisk: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  loginLinkText: {
    color: "#005F99",
    fontSize: 14,
    fontWeight: "500",
  },
  // Error styles
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderColor: "#DC2626",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  agreementErrorText: {
    position: "relative", 
    bottom: 10,
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 32,
  },
  errorInput: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;
