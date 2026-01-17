// components/signup/PersonalInfoSection.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { PersonalInfoSectionProps } from "./types";

interface PersonalInfoSectionPropsExtended extends PersonalInfoSectionProps {
    aadhaarNumber: string;
    genderOptions: { label: string; value: string }[];
    pronounOptions: { label: string; value: string }[];
}

export default function PersonalInfoSection({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    styles,
    showDatePicker,
    selectedDate,
    setShowDatePicker,
    onDateChange,
    aadhaarNumber,
    genderOptions,
    pronounOptions
}: PersonalInfoSectionPropsExtended) {

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Aadhaar Number<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                    style={[styles.textInput, styles.disabledInput]}
                    value={aadhaarNumber}
                    editable={false}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Date of Birth<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                    style={[
                        styles.textInput,
                        styles.dateInput,
                        errors.dob && touched.dob && styles.errorInput
                    ]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text
                        style={[
                            styles.dateText,
                            !values.dob && styles.placeholderText,
                        ]}
                    >
                        {values.dob || "Select Date of Birth"}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {errors.dob && touched.dob && (
                    <Text style={styles.errorText}>{errors.dob}</Text>
                )}
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => onDateChange(event, selectedDate, setFieldValue)}
                        maximumDate={new Date()}
                    />
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Phone Number<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.phoneInputContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            styles.phoneInput,
                            errors.phoneNumber && touched.phoneNumber && styles.errorInput
                        ]}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="#6B7280"
                        value={values.phoneNumber}
                        onChangeText={handleChange("phoneNumber")}
                        onBlur={handleBlur("phoneNumber")}
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
                {errors.phoneNumber && touched.phoneNumber && (
                    <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Gender<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={[styles.textInput, styles.pickerContainer, errors.gender && touched.gender && styles.errorInput]}>
                    <Picker
                        selectedValue={values.gender}
                        onValueChange={(value) => setFieldValue("gender", value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Gender" value="" />
                        {genderOptions.map((option) => (
                            <Picker.Item
                                key={option.value}
                                label={option.label}
                                value={option.value}
                            />
                        ))}
                    </Picker>
                </View>
                {errors.gender && touched.gender && (
                    <Text style={styles.errorText}>{errors.gender}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Preferred Pronoun/Title<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={[styles.textInput, styles.pickerContainer, errors.pronoun && touched.pronoun && styles.errorInput]}>
                    <Picker
                        selectedValue={values.pronoun}
                        onValueChange={(value) => setFieldValue("pronoun", value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Pronoun" value="" />
                        {pronounOptions.map((option) => (
                            <Picker.Item
                                key={option.value}
                                label={option.label}
                                value={option.value}
                            />
                        ))}
                    </Picker>
                </View>
                {errors.pronoun && touched.pronoun && (
                    <Text style={styles.errorText}>{errors.pronoun}</Text>
                )}
            </View>
        </View>
    );
}