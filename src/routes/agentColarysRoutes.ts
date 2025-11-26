// src/routes/agentColarysRoutes.ts
import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";
import { upload } from "../config/multer"; // ✅ Import depuis le nouveau fichier

const router = Router();

// Routes existantes
router.get("/", AgentColarysController.getAllAgents);
router.get("/search", AgentColarysController.searchAgents);
router.get("/health/check", AgentColarysController.healthCheck);
router.get("/:id", AgentColarysController.getAgentById);
router.post("/", AgentColarysController.createAgent);
router.put("/:id", AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

// ✅ Route upload avec Multer
router.post("/:agentId/upload-image", upload.single('image'), AgentColarysController.uploadAgentImage);
router.delete("/:agentId/image", AgentColarysController.deleteAgentImage);

// Route de recherche
router.get("/search/agents", AgentColarysController.searchAgents);

export default router;