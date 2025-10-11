// config/cloudinary.ts
// Cloudinary Configuration fetched from backend
import axios from 'axios';

// API Configuration - same as api.ts
const API_BASE_URL = __DEV__
  ? 'http://10.245.195.230:8000'  // Your computer's IP for Expo Go
  : 'https://your-production-domain.com';  // Production

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

interface CloudinaryConfigResponse {
  success: boolean;
  config: CloudinaryConfig;
  error?: string;
}

// This will be populated by fetchCloudinaryConfig()
let cloudinaryConfig: CloudinaryConfig | null = null;

/**
 * Fetch Cloudinary configuration from backend
 * This ensures credentials are stored securely on the server
 */
export async function fetchCloudinaryConfig(): Promise<CloudinaryConfig> {
  try {
    // Use the backend API endpoint with axios
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/cloudinary-config/`);

    const data = response.data as CloudinaryConfigResponse;

    if (!data.success) {
      throw new Error(data.error || 'Failed to get Cloudinary configuration');
    }

    // Cache the config
    cloudinaryConfig = data.config;

    console.log('✅ Cloudinary config loaded from backend');
    return cloudinaryConfig as CloudinaryConfig;

  } catch (error) {
    console.error('❌ Failed to fetch Cloudinary config:', error);
    throw new Error('Could not load Cloudinary configuration. Please check your connection.');
  }
}

/**
 * Get cached Cloudinary config
 * Call fetchCloudinaryConfig() first to populate the cache
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  if (!cloudinaryConfig) {
    throw new Error('Cloudinary config not loaded. Call fetchCloudinaryConfig() first.');
  }
  return cloudinaryConfig;
}

// Instructions for setting up Cloudinary on the backend:
/*
1. Add these to your .env file on the server:
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_UPLOAD_PRESET=doklink_upload_preset
   CLOUDINARY_FOLDER=doklink/profile_pictures

2. Create an unsigned upload preset in Cloudinary Dashboard:
   - Go to Settings > Upload > Upload presets
   - Click "Add upload preset"
   - Name: doklink_upload_preset
   - Signing Mode: "Unsigned"
   - Save the preset

3. The frontend will fetch config securely from the backend API
*/
