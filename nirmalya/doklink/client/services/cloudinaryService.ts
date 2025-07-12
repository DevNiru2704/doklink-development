// services/cloudinaryService.ts
import { fetchCloudinaryConfig, CloudinaryConfig } from '../config/cloudinary';
import axios from 'axios';

// API Configuration - same as api.ts
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.101:8000'  // Your computer's IP for Expo Go
  : 'https://your-production-domain.com';  // Production

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

interface CloudinarySignatureResponse {
  success: boolean;
  signature: string;
  apiKey: string;
  error?: string;
}

class CloudinaryService {
  private config: CloudinaryConfig | null = null;
  
  /**
   * Initialize Cloudinary service by fetching config from backend
   */
  async initialize(): Promise<void> {
    if (!this.config) {
      this.config = await fetchCloudinaryConfig();
    }
  }
  
  /**
   * Get current config, throw error if not initialized
   */
  private getConfig(): CloudinaryConfig {
    if (!this.config) {
      throw new Error('CloudinaryService not initialized. Call initialize() first.');
    }
    return this.config;
  }
    /**
   * Upload image to Cloudinary using signed upload
   * @param imageUri - Local image URI from ImagePicker
   * @param username - Username to use as filename
   * @returns Promise with Cloudinary URL
   */
  async uploadImage(imageUri: string, username: string): Promise<string> {
    try {
      // Ensure service is initialized
      await this.initialize();
      const config = this.getConfig();
      
      // Generate timestamp
      const timestamp = Math.round(Date.now() / 1000);
      
      // Create public_id with username and folder
      const publicId = `${config.folder}/${username}`;
      
      console.log('🔐 Generating signature for signed upload...');
      
      // Get signature from backend using axios
      const signatureResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/cloudinary-signature/`, {
        timestamp: timestamp,
        public_id: publicId,
        upload_preset: config.uploadPreset,
        folder: config.folder
      });
      
      const signatureData = signatureResponse.data as CloudinarySignatureResponse;
      
      if (!signatureData.success) {
        throw new Error(signatureData.error || 'Failed to generate signature');
      }
      
      console.log('✅ Signature generated successfully');
      
      // Prepare form data for signed upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${username}.jpg`,
      } as any);
      
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('upload_preset', config.uploadPreset);
      formData.append('folder', config.folder);
      formData.append('api_key', signatureData.apiKey);  // API_KEY from backend
      formData.append('signature', signatureData.signature);
      
      console.log('📋 Upload parameters:', {
        cloudName: config.cloudName,
        publicId,
        uploadPreset: config.uploadPreset,
        timestamp,
        signatureLength: signatureData.signature.length,
        apiKeyLength: signatureData.apiKey.length  // Show API_KEY length for verification
      });

      // Upload to Cloudinary (signed upload)
      console.log('🚀 Uploading to Cloudinary with signature...');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      const result: CloudinaryUploadResponse = response.data as CloudinaryUploadResponse;
      
      console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
      return result.secure_url;
      
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
