// components/signup/AgreementsSection.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AgreementsSectionProps } from "./types";

export default function AgreementsSection({
    values,
    errors,
    touched,
    setFieldValue,
    styles,
    handleTermsPress,
    handlePrivacyPress,
    handleConsentPress
}: AgreementsSectionProps) {

    const agreements = [
        {
            key: "termsConditions",
            label: "I agree to ",
            linkText: "Terms & Conditions",
            onPress: handleTermsPress,
            required: true,
        },
        {
            key: "privacyPolicy",
            label: "I agree to ",
            linkText: "Privacy Policy",
            onPress: handlePrivacyPress,
            required: true,
        },
        {
            key: "dataConsent",
            label: "I consent to ",
            linkText: "Data Collection Consent Form",
            onPress: handleConsentPress,
            required: true,
        },
        {
            key: "notifications",
            label: "Send me notifications about offers and news",
            required: false,
        },
    ];

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agreements</Text>

            {agreements.map((agreement) => (
                <View key={agreement.key}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() =>
                            setFieldValue(
                                `agreements.${agreement.key}`,
                                !values.agreements[agreement.key as keyof typeof values.agreements]
                            )
                        }
                    >
                        <View
                            style={[
                                styles.checkbox,
                                values.agreements[agreement.key as keyof typeof values.agreements] && styles.checkedBox,
                            ]}
                        >
                            {values.agreements[agreement.key as keyof typeof values.agreements] && (
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                        </View>
                        <View style={styles.checkboxTextContainer}>
                            <Text style={styles.checkboxLabel}>
                                {agreement.label}
                                {agreement.linkText && (
                                    <Text
                                        style={styles.linkText}
                                        onPress={agreement.onPress}
                                    >
                                        {agreement.linkText}
                                    </Text>
                                )}
                                {agreement.required && (
                                    <Text style={styles.requiredAsterisk}> *</Text>
                                )}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {agreement.required && (
                        <>
                            {errors.agreements?.[agreement.key as keyof typeof errors.agreements] &&
                                touched.agreements?.[agreement.key as keyof typeof touched.agreements] && (
                                    <Text style={styles.agreementErrorText}>
                                        {errors.agreements[agreement.key as keyof typeof errors.agreements]}
                                    </Text>
                                )}
                        </>
                    )}
                </View>
            ))}
        </View>
    );
}
