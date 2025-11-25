import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";

const router = Router();

// ✅ Routes principales SANS multer pour Vercel
router.get("/", AgentColarysController.getAllAgents);
router.get("/search", AgentColarysController.searchAgents);
router.get("/health/check", AgentColarysController.healthCheck);
router.get("/:id", AgentColarysController.getAgentById);
router.post("/", AgentColarysController.createAgent);
router.put("/:id", AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

// Dans src/routes/agentColarysRoutes.ts - AJOUTER CETTE ROUTE
router.get("/search/agents", AgentColarysController.searchAgents);

// ✅ Route upload simplifiée (sans multer)
router.post("/upload-image", AgentColarysController.uploadImage);

export default router;