import { Router } from "express";
import { AgentColarysController } from "../controllers/AgentColarysController";
import multer from "multer";
import path from "path";

const router = Router();

console.log("🔄 AgentColarysRoutes chargé"); // LOG

// Configuration Multer simplifiée pour Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

// Routes principales avec logging
router.get("/", (req, res) => {
  console.log("📥 GET /api/agents-colarys appelé");
  AgentColarysController.getAllAgents(req, res, (error) => {
    if (error) {
      console.error("❌ Erreur dans getAllAgents:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

router.get("/:id", AgentColarysController.getAgentById);
router.post("/", upload.single('image'), AgentColarysController.createAgent);
router.put("/:id", upload.single('image'), AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController.deleteAgent);

export default router;