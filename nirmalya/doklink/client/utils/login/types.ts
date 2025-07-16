// Types
export type LoginMethodType = "phone" | "email" | "username";
export type LoginModeType = "password" | "otp";
export type ForgotPasswordStep = "send_otp" | "verify_otp" | "reset_password";
export type ScreenType = "method_selection" | "login_form" | "forgot_password" | "username_otp_choice" | "forgot_password_otp_choice";
export type DeliveryMethodType = "email" | "sms";

// Form values interfaces
export interface LoginFormValues {
  loginField: string;
  password: string;
  otp: string;
  mode: LoginModeType;
  method: LoginMethodType;
  general?: string;
}

export interface ForgotPasswordFormValues {
  loginField: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  step: ForgotPasswordStep;
  method: LoginMethodType;
  general?: string;
}

// OTP delivery option interface
export interface OTPDeliveryOption {
  method: 'email' | 'sms';
  display: string;
  destination: string;
  description: string;
}

// Common props interface for components
export interface LoginComponentProps {
  colorScheme: any;
  styles: any;
  loginMethod: LoginMethodType;
  setLoginMethod: (method: LoginMethodType) => void;
  loginMode: LoginModeType;
  setLoginMode: (mode: LoginModeType) => void;
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isResendLoading: boolean;
  setIsResendLoading: (loading: boolean) => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  countdown: number;
  setCountdown: (count: number) => void;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
  resendTimer: number;
  setResendTimer: (timer: number) => void;
  showResendButton: boolean;
  setShowResendButton: (show: boolean) => void;
  otp: string[];
  setOtp: (otp: string[]) => void;
  forgotPasswordOtp: string[];
  setForgotPasswordOtp: (otp: string[]) => void;
  usernameOTPOptions: OTPDeliveryOption[];
  setUsernameOTPOptions: (options: OTPDeliveryOption[]) => void;
  selectedDeliveryMethod: DeliveryMethodType | null;
  setSelectedDeliveryMethod: (method: DeliveryMethodType | null) => void;
  isLoadingOTPOptions: boolean;
  setIsLoadingOTPOptions: (loading: boolean) => void;
  currentUsername: string;
  setCurrentUsername: (username: string) => void;
  forgotPasswordStep: ForgotPasswordStep;
  setForgotPasswordStep: (step: ForgotPasswordStep) => void;
  resetToken: string;
  setResetToken: (token: string) => void;
  currentLoginField: string;
  setCurrentLoginField: (field: string) => void;
  clearOtpData: () => void;
  onSignUp: () => void;
}