// src/config/multer.ts
import multer from 'multer';

// Configuration pour l'upload en mémoire (nécessaire pour Vercel)
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: any, cb: any) => {
  // Vérifier le type de fichier
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});