import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";
import { upload } from "../app"; // Import depuis app.ts

const router = Router();

// Routes existantes
router.get("/", AgentColarysController.getAllAgents);
router.get("/search", AgentColarysController.searchAgents);
router.get("/health/check", AgentColarysController.healthCheck);
router.get("/:id", AgentColarysController.getAgentById);
router.post("/", AgentColarysController.createAgent);
router.put("/:id", AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

// ✅ NOUVELLES ROUTES POUR LES IMAGES RÉELLES
router.post("/:agentId/upload-image", upload.single('image'), AgentColarysController.uploadAgentImage);
router.delete("/:agentId/image", AgentColarysController.deleteAgentImage);

// Route de recherche
router.get("/search/agents", AgentColarysController.searchAgents);

export default router;