// src/routes/adminRoutes.ts
import express from "express";
import { seedAgents } from "../scripts/seedAgents";

const router = express.Router();

// Route sécurisée pour exécuter le seeding (uniquement en développement)
router.post("/seed-agents", async (req, res) => {
  // ✅ Sécuriser cette route en production
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_SECRET) {
    return res.status(403).json({ 
      success: false, 
      error: "Seeding not allowed in production" 
    });
  }

  // Vérifier le secret d'administration si défini
  if (process.env.ADMIN_SECRET && req.headers.authorization !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized" 
    });
  }

  try {
    console.log("🔄 Manual seeding triggered via API");
    await seedAgents();
    res.json({ 
      success: true, 
      message: "Seeding completed successfully" 
    });
  } catch (error) {
    console.error("❌ Manual seeding failed:", error);
    res.status(500).json({ 
      success: false, 
      error: "Seeding failed" 
    });
  }
});

export default router;