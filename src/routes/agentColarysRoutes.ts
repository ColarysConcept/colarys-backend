import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";
import { upload } from "../config/multer";

const router = Router();

// ========== ROUTES SANS PARAMÈTRES ==========
router.get("/", AgentColarysController.getAllAgents);
router.get("/search", AgentColarysController.searchAgents);
router.get("/health/check", AgentColarysController.healthCheck);
router.get("/search/agents", AgentColarysController.searchAgents);

router.post("/", AgentColarysController.createAgent);
router.post("/upload-image", AgentColarysController.uploadImage);

// ========== ROUTES AVEC PARAMÈTRES SPÉCIFIQUES ==========
// ✅ IMPORTANT: Ces routes doivent être AVANT les routes :id génériques
router.post("/:agentId/upload-image", upload.single('image'), AgentColarysController.uploadAgentImage);
router.delete("/:agentId/image", AgentColarysController.deleteAgentImage);

// ========== ROUTES AVEC PARAMÈTRES GÉNÉRIQUES ==========
router.get("/:id", AgentColarysController.getAgentById);
router.put("/:id", AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

export default router;