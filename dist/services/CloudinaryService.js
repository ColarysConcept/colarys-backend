"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
class CloudinaryService {
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: 'dmqcvee8v',
            api_key: '561123273342425',
            api_secret: 'cGd2WxDfnB3LEDpXcixqInxaaiY',
        });
    }
    async uploadImage(fileBuffer, folder = 'colarys-agents') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 150, height: 150, crop: 'fill' },
                    { quality: 'auto' },
                    { format: 'webp' }
                ]
            }, (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                }
                else if (result) {
                    console.log('✅ Image uploaded to Cloudinary:', result.public_id);
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
                else {
                    reject(new Error('No result from Cloudinary'));
                }
            });
            uploadStream.end(fileBuffer);
        });
    }
    async deleteImage(publicId) {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.destroy(publicId, (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary delete error:', error);
                    reject(error);
                }
                else {
                    console.log('✅ Image deleted from Cloudinary:', publicId);
                    resolve();
                }
            });
        });
    }
}
exports.CloudinaryService = CloudinaryService;
