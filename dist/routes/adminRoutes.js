"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const seedAgents_1 = require("../scripts/seedAgents");
const router = express_1.default.Router();
router.post("/seed-agents", async (req, res) => {
    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_SECRET) {
        return res.status(403).json({
            success: false,
            error: "Seeding not allowed in production"
        });
    }
    if (process.env.ADMIN_SECRET && req.headers.authorization !== process.env.ADMIN_SECRET) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized"
        });
    }
    try {
        console.log("🔄 Manual seeding triggered via API");
        await (0, seedAgents_1.seedAgents)();
        res.json({
            success: true,
            message: "Seeding completed successfully"
        });
    }
    catch (error) {
        console.error("❌ Manual seeding failed:", error);
        res.status(500).json({
            success: false,
            error: "Seeding failed"
        });
    }
});
exports.default = router;
