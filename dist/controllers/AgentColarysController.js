"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysController = void 0;
const AgentColarysService_1 = require("../services/AgentColarysService");
class AgentColarysController {
    static async getAllAgents(_req, res) {
        try {
            console.log("🔄 Controller: Getting all agents");
            const agentService = new AgentColarysService_1.AgentColarysService();
            const agents = await agentService.getAllAgents();
            const agentsWithFormattedImages = agents.map(agent => (Object.assign(Object.assign({}, agent), { displayImage: agent.image && !agent.image.includes('default-avatar')
                    ? agent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !agent.image || agent.image.includes('default-avatar') })));
            res.json({
                success: true,
                data: agentsWithFormattedImages,
                count: agents.length
            });
        }
        catch (error) {
            console.error("❌ Controller Error getting all agents:", error);
            if (error.message.includes("Database")) {
                return res.status(503).json({
                    success: false,
                    error: "Database unavailable",
                    message: "Service temporarily unavailable"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur serveur lors du chargement des agents",
                message: error.message
            });
        }
    }
    static async getAgentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            console.log(`🔄 Controller: Getting agent with ID: ${id}`);
            const agentService = new AgentColarysService_1.AgentColarysService();
            const agent = await agentService.getAgentById(id);
            const agentWithFormattedImage = Object.assign(Object.assign({}, agent), { displayImage: agent.image && !agent.image.includes('default-avatar')
                    ? agent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !agent.image || agent.image.includes('default-avatar') });
            res.json({
                success: true,
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error getting agent by ID:", error);
            if (error.message.includes("non trouvé") || error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la récupération de l'agent",
                message: error.message
            });
        }
    }
    static async createAgent(req, res) {
        try {
            const agentData = req.body;
            const agentService = new AgentColarysService_1.AgentColarysService();
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
            const agentWithFormattedImage = Object.assign(Object.assign({}, newAgent), { displayImage: newAgent.image && !newAgent.image.includes('default-avatar')
                    ? newAgent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !newAgent.image || newAgent.image.includes('default-avatar') });
            res.status(201).json({
                success: true,
                message: "Agent créé avec succès",
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error creating agent:", error);
            if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
                return res.status(400).json({
                    success: false,
                    error: "Le matricule ou l'email existe déjà"
                });
            }
            if (error.message.includes("champs obligatoires") || error.message.includes("required")) {
                return res.status(400).json({
                    success: false,
                    error: "Tous les champs obligatoires doivent être remplis"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la création de l'agent",
                message: error.message
            });
        }
    }
    static async updateAgent(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            const agentData = req.body;
            const agentService = new AgentColarysService_1.AgentColarysService();
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
            const agentWithFormattedImage = Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.image && !updatedAgent.image.includes('default-avatar')
                    ? updatedAgent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar') });
            res.json({
                success: true,
                message: "Agent modifié avec succès",
                data: agentWithFormattedImage
            });
        }
        catch (error) {
            console.error("❌ Controller Error updating agent:", error);
            if (error.message.includes("non trouvé") || error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
                return res.status(400).json({
                    success: false,
                    error: "Le matricule ou l'email existe déjà pour un autre agent"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la modification de l'agent",
                message: error.message
            });
        }
    }
    static async deleteAgent(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "ID invalide"
                });
            }
            console.log(`🔄 Controller: Deleting agent ${id}`);
            const agentService = new AgentColarysService_1.AgentColarysService();
            await agentService.deleteAgent(id);
            res.json({
                success: true,
                message: "Agent supprimé avec succès"
            });
        }
        catch (error) {
            console.error("❌ Controller Error deleting agent:", error);
            if (error.message.includes("non trouvé") || error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: "Agent non trouvé"
                });
            }
            res.status(500).json({
                success: false,
                error: "Erreur lors de la suppression de l'agent",
                message: error.message
            });
        }
    }
    static async uploadImage(req, res) {
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
            const agentService = new AgentColarysService_1.AgentColarysService();
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
            const agentService = new AgentColarysService_1.AgentColarysService();
            const allAgents = await agentService.getAllAgents();
            const filteredAgents = allAgents.filter(agent => {
                var _a, _b, _c, _d, _e;
                return ((_a = agent.nom) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query.toLowerCase())) ||
                    ((_b = agent.prenom) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(query.toLowerCase())) ||
                    ((_c = agent.matricule) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(query.toLowerCase())) ||
                    ((_d = agent.mail) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(query.toLowerCase())) ||
                    ((_e = agent.role) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes(query.toLowerCase()));
            });
            const agentsWithFormattedImages = filteredAgents.map(agent => (Object.assign(Object.assign({}, agent), { displayImage: agent.image && !agent.image.includes('default-avatar')
                    ? agent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !agent.image || agent.image.includes('default-avatar') })));
            res.json({
                success: true,
                data: agentsWithFormattedImages,
                count: filteredAgents.length
            });
        }
        catch (error) {
            console.error("❌ Controller Error searching agents:", error);
            res.status(500).json({
                success: false,
                error: "Erreur lors de la recherche des agents",
                message: error.message
            });
        }
    }
    static async uploadAgentImage(req, res) {
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
            const agentService = new AgentColarysService_1.AgentColarysService();
            const updatedAgent = await agentService.uploadAgentImage(agentId, req.file.buffer);
            const agentWithFormattedImage = Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.image && !updatedAgent.image.includes('default-avatar')
                    ? updatedAgent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar') });
            res.json({
                success: true,
                message: "Image uploadée avec succès",
                data: {
                    agent: agentWithFormattedImage
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
    static async deleteAgentImage(req, res) {
        try {
            const agentId = parseInt(req.params.agentId);
            if (isNaN(agentId)) {
                return res.status(400).json({
                    success: false,
                    error: "ID agent invalide"
                });
            }
            const agentService = new AgentColarysService_1.AgentColarysService();
            const updatedAgent = await agentService.deleteAgentImage(agentId);
            const agentWithFormattedImage = Object.assign(Object.assign({}, updatedAgent), { displayImage: updatedAgent.image && !updatedAgent.image.includes('default-avatar')
                    ? updatedAgent.image
                    : '/images/default-avatar.svg', hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar') });
            res.json({
                success: true,
                message: "Image supprimée avec succès",
                data: {
                    agent: agentWithFormattedImage
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
