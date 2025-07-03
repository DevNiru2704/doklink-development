//AadhaarVerification.tsx styles
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
    marginBottom: 40,
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    tintColor: "#E2E8F0",
  },
  inputSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 18,
    color: "#E2E8F0",
    marginBottom: 20,
    textAlign: "center",
  },
  aadhaarInput: {
    width: "100%",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#374151",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 30,
  },
  otpSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  otpLabel: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    fontSize: 20,
    color: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#374151",
    textAlign: "center",
    fontWeight: "600",
  },
  otpInputDimmed: {
    backgroundColor: "#111827",
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: "#0c1118",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    minWidth: 200,
  },
  submitButtonText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  successStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  successText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  retryButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
  },
  proceedSection: {
    marginTop: 10,
    alignItems: "center",
  },
  countdownText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  loginLink: {
    marginTop: 30,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#9CA3AF",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  errorInput: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },
  // Error text style for validation messages
  errorText: {
    position: "relative",
    bottom: 28,
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
});

const light = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  gradientOverlay: {
    display: "none",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  inputSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 18,
    color: "#005F99",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  aadhaarInput: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  otpSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  otpLabel: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    fontSize: 20,
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    textAlign: "center",
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  otpInputDimmed: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    opacity: 0.7,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  successStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  successText: {
    color: "#15803d",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  retryButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  proceedSection: {
    marginTop: 10,
    alignItems: "center",
  },
  countdownText: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  loginLink: {
    marginTop: 30,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#6B7280",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  errorInput: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },
  // Error text style for validation messages
  errorText: {
    position: "relative",
    bottom: 28,
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
});

const useThemedStyles = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? dark : light;
};

export default useThemedStyles;
