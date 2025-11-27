import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dmqcvee8v',
      api_key: '561123273342425',
      api_secret: 'cGd2WxDfnB3LEDpXcixqInxaaiY',
    });
  }

  // Dans src/services/CloudinaryService.ts - MODIFIEZ uploadImage
async uploadImage(fileBuffer: Buffer, folder: string = 'colarys-agents'): Promise<{url: string, publicId: string}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 150, height: 150, crop: 'fill' }, // ✅ TAILLE OPTIMISÉE POUR LES CARTES
          { quality: 'auto' },
          { format: 'webp' } // ✅ FORMAT MODERNE PLUS LÉGER
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log('✅ Image uploaded to Cloudinary:', result.public_id);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } else {
          reject(new Error('No result from Cloudinary'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error('❌ Cloudinary delete error:', error);
          reject(error);
        } else {
          console.log('✅ Image deleted from Cloudinary:', publicId);
          resolve();
        }
      });
    });
  }
}