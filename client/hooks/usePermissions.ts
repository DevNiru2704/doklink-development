import { useEffect } from 'react';
import { usePermissionStore, PermissionStatus } from '../store/permissionStore';

/**
 * Custom hook to access and manage permissions throughout the app
 * This syncs the permission state on mount and provides easy access to permission status
 */
export const usePermissions = () => {
    const {
        location,
        files,
        isInitialized,
        checkLocationPermission,
        checkFilesPermission,
        setLocationPermission,
        setFilesPermission,
        initializePermissions,
        syncPermissionsFromStorage,
    } = usePermissionStore();

    // Initialize permissions when hook is first used
    useEffect(() => {
        if (!isInitialized) {
            initializePermissions();
        }
    }, [isInitialized, initializePermissions]);

    // Refresh permissions (useful when returning from settings)
    const refreshPermissions = async () => {
        await initializePermissions();
    };

    return {
        // Permission states
        locationPermission: location,
        filesPermission: files,
        isPermissionsInitialized: isInitialized,

        // Permission checkers
        checkLocationPermission,
        checkFilesPermission,

        // Permission setters
        setLocationPermission,
        setFilesPermission,

        // Utilities
        refreshPermissions,
        syncPermissionsFromStorage,

        // Convenience booleans
        hasLocationPermission: location === 'granted',
        hasFilesPermission: files === 'granted',
        allPermissionsGranted: location === 'granted' && files === 'granted',
    };
};
