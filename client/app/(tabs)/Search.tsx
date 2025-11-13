import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface Hospital {
    place_id: string;
    name: string;
    vicinity: string;
    rating?: number;
    user_ratings_total?: number;
    distance?: number;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    opening_hours?: {
        open_now: boolean;
    };
    formatted_phone_number?: string;
}

export default function Search() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState(false);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationPermission(true);
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });
            } else {
                Alert.alert(
                    'Location Permission',
                    'Please enable location permission to search nearby hospitals'
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    const searchNearbyHospitals = async () => {
        if (!userLocation) {
            Alert.alert('Location Required', 'Please enable location to search nearby hospitals');
            return;
        }

        setLoading(true);
        try {
            // Call backend proxy endpoint (API key is secure on backend)
            const apiClient = (await import('../../config/api')).default;
            const radius = 5000; // 5km radius in meters

            const response = await apiClient.get(
                `/healthcare/hospitals/search_google/?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=${radius}`
            );

            const data = response.data;

            if (data.status === 'OK' && data.results) {
                // Calculate distance for each hospital
                const hospitalsWithDistance = data.results.map((hospital: Hospital) => {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        hospital.geometry.location.lat,
                        hospital.geometry.location.lng
                    );
                    return { ...hospital, distance };
                });

                // Sort by distance
                hospitalsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
                setHospitals(hospitalsWithDistance);
            } else {
                Alert.alert('Error', `Failed to fetch hospitals: ${data.status || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Error searching hospitals:', error);
            const errorMessage = error.response?.data?.error || 'Failed to search hospitals. Please check your internet connection.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        // Haversine formula for distance calculation
        const R = 6371; // Radius of Earth in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const toRad = (value: number): number => {
        return (value * Math.PI) / 180;
    };

    const openInMaps = (hospital: Hospital) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${hospital.geometry.location.lat},${hospital.geometry.location.lng}&query_place_id=${hospital.place_id}`;
        Linking.openURL(url);
    };

    const callHospital = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                    Find Hospitals
                </Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Search nearby hospitals
                </Text>
            </View>

            {/* Search Button */}
            <View style={styles.searchSection}>
                <TouchableOpacity
                    style={[
                        styles.searchButton,
                        !locationPermission && styles.searchButtonDisabled,
                    ]}
                    onPress={searchNearbyHospitals}
                    disabled={!locationPermission || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="search" size={20} color="#ffffff" />
                            <Text style={styles.searchButtonText}>Search Nearby Hospitals</Text>
                        </>
                    )}
                </TouchableOpacity>
                {!locationPermission && (
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestLocationPermission}
                    >
                        <Ionicons name="location-outline" size={16} color="#3b82f6" />
                        <Text style={styles.permissionText}>Enable Location</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            <ScrollView style={styles.content}>
                {hospitals.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color={isDark ? '#374151' : '#d1d5db'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            Tap search to find nearby hospitals
                        </Text>
                    </View>
                )}

                {hospitals.map((hospital) => (
                    <View
                        key={hospital.place_id}
                        style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="business" size={24} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.hospitalName, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                    {hospital.name}
                                </Text>
                                <Text style={[styles.hospitalAddress, { color: isDark ? '#d1d5db' : '#374151' }]}>
                                    {hospital.vicinity}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardDetails}>
                            {hospital.distance && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="navigate" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                                    <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {hospital.distance.toFixed(2)} km away
                                    </Text>
                                </View>
                            )}
                            {hospital.rating && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="star" size={16} color="#f59e0b" />
                                    <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                        {hospital.rating} ({hospital.user_ratings_total || 0} reviews)
                                    </Text>
                                </View>
                            )}
                            {hospital.opening_hours && (
                                <View style={styles.detailRow}>
                                    <Ionicons
                                        name="time"
                                        size={16}
                                        color={hospital.opening_hours.open_now ? '#10b981' : '#ef4444'}
                                    />
                                    <Text
                                        style={[
                                            styles.detailText,
                                            {
                                                color: hospital.opening_hours.open_now ? '#10b981' : '#ef4444',
                                            },
                                        ]}
                                    >
                                        {hospital.opening_hours.open_now ? 'Open Now' : 'Closed'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.directionsButton]}
                                onPress={() => openInMaps(hospital)}
                            >
                                <Ionicons name="navigate-outline" size={18} color="#ffffff" />
                                <Text style={styles.actionButtonText}>Directions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    searchSection: {
        padding: 16,
    },
    searchButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    searchButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    searchButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    permissionText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    hospitalAddress: {
        fontSize: 14,
    },
    cardDetails: {
        marginBottom: 12,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    directionsButton: {
        backgroundColor: '#3b82f6',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
