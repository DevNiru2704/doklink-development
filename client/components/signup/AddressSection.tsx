// components/signup/AddressSection.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AddressSectionProps } from "./types";

export default function AddressSection({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    styles,
    indianStates,
    handleSameAsPermament
}: AddressSectionProps) {

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            {/* Permanent Address */}
            <Text style={styles.subsectionTitle}>
                Permanent Address<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <View style={styles.inputGroup}>
                <TextInput
                    style={[
                        styles.textInput,
                        styles.addressInput,
                        errors.permanentAddress?.address && touched.permanentAddress?.address && styles.errorInput
                    ]}
                    placeholder="Enter your permanent address"
                    placeholderTextColor="#6B7280"
                    value={values.permanentAddress.address}
                    onChangeText={handleChange("permanentAddress.address")}
                    onBlur={handleBlur("permanentAddress.address")}
                    multiline
                    numberOfLines={3}
                />
                {errors.permanentAddress?.address && touched.permanentAddress?.address && (
                    <Text style={styles.errorText}>{errors.permanentAddress.address}</Text>
                )}
            </View>

            <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>
                        State<Text style={styles.requiredAsterisk}> *</Text>
                    </Text>
                    <View style={[
                        styles.pickerContainer,
                        errors.permanentAddress?.state && touched.permanentAddress?.state && styles.errorInput
                    ]}>
                        <Picker
                            selectedValue={values.permanentAddress.state}
                            style={styles.picker}
                            onValueChange={(value) => setFieldValue("permanentAddress.state", value)}
                            dropdownIconColor="#6B7280"
                        >
                            {indianStates.map((state, index) => (
                                <Picker.Item key={index} label={state} value={state} />
                            ))}
                        </Picker>
                    </View>
                    {errors.permanentAddress?.state && touched.permanentAddress?.state && (
                        <Text style={styles.errorText}>{errors.permanentAddress.state}</Text>
                    )}
                </View>

                <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>
                        City<Text style={styles.requiredAsterisk}> *</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            errors.permanentAddress?.city && touched.permanentAddress?.city && styles.errorInput
                        ]}
                        placeholder="Enter city"
                        placeholderTextColor="#6B7280"
                        value={values.permanentAddress.city}
                        onChangeText={handleChange("permanentAddress.city")}
                        onBlur={handleBlur("permanentAddress.city")}
                    />
                    {errors.permanentAddress?.city && touched.permanentAddress?.city && (
                        <Text style={styles.errorText}>{errors.permanentAddress.city}</Text>
                    )}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    PIN Code<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                    style={[
                        styles.textInput,
                        errors.permanentAddress?.pin && touched.permanentAddress?.pin && styles.errorInput
                    ]}
                    placeholder="Enter PIN code"
                    placeholderTextColor="#6B7280"
                    value={values.permanentAddress.pin}
                    onChangeText={handleChange("permanentAddress.pin")}
                    onBlur={handleBlur("permanentAddress.pin")}
                    keyboardType="numeric"
                    maxLength={6}
                />
                {errors.permanentAddress?.pin && touched.permanentAddress?.pin && (
                    <Text style={styles.errorText}>{errors.permanentAddress.pin}</Text>
                )}
            </View>

            {/* Current Address */}
            <View style={styles.subsectionDivider} />
            <Text style={styles.subsectionTitle}>Current Address</Text>

            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleSameAsPermament(!values.sameAsPermanent)}
            >
                <View style={[styles.checkbox, values.sameAsPermanent && styles.checkedBox]}>
                    {values.sameAsPermanent && (
                        <Text style={styles.checkmark}>✓</Text>
                    )}
                </View>
                <Text style={styles.checkboxLabel}>
                    Same as Permanent Address
                </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
                <TextInput
                    style={[
                        styles.textInput,
                        styles.addressInput,
                        values.sameAsPermanent && styles.disabledInput,
                        errors.currentAddress?.address && touched.currentAddress?.address && styles.errorInput
                    ]}
                    placeholder="Enter your current address"
                    placeholderTextColor="#6B7280"
                    value={values.currentAddress.address}
                    onChangeText={handleChange("currentAddress.address")}
                    onBlur={handleBlur("currentAddress.address")}
                    multiline
                    numberOfLines={3}
                    editable={!values.sameAsPermanent}
                />
                {errors.currentAddress?.address && touched.currentAddress?.address && (
                    <Text style={styles.errorText}>{errors.currentAddress.address}</Text>
                )}
            </View>

            <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>State</Text>
                    <View style={[
                        styles.pickerContainer,
                        errors.currentAddress?.state && touched.currentAddress?.state && styles.errorInput
                    ]}>
                        <Picker
                            selectedValue={values.currentAddress.state}
                            style={styles.picker}
                            onValueChange={(value) => setFieldValue("currentAddress.state", value)}
                            dropdownIconColor="#6B7280"
                            enabled={!values.sameAsPermanent}
                        >
                            {indianStates.map((state, index) => (
                                <Picker.Item key={index} label={state} value={state} />
                            ))}
                        </Picker>
                    </View>
                    {errors.currentAddress?.state && touched.currentAddress?.state && (
                        <Text style={styles.errorText}>{errors.currentAddress.state}</Text>
                    )}
                </View>

                <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            values.sameAsPermanent && styles.disabledInput,
                            errors.currentAddress?.city && touched.currentAddress?.city && styles.errorInput
                        ]}
                        placeholder="Enter city"
                        placeholderTextColor="#6B7280"
                        value={values.currentAddress.city}
                        onChangeText={handleChange("currentAddress.city")}
                        onBlur={handleBlur("currentAddress.city")}
                        editable={!values.sameAsPermanent}
                    />
                    {errors.currentAddress?.city && touched.currentAddress?.city && (
                        <Text style={styles.errorText}>{errors.currentAddress.city}</Text>
                    )}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput
                    style={[
                        styles.textInput,
                        values.sameAsPermanent && styles.disabledInput,
                        errors.currentAddress?.pin && touched.currentAddress?.pin && styles.errorInput
                    ]}
                    placeholder="Enter PIN code"
                    placeholderTextColor="#6B7280"
                    value={values.currentAddress.pin}
                    onChangeText={handleChange("currentAddress.pin")}
                    onBlur={handleBlur("currentAddress.pin")}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!values.sameAsPermanent}
                />
                {errors.currentAddress?.pin && touched.currentAddress?.pin && (
                    <Text style={styles.errorText}>{errors.currentAddress.pin}</Text>
                )}
            </View>
        </View>
    );
}
