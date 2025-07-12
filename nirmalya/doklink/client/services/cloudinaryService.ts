// services/cloudinaryService.ts
import { fetchCloudinaryConfig, CloudinaryConfig } from '../config/cloudinary';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
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
   * Upload image to Cloudinary
   * @param imageUri - Local image URI from ImagePicker
   * @param username - Username to use as filename
   * @returns Promise with Cloudinary URL
   */
  async uploadImage(imageUri: string, username: string): Promise<string> {
    try {
      // Ensure service is initialized
      await this.initialize();
      const config = this.getConfig();
      
      // Create public_id with username and folder
      const publicId = `${config.folder}/${username}`;
      
      // Prepare form data for unsigned upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${username}.jpg`,
      } as any);
      
      formData.append('upload_preset', config.uploadPreset);
      formData.append('public_id', publicId);
      
      console.log('📋 Upload parameters:', {
        cloudName: config.cloudName,
        publicId,
        uploadPreset: config.uploadPreset,
        imageUri: imageUri.substring(0, 50) + '...'
      });

      // Upload to Cloudinary (unsigned upload)
      console.log('🚀 Uploading to Cloudinary...');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary error response:', errorText);
        throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result: CloudinaryUploadResponse = await response.json();
      
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
