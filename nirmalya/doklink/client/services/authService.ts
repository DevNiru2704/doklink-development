// services/authService.ts
import apiClient, {
  SignUpRequest,
  SignUpResponse,
  LoginResponse,
  OTPRequest,
  OTPResponse,
  VerificationStatus,
  User,
  INDIAN_STATES,
  API_ENDPOINTS,
  UsernameOTPOptionsResponse,
  LoginOTPRequest,
  LoginOTPResponse,
  ForgotPasswordOTPRequest,
  ForgotPasswordOTPResponse
} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Store authentication tokens
  async storeTokens(tokens: { access: string; refresh: string }) {
    try {
      await AsyncStorage.multiSet([
        ['accessToken', tokens.access],
        ['refreshToken', tokens.refresh],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  // Clear authentication tokens
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Store user data
  async storeUser(user: User) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Get stored user data
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch {
      return false;
    }
  }

  // Sign up new user
  async signUp(signUpData: any): Promise<SignUpResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SIGNUP, signUpData);

      const result = response.data as SignUpResponse;

      // Store tokens and user data
      await this.storeTokens(result.tokens);
      await this.storeUser(result.user);

      return result;
    } catch (error: any) {
      console.error('SignUp Error:', error);
      console.error('SignUp Error Response:', error.response?.data);
      console.error('SignUp Error Status:', error.response?.status);

      // Handle different error types
      if (error.response?.data) {
        const errorData = error.response.data;

        // Format validation errors for better UX
        if (errorData.email) {
          throw new Error(`Email: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`);
        }
        if (errorData.username) {
          throw new Error(`Username: ${Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username}`);
        }
        if (errorData.phone_number) {
          throw new Error(`Phone: ${Array.isArray(errorData.phone_number) ? errorData.phone_number.join(', ') : errorData.phone_number}`);
        }
        if (errorData.aadhaar_number) {
          throw new Error(`Aadhaar: ${Array.isArray(errorData.aadhaar_number) ? errorData.aadhaar_number.join(', ') : errorData.aadhaar_number}`);
        }
        if (errorData.permanent_address) {
          throw new Error(`Address: ${JSON.stringify(errorData.permanent_address)}`);
        }
        if (errorData.non_field_errors) {
          throw new Error(`${Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors}`);
        }

        // Show all errors if available
        if (typeof errorData === 'object') {
          const allErrors = Object.entries(errorData).map(([field, errors]) => {
            const errorList = Array.isArray(errors) ? errors : [errors];
            return `${field}: ${errorList.join(', ')}`;
          }).join('\n');
          throw new Error(allErrors);
        }

        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // Login user with enhanced authentication (phone/email/username + password/OTP)
  async login(loginData: {
    login_field: string;
    login_method: 'phone' | 'email' | 'username';
    auth_mode: 'password' | 'otp';
    password?: string;
    otp_code?: string;
  }): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, loginData);

      const result = response.data as LoginResponse;

      // Store tokens and user data
      await this.storeTokens(result.tokens);
      await this.storeUser(result.user);

      return result;
    } catch (error: any) {
      console.error('Login Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle specific authentication errors
        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        if (errorData.login_field) {
          throw new Error(Array.isArray(errorData.login_field)
            ? errorData.login_field.join(', ')
            : errorData.login_field);
        }

        if (errorData.otp_code) {
          throw new Error(Array.isArray(errorData.otp_code)
            ? errorData.otp_code.join(', ')
            : errorData.otp_code);
        }

        throw new Error(errorData.error || errorData.message || 'Login failed');
      }

      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  // Logout user
  async logout() {
    try {
      // Clear local storage
      await this.clearTokens();

      // Note: You might want to call a logout endpoint here to invalidate tokens on server
      // await apiClient.post('/logout/');

    } catch (error) {
      console.error('Logout Error:', error);
      // Still clear local tokens even if server logout fails
      await this.clearTokens();
    }
  }

  // Get user profile
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROFILE);
      const user = response.data as User;

      // Update stored user data
      await this.storeUser(user);

      return user;
    } catch (error: any) {
      console.error('Get Profile Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  }

  // Update user profile
  async updateProfile(profileData: Partial<SignUpRequest>): Promise<User> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.PROFILE, profileData);
      const result = response.data as any;

      // Update stored user data
      await this.storeUser(result.user);

      return result.user;
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }

  // Send email OTP (automatically called after signup)
  async sendEmailOTP(): Promise<OTPResponse> {
    try {
      // Email OTP is automatically sent during signup
      // This endpoint might be for resending
      const response = await apiClient.post('/send-email-otp/');
      return response.data as OTPResponse;
    } catch (error: any) {
      console.error('Send Email OTP Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to send email OTP');
    }
  }

  // Verify email with OTP
  async verifyEmail(otpData: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_EMAIL, otpData);

      // Update stored user data to reflect email verification
      const user = await this.getStoredUser();
      if (user) {
        user.profile.email_verified = true;
        await this.storeUser(user);
      }

      return response.data as OTPResponse;
    } catch (error: any) {
      console.error('Verify Email Error:', error);
      throw new Error(error.response?.data?.error || 'Email verification failed');
    }
  }

  // Send phone OTP
  async sendPhoneOTP(): Promise<OTPResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_PHONE_OTP);
      return response.data as OTPResponse;
    } catch (error: any) {
      console.error('Send Phone OTP Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to send phone OTP');
    }
  }

  // Verify phone with OTP
  async verifyPhone(otpData: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_PHONE, otpData);

      // Update stored user data to reflect phone verification
      const user = await this.getStoredUser();
      if (user) {
        user.profile.phone_verified = true;
        await this.storeUser(user);
      }

      return response.data as OTPResponse;
    } catch (error: any) {
      console.error('Verify Phone Error:', error);
      throw new Error(error.response?.data?.error || 'Phone verification failed');
    }
  }

  // Check verification status
  async getVerificationStatus(): Promise<VerificationStatus> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHECK_VERIFICATION_STATUS);
      return response.data as VerificationStatus;
    } catch (error: any) {
      console.error('Get Verification Status Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get verification status');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD_REQUEST, { email });
      return response.data as { message: string };
    } catch (error: any) {
      console.error('Request Password Reset Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to request password reset');
    }
  }

  // Get OTP delivery options for username login
  async getUsernameOTPOptions(username: string): Promise<UsernameOTPOptionsResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GET_USERNAME_OTP_OPTIONS, { username });
      return response.data as UsernameOTPOptionsResponse;
    } catch (error: any) {
      console.error('Get Username OTP Options Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;
        throw new Error(errorData.error || errorData.message || 'Failed to get OTP options');
      }

      throw new Error(error.message || 'Failed to get OTP options. Please try again.');
    }
  }

  // Send login OTP for authentication (Enhanced version)
  async sendLoginOTP(data: LoginOTPRequest): Promise<LoginOTPResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_LOGIN_OTP, data);
      return response.data as LoginOTPResponse;
    } catch (error: any) {
      console.error('Send Login OTP Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        if (errorData.login_field) {
          throw new Error(Array.isArray(errorData.login_field)
            ? errorData.login_field.join(', ')
            : errorData.login_field);
        }

        throw new Error(errorData.error || errorData.message || 'Failed to send login OTP');
      }

      throw new Error(error.message || 'Failed to send login OTP. Please try again.');
    }
  }

  // Legacy method for backward compatibility
  async sendLoginOTPLegacy(data: {
    login_field: string;
    login_method: 'phone' | 'email' | 'username';
  }): Promise<{ message: string; expires_in: number }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_LOGIN_OTP, data);
      return response.data as { message: string; expires_in: number };
    } catch (error: any) {
      console.error('Send Login OTP Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        if (errorData.login_field) {
          throw new Error(Array.isArray(errorData.login_field)
            ? errorData.login_field.join(', ')
            : errorData.login_field);
        }

        throw new Error(errorData.error || errorData.message || 'Failed to send login OTP');
      }

      throw new Error(error.message || 'Failed to send login OTP. Please try again.');
    }
  }

  // Verify login OTP and authenticate user
  async verifyLoginOTP(data: {
    login_field: string;
    login_method: 'phone' | 'email' | 'username';
    otp_code: string;
  }): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_LOGIN_OTP, data);

      const result = response.data as LoginResponse;

      // Store tokens and user data
      await this.storeTokens(result.tokens);
      await this.storeUser(result.user);

      return result;
    } catch (error: any) {
      console.error('Verify Login OTP Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        if (errorData.otp_code) {
          throw new Error(Array.isArray(errorData.otp_code)
            ? errorData.otp_code.join(', ')
            : errorData.otp_code);
        }

        throw new Error(errorData.error || errorData.message || 'Invalid OTP');
      }

      throw new Error(error.message || 'OTP verification failed. Please try again.');
    }
  }

  // Send forgot password OTP (Enhanced version)
  async sendForgotPasswordOTP(data: ForgotPasswordOTPRequest): Promise<ForgotPasswordOTPResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_FORGOT_PASSWORD_OTP, data);
      return response.data as ForgotPasswordOTPResponse;
    } catch (error: any) {
      console.error('Send Forgot Password OTP Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        if (errorData.login_field) {
          throw new Error(Array.isArray(errorData.login_field)
            ? errorData.login_field.join(', ')
            : errorData.login_field);
        }

        throw new Error(errorData.error || errorData.message || 'Failed to send password reset OTP');
      }

      throw new Error(error.message || 'Failed to send password reset OTP. Please try again.');
    }
  }

  // Verify forgot password OTP
  async verifyForgotPasswordOTP(data: {
    login_field: string;
    login_method: 'phone' | 'email' | 'username';
    otp_code: string;
  }): Promise<{ message: string; reset_token: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_FORGOT_PASSWORD_OTP, data);
      return response.data as { message: string; reset_token: string };
    } catch (error: any) {
      console.error('Verify Forgot Password OTP Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.otp_code) {
          throw new Error(Array.isArray(errorData.otp_code)
            ? errorData.otp_code.join(', ')
            : errorData.otp_code);
        }

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        throw new Error(errorData.error || errorData.message || 'OTP verification failed');
      }

      throw new Error(error.message || 'OTP verification failed. Please try again.');
    }
  }

  // Confirm password reset with new password
  async confirmPasswordReset(data: {
    reset_token: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CONFIRM_PASSWORD_RESET, data);
      return response.data as { message: string };
    } catch (error: any) {
      console.error('Confirm Password Reset Error:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.new_password) {
          throw new Error(Array.isArray(errorData.new_password)
            ? errorData.new_password.join(', ')
            : errorData.new_password);
        }

        if (errorData.confirm_password) {
          throw new Error(Array.isArray(errorData.confirm_password)
            ? errorData.confirm_password.join(', ')
            : errorData.confirm_password);
        }

        if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors);
        }

        throw new Error(errorData.error || errorData.message || 'Password reset failed');
      }

      throw new Error(error.message || 'Password reset failed. Please try again.');
    }
  }

  // Transform SignUp form data to API format
  transformSignUpData(formValues: any): any {
    // Clean and format phone number
    const cleanPhone = formValues.phoneNumber.replace(/[^\d+]/g, ''); // Remove spaces, dashes etc
    let formattedPhone = '';

    if (cleanPhone.startsWith('+91')) {
      formattedPhone = cleanPhone; // Already has +91
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      formattedPhone = `+${cleanPhone}`; // Add + to make it +91
    } else if (cleanPhone.length === 10) {
      formattedPhone = `+91${cleanPhone}`; // Add +91 prefix
    } else {
      formattedPhone = `+91${cleanPhone}`; // Default case
    }

    // Convert date to YYYY-MM-DD format (Django requirement)
    const convertToISODate = (dateString: string): string => {
      if (!dateString) return '';

      let birthDate: Date;

      // Detect date format and parse accordingly (same logic as frontend validation)
      if (dateString.includes('/')) {
        // Check if it's DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
        const parts = dateString.split('/');

        if (parts.length !== 3) return dateString; // Return as-is if invalid

        const [first, second, third] = parts.map(p => parseInt(p, 10));

        // Check for invalid numbers
        if (isNaN(first) || isNaN(second) || isNaN(third)) return dateString;

        // Determine format based on values
        if (third > 31 && third > 12) {
          // Third part is year (YYYY/MM/DD or YYYY/DD/MM)
          if (second > 12) {
            // YYYY/DD/MM format
            birthDate = new Date(third, first - 1, second);
          } else {
            // YYYY/MM/DD format
            birthDate = new Date(third, second - 1, first);
          }
        } else if (first > 31 || (first > 12 && second <= 12)) {
          // First part is year (YYYY/MM/DD)
          birthDate = new Date(first, second - 1, third);
        } else if (first > 12 && second <= 12) {
          // DD/MM/YYYY format (most common from en-GB locale)
          birthDate = new Date(third, second - 1, first);
        } else if (second > 12) {
          // MM/DD/YYYY format
          birthDate = new Date(third, first - 1, second);
        } else {
          // Ambiguous case, assume DD/MM/YYYY (common in many countries)
          birthDate = new Date(third, second - 1, first);
        }
      } else if (dateString.includes('-')) {
        // ISO format YYYY-MM-DD or variants
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;

        const [first, second, third] = parts.map(p => parseInt(p, 10));

        if (isNaN(first) || isNaN(second) || isNaN(third)) return dateString;

        if (first > 31) {
          // YYYY-MM-DD format (already correct)
          return dateString;
        } else {
          // DD-MM-YYYY format
          birthDate = new Date(third, second - 1, first);
        }
      } else {
        // Try to parse as-is
        birthDate = new Date(dateString);
      }

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return dateString; // Return as-is if invalid

      // Convert to YYYY-MM-DD format
      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    return {
      // Basic User Info - match Django serializer field names exactly
      name: formValues.name.trim(), // Django expects 'name', not first_name/last_name
      email: formValues.email.toLowerCase().trim(),
      username: formValues.username.toLowerCase().trim(),
      password: formValues.password,
      confirm_password: formValues.confirmPassword, // Django expects 'confirm_password'

      // Profile Info
      phone_number: formattedPhone,
      dob: convertToISODate(formValues.dob), // Convert to YYYY-MM-DD format
      profile_picture: formValues.profilePicture?.url || null, // Cloudinary URL
      aadhaar_number: formValues.aadhaarNumber,

      // Address Info
      permanent_address: {
        address: formValues.permanentAddress.address.trim(),
        state: formValues.permanentAddress.state,
        city: formValues.permanentAddress.city.trim(),
        pin: formValues.permanentAddress.pin,
      },
      current_address: formValues.sameAsPermanent
        ? {
          address: formValues.permanentAddress.address.trim(),
          state: formValues.permanentAddress.state,
          city: formValues.permanentAddress.city.trim(),
          pin: formValues.permanentAddress.pin,
        }
        : {
          address: formValues.currentAddress.address.trim(),
          state: formValues.currentAddress.state,
          city: formValues.currentAddress.city.trim(),
          pin: formValues.currentAddress.pin,
        },
      same_as_permanent: formValues.sameAsPermanent,

      // Preferences
      language: formValues.language, // Django expects 'language', not 'preferred_language'
      referral_code: formValues.referralCode?.trim() || undefined,

      // Agreements - Django expects 'agreements' as a dict
      agreements: formValues.agreements,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export Indian states for convenience
export { INDIAN_STATES };

export default authService;
