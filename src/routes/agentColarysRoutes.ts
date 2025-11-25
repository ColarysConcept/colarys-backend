import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";
import multer from "multer";

const router = Router();

// 🔥 CORRECTION : Configuration Multer pour memory storage (Cloudinary)
const storage = multer.memoryStorage(); // 🔥 CHANGEMENT CRITIQUE

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

const upload = multer({
  storage: storage, // 🔥 UTILISE memoryStorage POUR CLOUDINARY
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Routes principales
router.get("/", AgentColarysController.getAllAgents);
router.get("/:id", AgentColarysController.getAgentById);
router.post("/", upload.single('image'), AgentColarysController.createAgent);
router.put("/:id", upload.single('image'), AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

// Route dédiée pour l'upload d'image seule
router.post("/upload-image", upload.single('image'), AgentColarysController.uploadImage);

export default router;