"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const AgentService_1 = require("../services/AgentService");
const data_source_1 = require("../config/data-source");
class AgentController {
    constructor() {
        this.agentService = new AgentService_1.AgentService();
    }
    handleDatabaseError(error, res) {
        console.error('❌ Database error in AgentController:', error.message);
        if (error.message.includes('Database connection unavailable') ||
            error.message.includes('No metadata for "Agent"') ||
            error.message.includes('RepositoryNotFoundError')) {
            res.status(503).json({
                success: false,
                error: "Database unavailable",
                message: "Service temporarily unavailable. Please try again later."
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: "Server error",
                message: error.message
            });
        }
    }
    async getAll(req, res) {
        try {
            console.log('📦 AgentController: Fetching ALL real agents from database');
            if (!data_source_1.AppDataSource.isInitialized) {
                console.log('❌ Database not initialized');
                this.handleDatabaseError(new Error('Database connection unavailable'), res);
                return;
            }
            const agents = await this.agentService.getAllAgents();
            console.log(`✅ AgentController: Found ${agents.length} real agents`);
            res.json({
                success: true,
                message: "Real agents retrieved from database",
                timestamp: new Date().toISOString(),
                count: agents.length,
                data: agents
            });
        }
        catch (error) {
            this.handleDatabaseError(error, res);
        }
    }
    async getByMatricule(req, res) {
        try {
            const { matricule } = req.params;
            console.log('🔍 AgentController: Searching agent by matricule:', matricule);
            if (!data_source_1.AppDataSource.isInitialized) {
                this.handleDatabaseError(new Error('Database connection unavailable'), res);
                return;
            }
            const agent = await this.agentService.getAgentByMatricule(matricule);
            if (!agent) {
                console.log('❌ AgentController: Agent not found for matricule:', matricule);
                res.status(404).json({
                    success: false,
                    message: 'Agent non trouvé'
                });
                return;
            }
            console.log('✅ AgentController: Agent found:', agent.matricule);
            res.json({
                success: true,
                data: agent
            });
        }
        catch (error) {
            this.handleDatabaseError(error, res);
        }
    }
    async getByNomPrenom(req, res) {
        try {
            const { nom, prenom } = req.params;
            console.log('🔍 AgentController: Searching agent by nom/prenom:', { nom, prenom });
            if (!data_source_1.AppDataSource.isInitialized) {
                this.handleDatabaseError(new Error('Database connection unavailable'), res);
                return;
            }
            if (!nom || !prenom) {
                res.status(400).json({
                    success: false,
                    message: 'Le nom et le prénom sont requis'
                });
                return;
            }
            const agent = await this.agentService.findAgentByNomPrenom(nom, prenom);
            if (!agent) {
                console.log('❌ AgentController: Agent not found for nom/prenom:', { nom, prenom });
                res.status(404).json({
                    success: false,
                    message: 'Agent non trouvé'
                });
                return;
            }
            console.log('✅ AgentController: Agent found by nom/prenom:', agent.matricule);
            res.json({
                success: true,
                data: agent
            });
        }
        catch (error) {
            this.handleDatabaseError(error, res);
        }
    }
    async searchByNomPrenom(req, res) {
        try {
            const { nom, prenom, query } = req.query;
            console.log('🔍 AgentController: Searching agents by:', { nom, prenom, query });
            if (!data_source_1.AppDataSource.isInitialized) {
                this.handleDatabaseError(new Error('Database connection unavailable'), res);
                return;
            }
            let agents;
            if (query) {
                agents = await this.agentService.findAgentsByNomPrenom(query, query);
            }
            else {
                agents = await this.agentService.findAgentsByNomPrenom(nom, prenom);
            }
            console.log(`✅ AgentController: Found ${agents.length} agents for search`);
            res.json({
                success: true,
                data: agents,
                count: agents.length
            });
        }
        catch (error) {
            this.handleDatabaseError(error, res);
        }
    }
}
exports.AgentController = AgentController;
