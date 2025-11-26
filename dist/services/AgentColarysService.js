"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysService = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
class AgentColarysService {
    constructor() {
        this.agentRepository = null;
        this.storageService = null;
    }
    getRepository() {
        if (!data_source_1.AppDataSource.isInitialized) {
            throw new Error("Database connection unavailable");
        }
        if (!this.agentRepository) {
            this.agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
        }
        return this.agentRepository;
    }
    async getAllAgents() {
        try {
            console.log("🔄 Service: Getting all agents from database");
            const repository = this.getRepository();
            const agents = await repository.find({
                order: { nom: "ASC", prenom: "ASC" }
            });
            console.log(`✅ Service: Found ${agents.length} agents`);
            return agents;
        }
        catch (error) {
            console.error("❌ Service Error in getAllAgents:", error);
            throw new Error("Erreur lors de la récupération des agents: " + error.message);
        }
    }
    async getAgentById(id) {
        try {
            console.log(`🔄 Service: Getting agent by ID: ${id}`);
            const repository = this.getRepository();
            const agent = await repository.findOne({ where: { id } });
            if (!agent) {
                throw new errorMiddleware_1.NotFoundError("Agent non trouvé");
            }
            console.log(`✅ Service: Found agent: ${agent.nom} ${agent.prenom}`);
            return agent;
        }
        catch (error) {
            console.error("❌ Service Error in getAgentById:", error);
            throw error;
        }
    }
    async createAgent(agentData) {
        try {
            if (!agentData.matricule || !agentData.nom || !agentData.prenom || !agentData.role || !agentData.mail) {
                throw new errorMiddleware_1.ValidationError("Tous les champs obligatoires doivent être remplis");
            }
            const repository = this.getRepository();
            const existingAgent = await repository.findOne({
                where: [
                    { matricule: agentData.matricule },
                    { mail: agentData.mail }
                ]
            });
            if (existingAgent) {
                throw new errorMiddleware_1.ValidationError("Le matricule ou l'email existe déjà");
            }
            const agent = repository.create(agentData);
            return await repository.save(agent);
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.ValidationError) {
                throw error;
            }
            throw new Error("Erreur lors de la création de l'agent");
        }
    }
    async updateAgent(id, agentData) {
        try {
            const agent = await this.getAgentById(id);
            const repository = this.getRepository();
            if (agentData.matricule || agentData.mail) {
                const existingAgent = await repository.findOne({
                    where: [
                        { matricule: agentData.matricule },
                        { mail: agentData.mail }
                    ]
                });
                if (existingAgent && existingAgent.id !== id) {
                    throw new errorMiddleware_1.ValidationError("Le matricule ou l'email existe déjà pour un autre agent");
                }
            }
            await repository.update(id, agentData);
            return await this.getAgentById(id);
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.NotFoundError || error instanceof errorMiddleware_1.ValidationError) {
                throw error;
            }
            throw new Error("Erreur lors de la modification de l'agent");
        }
    }
    async deleteAgent(id) {
        try {
            const agent = await this.getAgentById(id);
            const repository = this.getRepository();
            await repository.remove(agent);
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.NotFoundError) {
                throw error;
            }
            throw new Error("Erreur lors de la suppression de l'agent");
        }
    }
    async uploadAgentImage(agentId, fileBuffer) {
        try {
            console.log(`🔄 Uploading image for agent ${agentId}`);
            const agent = await this.getAgentById(agentId);
            const repository = this.getRepository();
            console.log(`✅ Image upload simulé pour l'agent ${agentId}`);
            return agent;
        }
        catch (error) {
            console.error("❌ Service Error uploading agent image:", error);
            throw new Error("Erreur lors de l'upload de l'image: " + error.message);
        }
    }
    async deleteAgentImage(agentId) {
        try {
            const agent = await this.getAgentById(agentId);
            const repository = this.getRepository();
            agent.image = '/images/default-avatar.svg';
            agent.imagePublicId = null;
            return await repository.save(agent);
        }
        catch (error) {
            console.error("❌ Service Error deleting agent image:", error);
            throw new Error("Erreur lors de la suppression de l'image: " + error.message);
        }
    }
    async searchAgents(query) {
        try {
            const repository = this.getRepository();
            const agents = await repository
                .createQueryBuilder('agent')
                .where('agent.nom ILIKE :query', { query: `%${query}%` })
                .orWhere('agent.prenom ILIKE :query', { query: `%${query}%` })
                .orWhere('agent.matricule ILIKE :query', { query: `%${query}%` })
                .orWhere('agent.mail ILIKE :query', { query: `%${query}%` })
                .orWhere('agent.role ILIKE :query', { query: `%${query}%` })
                .orderBy('agent.nom', 'ASC')
                .addOrderBy('agent.prenom', 'ASC')
                .getMany();
            return agents;
        }
        catch (error) {
            console.error("❌ Service Error searching agents:", error);
            throw new Error("Erreur lors de la recherche des agents: " + error.message);
        }
    }
}
exports.AgentColarysService = AgentColarysService;
