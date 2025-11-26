"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysController = void 0;
const AgentColarysService_1 = require("../services/AgentColarysService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const agentService = new AgentColarysService_1.AgentColarysService();
class AgentColarysController {
    static async getAllAgents(_req, res, next) {
        try {
            console.log("🔄 Controller: Getting all agents");
            const agents = await agentService.getAllAgents();
            const agentsWithFormattedImages = agents.map(agent => (Object.assign(Object.assign({}, agent), { displayImage: agent.getDisplayImage(), hasDefaultImage: agent.hasDefaultImage() })));
            res.json({
                success: true,
                data: agentsWithFormattedImages,
                count: agents.length
            });
        }
        catch (error) {
            console.error("❌ Controller Error getting all agents:", error);
            res.status(500).json({
                success: false,
                error: "Erreur serveur lors du chargement des agents",
                message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    }
    static async getAgentById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            console.log(`🔄 Controller: Getting agent with ID: ${id}`);
            const agent = await agentService.getAgentById(id);
            const agentWithFormattedImage = Object.assign(Object.assign({}, agent), { displayImage: agent.getDisplayImage(), hasDefaultImage: agent.hasDefaultImage() });
            res.json({
                success: true,
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error getting agent by ID:", error);
            if (error instanceof errorMiddleware_1.NotFoundError || error.message.includes("non trouvé")) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la récupération de l'agent",
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async createAgent(req, res, next) {
        try {
            const agentData = req.body;
            if (!agentData.image || agentData.image.includes('default-avatar')) {
                agentData.image = '/images/default-avatar.svg';
            }
            console.log("🔄 Controller: Creating new agent", {
                nom: agentData.nom,
                prenom: agentData.prenom,
                matricule: agentData.matricule,
                mail: agentData.mail,
                role: agentData.role,
                image: agentData.image
            });
            const newAgent = await agentService.createAgent(agentData);
            const agentWithFormattedImage = Object.assign(Object.assign({}, newAgent), { displayImage: newAgent.getDisplayImage(), hasDefaultImage: newAgent.hasDefaultImage() });
            res.status(201).json({
                success: true,
                message: "Agent créé avec succès",
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error creating agent:", error);
            if (error instanceof errorMiddleware_1.ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la création de l'agent",
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async updateAgent(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            const agentData = req.body;
            if (!agentData.image) {
                delete agentData.image;
                delete agentData.imagePublicId;
            }
            else if (agentData.image.includes('default-avatar')) {
                agentData.image = '/images/default-avatar.svg';
                agentData.imagePublicId = null;
            }
            console.log(`🔄 Controller: Updating agent ${id}`, {
                nom: agentData.nom,
                prenom: agentData.prenom,
                matricule: agentData.matricule,
                mail: agentData.mail,
                role: agentData.role,
                image: agentData.image
            });
            const updatedAgent = await agentService.updateAgent(id, agentData);
            const agentWithFormattedImage = Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.getDisplayImage(), hasDefaultImage: updatedAgent.hasDefaultImage() });
            res.json({
                success: true,
                message: "Agent modifié avec succès",
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error updating agent:", error);
            if (error instanceof errorMiddleware_1.NotFoundError) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            if (error instanceof errorMiddleware_1.ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la modification de l'agent",
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async deleteAgent(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            console.log(`🔄 Controller: Deleting agent ${id}`);
            await agentService.deleteAgent(id);
            res.json({
                success: true,
                message: "Agent supprimé avec succès"
            });
        }
        catch (error) {
            console.error("❌ Controller Error deleting agent:", error);
            if (error instanceof errorMiddleware_1.NotFoundError) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la suppression de l'agent",
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async uploadImage(req, res, next) {
        try {
            console.log("🔄 Upload image endpoint called");
            res.json({
                success: true,
                message: "Image upload simulé - avatar par défaut utilisé",
                data: {
                    imageUrl: '/images/default-avatar.svg',
                    filename: 'default-avatar.svg'
                }
            });
        }
        catch (error) {
            console.error("❌ Controller Error uploading image:", error);
            res.status(400).json({
                success: false,
                error: "Erreur lors de l'upload de l'image",
                message: error.message
            });
        }
    }
    static async healthCheck(_req, res) {
        try {
            console.log("🔍 Health check agents endpoint");
            const agents = await agentService.getAllAgents();
            res.json({
                success: true,
                message: "Service agents opérationnel",
                data: {
                    agentsCount: agents.length,
                    timestamp: new Date().toISOString(),
                    status: "healthy"
                }
            });
        }
        catch (error) {
            console.error("❌ Health check agents failed:", error);
            res.status(500).json({
                success: false,
                error: "Service agents non disponible",
                message: error.message,
                status: "unhealthy"
            });
        }
    }
    static async searchAgents(req, res) {
        try {
            const { query } = req.query;
            console.log(`🔍 Searching agents with query: ${query}`);
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: "Paramètre de recherche manquant"
                });
            }
            const allAgents = await agentService.getAllAgents();
            const filteredAgents = allAgents.filter(agent => {
                var _a, _b, _c, _d, _e;
                return ((_a = agent.nom) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query.toLowerCase())) ||
                    ((_b = agent.prenom) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(query.toLowerCase())) ||
                    ((_c = agent.matricule) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(query.toLowerCase())) ||
                    ((_d = agent.mail) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(query.toLowerCase())) ||
                    ((_e = agent.role) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes(query.toLowerCase()));
            });
            res.json({
                success: true,
                data: filteredAgents,
                count: filteredAgents.length
            });
        }
        catch (error) {
            console.error("❌ Controller Error searching agents:", error);
            res.status(500).json({
                success: false,
                error: "Erreur lors de la recherche des agents",
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async uploadAgentImage(req, res, next) {
        try {
            const agentId = parseInt(req.params.agentId);
            if (isNaN(agentId)) {
                return res.status(400).json({
                    success: false,
                    error: "ID agent invalide"
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "Aucun fichier image fourni"
                });
            }
            console.log(`🔄 Uploading real image for agent ${agentId}`);
            const updatedAgent = await agentService.uploadAgentImage(agentId, req.file.buffer);
            res.json({
                success: true,
                message: "Image uploadée avec succès",
                data: {
                    agent: Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.getDisplayImage(), hasDefaultImage: updatedAgent.hasDefaultImage() })
                }
            });
        }
        catch (error) {
            console.error("❌ Controller Error uploading agent image:", error);
            res.status(500).json({
                success: false,
                error: "Erreur lors de l'upload de l'image",
                message: error.message
            });
        }
    }
    static async deleteAgentImage(req, res, next) {
        try {
            const agentId = parseInt(req.params.agentId);
            if (isNaN(agentId)) {
                return res.status(400).json({
                    success: false,
                    error: "ID agent invalide"
                });
            }
            const updatedAgent = await agentService.deleteAgentImage(agentId);
            res.json({
                success: true,
                message: "Image supprimée avec succès",
                data: {
                    agent: Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.getDisplayImage(), hasDefaultImage: updatedAgent.hasDefaultImage() })
                }
            });
        }
        catch (error) {
            console.error("❌ Controller Error deleting agent image:", error);
            res.status(500).json({
                success: false,
                error: "Erreur lors de la suppression de l'image",
                message: error.message
            });
        }
    }
}
exports.AgentColarysController = AgentColarysController;
