import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { User } from '../../config/api';
import { useRouter } from 'expo-router';

export default function MySpace() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const storedUser = await authService.getStoredUser();
                setUser(storedUser);
            } catch {
                setUser(null);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await authService.logout();
        // Navigate back to login - you'll need to implement this based on your navigation
        router.replace('/');
    };

    const menuItems = [
        {
            icon: 'eye-outline',
            title: 'View Profile',
            subtitle: 'View all your information',
            route: '/pages/profile/ViewProfile'
        },
        {
            icon: 'person-outline',
            title: 'Profile Settings',
            subtitle: 'Edit your personal information',
            route: '/pages/profile/ProfileSettings'
        },
        {
            icon: 'document-text-outline',
            title: 'Medical Records',
            subtitle: 'View your health records',
            route: '/pages/profile/MedicalRecords'
        },
        {
            icon: 'card-outline',
            title: 'Insurance',
            subtitle: 'Manage your insurance policies',
            route: '/pages/profile/InsuranceManagement'
        },
        {
            icon: 'notifications-outline',
            title: 'Notifications',
            subtitle: 'Manage notification preferences',
            route: null
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Privacy & Security',
            subtitle: 'Control your privacy settings',
            route: null
        },
        {
            icon: 'help-circle-outline',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            route: null
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Profile Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <Image
                    source={
                        user?.profile?.profile_picture
                            ? { uri: user.profile.profile_picture }
                            : require('../../assets/images/default.png')
                    }
                    style={styles.profilePicture}
                />
                <Text style={[styles.userName, { color: isDark ? '#ffffff' : '#111827' }]}>
                    {user?.first_name} {user?.last_name}
                </Text>
                <Text style={[styles.userEmail, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {user?.email}
                </Text>
                <Text style={[styles.userPhone, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {user?.profile?.phone_number}
                </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.menuItem, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                        onPress={() => item.route && router.push(item.route as any)}
                        disabled={!item.route}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <Ionicons name={item.icon as any} size={24} color="#3b82f6" />
                            </View>
                            <View style={styles.menuItemText}>
                                <Text style={[styles.menuItemTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.menuItemSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {item.subtitle}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {/* App Version */}
            <Text style={[styles.version, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                Version 1.0.0
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        padding: 32,
        paddingTop: 60,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#3b82f6',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
    },
    menuSection: {
        padding: 16,
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ef4444',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginBottom: 32,
    },
});
