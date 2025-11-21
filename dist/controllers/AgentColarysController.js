"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysController = void 0;
const AgentColarysService_1 = require("../services/AgentColarysService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const agentService = new AgentColarysService_1.AgentColarysService();
class AgentColarysController {
    static async getAllAgents(_req, res, next) {
        try {
            console.log("🔄 Controller: Getting all agents");
            const agents = await agentService.getAllAgents();
            res.json({
                success: true,
                data: agents,
                count: agents.length
            });
        }
        catch (error) {
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
    static async getAgentById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new errorMiddleware_1.ValidationError("ID invalide");
            }
            console.log(`🔄 Controller: Getting agent with ID: ${id}`);
            const agent = await agentService.getAgentById(id);
            res.json({
                success: true,
                data: agent
            });
        }
        catch (error) {
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
    static async createAgent(req, res, next) {
        try {
            const agentData = req.body;
            // Gérer l'upload d'image
            if (req.file) {
                agentData.image = `/uploads/${req.file.filename}`;
            }
            else if (req.body.image) {
                // Si une URL d'image est fournie, l'utiliser directement
                agentData.image = req.body.image;
            }
            console.log("🔄 Controller: Creating new agent", agentData);
            const newAgent = await agentService.createAgent(agentData);
            res.status(201).json({
                success: true,
                message: "Agent créé avec succès",
                data: newAgent
            });
        }
        catch (error) {
            // Supprimer le fichier uploadé en cas d'erreur
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
    static async updateAgent(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new errorMiddleware_1.ValidationError("ID invalide");
            }
            const agentData = req.body;
            let oldImagePath = null;
            // Récupérer l'ancienne image pour la supprimer plus tard si nécessaire
            const existingAgent = await agentService.getAgentById(id);
            if (existingAgent && existingAgent.image && existingAgent.image.startsWith('/uploads/')) {
                oldImagePath = path_1.default.join(__dirname, '../public', existingAgent.image);
            }
            // Gérer l'upload d'image
            if (req.file) {
                agentData.image = `/uploads/${req.file.filename}`;
            }
            else if (req.body.image) {
                // Si une URL d'image est fournie, l'utiliser directement
                agentData.image = req.body.image;
            }
            console.log(`🔄 Controller: Updating agent ${id}`, agentData);
            const updatedAgent = await agentService.updateAgent(id, agentData);
            // Supprimer l'ancienne image si une nouvelle a été uploadée
            if (req.file && oldImagePath && fs_1.default.existsSync(oldImagePath)) {
                fs_1.default.unlinkSync(oldImagePath);
            }
            res.json({
                success: true,
                message: "Agent modifié avec succès",
                data: updatedAgent
            });
        }
        catch (error) {
            // Supprimer le fichier uploadé en cas d'erreur
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
    static async deleteAgent(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new errorMiddleware_1.ValidationError("ID invalide");
            }
            // Récupérer l'agent pour supprimer son image
            const agent = await agentService.getAgentById(id);
            let imagePath = null;
            if (agent.image && agent.image.startsWith('/uploads/')) {
                imagePath = path_1.default.join(__dirname, '../public', agent.image);
            }
            console.log(`🔄 Controller: Deleting agent ${id}`);
            await agentService.deleteAgent(id);
            // Supprimer l'image associée
            if (imagePath && fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
            res.status(200).json({
                success: true,
                message: "Agent supprimé avec succès"
            });
        }
        catch (error) {
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
    // Endpoint pour uploader une image seule
    static async uploadImage(req, res, next) {
        try {
            if (!req.file) {
                throw new errorMiddleware_1.ValidationError("Aucun fichier uploadé");
            }
            const imageUrl = `/uploads/${req.file.filename}`;
            res.json({
                success: true,
                message: "Image uploadée avec succès",
                data: {
                    imageUrl: imageUrl,
                    filename: req.file.filename
                }
            });
        }
        catch (error) {
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            console.error("❌ Controller Error:", error);
            next(error);
        }
    }
}
exports.AgentColarysController = AgentColarysController;
