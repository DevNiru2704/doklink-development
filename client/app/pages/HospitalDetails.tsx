// app/pages/HospitalDetails.tsx
// Placeholder for hospital details screen

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function HospitalDetails() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams();
    const styles = getStyles(isDark);

    const hospitalId = params.hospitalId;

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#1a2332' : '#ffffff'}
            />
            <LinearGradient
                colors={
                    isDark
                        ? ['#020a0e', '#0a1520', '#020a0e']
                        : ['#f8fafc', '#ffffff', '#f1f5f9']
                }
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={isDark ? '#FFFFFF' : '#1F2937'}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hospital Details</Text>
                </View>

                <View style={styles.content}>
                    <Ionicons
                        name="business-outline"
                        size={64}
                        color={isDark ? '#4B5563' : '#9CA3AF'}
                    />
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                    <Text style={styles.messageText}>
                        Hospital details page will be available in the next update.
                    </Text>
                    <Text style={styles.idText}>Hospital ID: {hospitalId}</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const getStyles = (isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        gradient: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        comingSoonText: {
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginTop: 24,
            marginBottom: 12,
        },
        messageText: {
            fontSize: 16,
            color: isDark ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
            lineHeight: 24,
        },
        idText: {
            fontSize: 14,
            color: isDark ? '#6B7280' : '#9CA3AF',
            marginTop: 16,
        },
    });
