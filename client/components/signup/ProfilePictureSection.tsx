// components/signup/ProfilePictureSection.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ProfilePictureSectionProps } from "./types";

export default function ProfilePictureSection({
    values,
    setFieldValue,
    styles,
    setStatus
}: ProfilePictureSectionProps) {

    const selectProfilePicture = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            if (setStatus) {
                setStatus({
                    type: 'error',
                    message: "Please grant camera roll permissions to select a profile picture."
                });
            }
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFieldValue("profilePicture", { uri: result.assets[0].uri });
        }
    };

    return (
        <View style={styles.profileSection}>
            <TouchableOpacity
                style={styles.profilePictureContainer}
                onPress={selectProfilePicture}
                activeOpacity={0.7}
            >
                <Image
                    source={values.profilePicture}
                    style={styles.profilePicture}
                />
                <View style={styles.editIconContainer}>
                    <Ionicons name="camera" size={16} color="#E2E8F0" />
                </View>
            </TouchableOpacity>
            <Text style={styles.profileLabel}>Profile Picture</Text>
        </View>
    );
}
