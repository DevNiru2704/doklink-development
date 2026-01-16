import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionState {
    location: PermissionStatus;
    files: PermissionStatus;
    isInitialized: boolean;
}

interface PermissionActions {
    setLocationPermission: (status: PermissionStatus) => void;
    setFilesPermission: (status: PermissionStatus) => void;
    checkLocationPermission: () => Promise<PermissionStatus>;
    checkFilesPermission: () => Promise<PermissionStatus>;
    initializePermissions: () => Promise<void>;
    syncPermissionsFromStorage: () => Promise<void>;
}

type PermissionStore = PermissionState & PermissionActions;

export const usePermissionStore = create<PermissionStore>((set, get) => ({
    // Initial state
    location: 'undetermined',
    files: 'undetermined',
    isInitialized: false,

    // Actions
    setLocationPermission: (status: PermissionStatus) => {
        set({ location: status });
        AsyncStorage.setItem('permission_location', status);
    },

    setFilesPermission: (status: PermissionStatus) => {
        set({ files: status });
        AsyncStorage.setItem('permission_files', status);
    },

    checkLocationPermission: async (): Promise<PermissionStatus> => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            const permissionStatus: PermissionStatus =
                status === 'granted' ? 'granted' :
                    status === 'denied' ? 'denied' : 'undetermined';

            // Update store and AsyncStorage
            set({ location: permissionStatus });
            await AsyncStorage.setItem('permission_location', permissionStatus);

            return permissionStatus;
        } catch (error) {
            console.error('Error checking location permission:', error);
            return 'undetermined';
        }
    },

    checkFilesPermission: async (): Promise<PermissionStatus> => {
        try {
            const mediaResult = await MediaLibrary.getPermissionsAsync();
            const imageResult = await ImagePicker.getMediaLibraryPermissionsAsync();

            const mediaGranted = mediaResult.status === 'granted';
            const imageGranted = imageResult.status === 'granted';

            const permissionStatus: PermissionStatus =
                (mediaGranted && imageGranted) ? 'granted' :
                    (mediaResult.status === 'denied' || imageResult.status === 'denied') ? 'denied' : 'undetermined';

            // Update store and AsyncStorage
            set({ files: permissionStatus });
            await AsyncStorage.setItem('permission_files', permissionStatus);

            return permissionStatus;
        } catch (error) {
            console.error('Error checking files permission:', error);
            return 'undetermined';
        }
    },

    initializePermissions: async () => {
        try {
            // Check actual system permissions
            const locationStatus = await get().checkLocationPermission();
            const filesStatus = await get().checkFilesPermission();

            set({
                location: locationStatus,
                files: filesStatus,
                isInitialized: true,
            });

            console.log('Permissions initialized:', { locationStatus, filesStatus });
        } catch (error) {
            console.error('Error initializing permissions:', error);
            set({ isInitialized: true });
        }
    },

    syncPermissionsFromStorage: async () => {
        try {
            const [locationStored, filesStored] = await Promise.all([
                AsyncStorage.getItem('permission_location'),
                AsyncStorage.getItem('permission_files'),
            ]);

            // Get actual system permissions
            const locationActual = await get().checkLocationPermission();
            const filesActual = await get().checkFilesPermission();

            // Use actual permissions (more reliable than stored values)
            set({
                location: locationActual,
                files: filesActual,
                isInitialized: true,
            });

            console.log('Permissions synced - Stored:', { locationStored, filesStored });
            console.log('Permissions synced - Actual:', { locationActual, filesActual });
        } catch (error) {
            console.error('Error syncing permissions from storage:', error);
            // Fallback to checking actual permissions
            await get().initializePermissions();
        }
    },
}));
