"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// src/middleware/uploadMiddleware.ts
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: async (req, file) => {
        return {
            folder: "agents", // 📂 dossier Cloudinary
            format: file.mimetype.split("/")[1], // jpg, png, etc.
            public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
        };
    },
});
exports.upload = (0, multer_1.default)({ storage });
