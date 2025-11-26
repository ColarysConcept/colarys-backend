// src/routes/agentColarysRoutes.ts
import { Router } from 'express';
import { AgentColarysController } from '../controllers/AgentColarysController';
import { upload } from '../config/multer';

const router = Router();

// Routes existantes...
router.get('/', AgentColarysController.getAllAgents);
router.get('/:id', AgentColarysController.getAgentById);
router.post('/', AgentColarysController.createAgent);
router.put('/:id', AgentColarysController.updateAgent);
router.delete('/:id', AgentColarysController.deleteAgent);

// 🔥 NOUVELLES ROUTES POUR LES IMAGES
router.post(
  '/:agentId/upload-image',
  upload.single('image'), // Middleware multer pour gérer le fichier
  AgentColarysController.uploadAgentImage
);

router.delete(
  '/:agentId/delete-image',
  AgentColarysController.deleteAgentImage
);

export default router;