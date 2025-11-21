"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CloudinaryService.ts
const cloudinary_1 = require("cloudinary");
class CloudinaryService {
    async uploadAgentImage(file) {
        return cloudinary_1.v2.uploader.upload(file.path, {
            folder: 'agents',
            transformation: { width: 500, height: 500, crop: 'limit' }
        });
    }
    async deleteImage(publicId) {
        return cloudinary_1.v2.uploader.destroy(publicId);
    }
}
