"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AgentColarysController_1 = require("../controllers/AgentColarysController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../public/uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path_1.default.extname(file.originalname);
        cb(null, 'agent-' + uniqueSuffix + fileExtension);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Seules les images sont autorisées!'), false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});
router.get("/", AgentColarysController_1.AgentColarysController.getAllAgents);
router.get("/:id", AgentColarysController_1.AgentColarysController.getAgentById);
router.post("/", upload.single('image'), AgentColarysController_1.AgentColarysController.createAgent);
router.put("/:id", upload.single('image'), AgentColarysController_1.AgentColarysController.updateAgent);
router.delete("/:id", AgentColarysController_1.AgentColarysController.deleteAgent);
router.post("/upload-image", upload.single('image'), AgentColarysController_1.AgentColarysController.uploadImage);
exports.default = router;
