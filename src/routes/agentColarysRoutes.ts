// src/routes/agentColarysRoutes.ts
import { Router } from 'express';
import { AgentColarysController } from '../controllers/AgentColarysController';
import { upload } from '../config/multer';

const router = Router();

// Routes principales AVEC support multipart pour les images
router.get('/', AgentColarysController.getAllAgents);
router.get('/:id', AgentColarysController.getAgentById);
router.post('/', upload.single('image'), AgentColarysController.createAgent); // ✅ Ajouter multer ici
router.put('/:id', upload.single('image'), AgentColarysController.updateAgent); // ✅ Ajouter multer ici
router.delete('/:id', AgentColarysController.deleteAgent);

// Routes spécifiques pour les images
router.post(
  '/:agentId/upload-image',
  upload.single('image'),
  AgentColarysController.uploadAgentImage
);

router.delete(
  '/:agentId/delete-image',
  AgentColarysController.deleteAgentImage
);

// Route de recherche
router.get('/search/query', AgentColarysController.searchAgents);

export default router;