// components/signup/BasicInfoSection.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BasicInfoSectionProps } from "./types";

export default function BasicInfoSection({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    styles,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleEmailChange
}: BasicInfoSectionProps) {

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Full Name<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                    style={[
                        styles.textInput,
                        errors.name && touched.name && styles.errorInput
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#6B7280"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                />
                {errors.name && touched.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Email Address<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                    style={[
                        styles.textInput,
                        errors.email && touched.email && styles.errorInput
                    ]}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#6B7280"
                    value={values.email}
                    onChangeText={handleEmailChange}
                    onBlur={handleBlur("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Username<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <TextInput
                    style={[
                        styles.textInput,
                        styles.disabledInput,
                        errors.username && touched.username && styles.errorInput
                    ]}
                    placeholder="Auto-generated from email"
                    placeholderTextColor="#6B7280"
                    value={values.username}
                    editable={false}
                />
                {errors.username && touched.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Password<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[
                            styles.textInput,
                            styles.passwordInput,
                            errors.password && touched.password && styles.errorInput
                        ]}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor="#6B7280"
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                </View>
                {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    Confirm Password<Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[
                            styles.textInput,
                            styles.passwordInput,
                            errors.confirmPassword && touched.confirmPassword && styles.errorInput
                        ]}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#6B7280"
                        value={values.confirmPassword}
                        onChangeText={handleChange("confirmPassword")}
                        onBlur={handleBlur("confirmPassword")}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
            </View>
        </View>
    );
}
