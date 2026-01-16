// components/signup/MiscellaneousSection.tsx
import React from "react";
import { View, Text, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MiscellaneousSectionProps } from "./types";

export default function MiscellaneousSection({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    styles,
    languages
}: MiscellaneousSectionProps) {

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Miscellaneous</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Preferred Language<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={[
                    styles.pickerContainer,
                    errors.language && touched.language && styles.errorInput
                ]}>
                    <Picker
                        selectedValue={values.language}
                        style={styles.picker}
                        onValueChange={(value) => setFieldValue("language", value)}
                        dropdownIconColor="#6B7280"
                    >
                        {languages.map((language, index) => (
                            <Picker.Item
                                key={index}
                                label={language}
                                value={language}
                            />
                        ))}
                    </Picker>
                </View>
                {errors.language && touched.language && (
                    <Text style={styles.errorText}>{errors.language}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter referral code"
                    placeholderTextColor="#6B7280"
                    value={values.referralCode}
                    onChangeText={handleChange("referralCode")}
                    onBlur={handleBlur("referralCode")}
                />
            </View>
        </View>
    );
}
