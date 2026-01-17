// components/signup/types.ts
export interface SignUpFormValues {
    name: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    dob: string;
    phoneNumber: string;
    gender: string;
    pronoun: string;
    profilePicture: any;
    permanentAddress: {
        address: string;
        state: string;
        city: string;
        pin: string;
    };
    currentAddress: {
        address: string;
        state: string;
        city: string;
        pin: string;
    };
    sameAsPermanent: boolean;
    language: string;
    referralCode: string;
    agreements: {
        termsConditions: boolean;
        privacyPolicy: boolean;
        dataConsent: boolean;
        notifications: boolean;
    };
}

export interface SignUpComponentProps {
    values: SignUpFormValues;
    errors: any;
    touched: any;
    handleChange: any;
    handleBlur: any;
    setFieldValue: (field: string, value: any) => void;
    colorScheme: 'light' | 'dark' | null | undefined;
    styles: any;
}

export interface ProfilePictureSectionProps extends Pick<SignUpComponentProps, 'values' | 'setFieldValue' | 'colorScheme' | 'styles'> {
    setStatus?: (status: any) => void;
}

export interface BasicInfoSectionProps extends SignUpComponentProps {
    showPassword: boolean;
    showConfirmPassword: boolean;
    setShowPassword: (show: boolean) => void;
    setShowConfirmPassword: (show: boolean) => void;
    handleEmailChange: (text: string) => void;
}

export interface PersonalInfoSectionProps extends SignUpComponentProps {
    showDatePicker: boolean;
    selectedDate: Date;
    setShowDatePicker: (show: boolean) => void;
    onDateChange: (event: any, selectedDate?: Date, setFieldValue?: (field: string, value: any) => void) => void;
}

export interface AddressSectionProps extends SignUpComponentProps {
    indianStates: string[];
    handleSameAsPermament: (value: boolean) => void;
}

export interface MiscellaneousSectionProps extends SignUpComponentProps {
    languages: string[];
}

export interface AgreementsSectionProps extends SignUpComponentProps {
    handleTermsPress: () => void;
    handlePrivacyPress: () => void;
    handleConsentPress: () => void;
}
