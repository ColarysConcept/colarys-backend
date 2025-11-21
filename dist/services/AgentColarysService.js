"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysService = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
class AgentColarysService {
    constructor() {
        // Initialisation directe si la DataSource est déjà initialisée
        this.agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
    }
    // private async ensureInitialized() {
    //   if (!this.agentRepository) {
    //     if (!AppDataSource.isInitialized) {
    //       await AppDataSource.initialize();
    //     }
    //     this.agentRepository = AppDataSource.getRepository(AgentColarys);
    //   }
    // }
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
            throw new Error("Erreur lors de la récupération des agents");
        }
    }
    async getAgentById(id) {
        // await this.ensureInitialized();
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
        // await this.ensureInitialized();
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
        // await this.ensureInitialized();
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
        // await this.ensureInitialized();
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
}
exports.AgentColarysService = AgentColarysService;
