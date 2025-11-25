"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysService = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
class AgentColarysService {
    constructor() {
        this.agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
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
                throw new errorMiddleware_1.NotFoundError(`Agent avec l'ID ${id} non trouvé`);
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
            const requiredFields = ['matricule', 'nom', 'prenom', 'role', 'mail'];
            const missingFields = requiredFields.filter(field => !agentData[field]);
            if (missingFields.length > 0) {
                throw new errorMiddleware_1.ValidationError(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
            }
            const existingAgent = await this.agentRepository.findOne({
                where: [
                    { matricule: agentData.matricule },
                    { mail: agentData.mail }
                ]
            });
            if (existingAgent) {
                if (existingAgent.matricule === agentData.matricule) {
                    throw new errorMiddleware_1.ValidationError(`Un agent avec le matricule ${agentData.matricule} existe déjà`);
                }
                if (existingAgent.mail === agentData.mail) {
                    throw new errorMiddleware_1.ValidationError(`Un agent avec l'email ${agentData.mail} existe déjà`);
                }
            }
            if (!agentData.image) {
                agentData.image = '/images/default-avatar.svg';
            }
            const agent = this.agentRepository.create(agentData);
            const savedAgent = await this.agentRepository.save(agent);
            console.log(`✅ Service: Agent créé avec ID: ${savedAgent.id}`);
            return savedAgent;
        }
        catch (error) {
            console.error("❌ Service Error in createAgent:", error);
            throw error;
        }
    }
    async updateAgent(id, agentData) {
        try {
            const existingAgent = await this.getAgentById(id);
            if (agentData.matricule || agentData.mail) {
                const duplicateAgent = await this.agentRepository.findOne({
                    where: [
                        { matricule: agentData.matricule },
                        { mail: agentData.mail }
                    ]
                });
                if (duplicateAgent && duplicateAgent.id !== id) {
                    if (duplicateAgent.matricule === agentData.matricule) {
                        throw new errorMiddleware_1.ValidationError(`Un autre agent avec le matricule ${agentData.matricule} existe déjà`);
                    }
                    if (duplicateAgent.mail === agentData.mail) {
                        throw new errorMiddleware_1.ValidationError(`Un autre agent avec l'email ${agentData.mail} existe déjà`);
                    }
                }
            }
            if (!agentData.image) {
                agentData.image = '/images/default-avatar.svg';
            }
            await this.agentRepository.update(id, agentData);
            const updatedAgent = await this.getAgentById(id);
            console.log(`✅ Service: Agent ${id} mis à jour`);
            return updatedAgent;
        }
        catch (error) {
            console.error("❌ Service Error in updateAgent:", error);
            throw error;
        }
    }
    async deleteAgent(id) {
        try {
            const agent = await this.getAgentById(id);
            await this.agentRepository.remove(agent);
            console.log(`✅ Service: Agent ${id} supprimé`);
        }
        catch (error) {
            console.error("❌ Service Error in deleteAgent:", error);
            throw error;
        }
    }
}
exports.AgentColarysService = AgentColarysService;
