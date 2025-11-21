"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/planningRoutes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const PlanningController_1 = require("../controllers/PlanningController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/', PlanningController_1.PlanningController.getPlannings);
router.post('/upload', upload.single('file'), PlanningController_1.PlanningController.uploadPlanning);
router.get('/weeks', PlanningController_1.PlanningController.getAvailableWeeks);
router.get('/agents', PlanningController_1.PlanningController.getAvailableAgents);
router.get('/months', PlanningController_1.PlanningController.getAvailableMonths);
router.get('/years', PlanningController_1.PlanningController.getAvailableYears); // Ajoutez cette ligne
router.get('/stats', PlanningController_1.PlanningController.getStats);
router.delete('/delete-all', PlanningController_1.PlanningController.deleteAllPlannings);
exports.default = router;
