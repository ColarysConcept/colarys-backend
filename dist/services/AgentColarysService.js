"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysService = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const SupabaseStorageService_1 = require("./SupabaseStorageService");
class AgentColarysService {
    constructor() {
        this.agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
        this.storageService = new SupabaseStorageService_1.SupabaseStorageService();
    }
    async getAllAgents() {
        try {
            console.log("🔄 Service: Getting all agents from database");
            const agents = await this.agentRepository.find({
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
            const agent = await this.agentRepository.findOne({ where: { id } });
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
            const existingAgent = await this.agentRepository.findOne({
                where: [
                    { matricule: agentData.matricule },
                    { mail: agentData.mail }
                ]
            });
            if (existingAgent) {
                throw new errorMiddleware_1.ValidationError("Le matricule ou l'email existe déjà");
            }
            const agent = this.agentRepository.create(agentData);
            return await this.agentRepository.save(agent);
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
            if (agentData.matricule || agentData.mail) {
                const existingAgent = await this.agentRepository.findOne({
                    where: [
                        { matricule: agentData.matricule },
                        { mail: agentData.mail }
                    ]
                });
                if (existingAgent && existingAgent.id !== id) {
                    throw new errorMiddleware_1.ValidationError("Le matricule ou l'email existe déjà pour un autre agent");
                }
            }
            await this.agentRepository.update(id, agentData);
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
            await this.agentRepository.remove(agent);
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
            if (agent.imagePublicId) {
                await this.storageService.deleteAgentImage(agent.imagePublicId);
            }
            const { url, filePath } = await this.storageService.uploadAgentImage(fileBuffer, agent.matricule);
            agent.image = url;
            agent.imagePublicId = filePath;
            const updatedAgent = await this.agentRepository.save(agent);
            console.log(`✅ Agent ${agentId} image updated in database`);
            return updatedAgent;
        }
        catch (error) {
            console.error("❌ Service Error uploading agent image:", error);
            throw new Error("Erreur lors de l'upload de l'image: " + error.message);
        }
    }
    async deleteAgentImage(agentId) {
        try {
            const agent = await this.getAgentById(agentId);
            if (agent.imagePublicId) {
                await this.storageService.deleteAgentImage(agent.imagePublicId);
            }
            agent.image = '/images/default-avatar.svg';
            agent.imagePublicId = null;
            return await this.agentRepository.save(agent);
        }
        catch (error) {
            console.error("❌ Service Error deleting agent image:", error);
            throw new Error("Erreur lors de la suppression de l'image: " + error.message);
        }
    }
}
exports.AgentColarysService = AgentColarysService;
