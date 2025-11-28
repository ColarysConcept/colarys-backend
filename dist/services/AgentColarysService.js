"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentColarysService = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const CloudinaryService_1 = require("./CloudinaryService");
class AgentColarysService {
    constructor() {
        this.agentRepository = null;
        this.cloudinaryService = new CloudinaryService_1.CloudinaryService();
    }
    async getRepository() {
        try {
            if (!data_source_1.AppDataSource.isInitialized) {
                console.log('🔄 Database not initialized, connecting...');
                await (0, data_source_1.initializeDatabase)();
            }
            if (!data_source_1.AppDataSource.isInitialized) {
                throw new Error("Database connection unavailable");
            }
            if (!this.agentRepository) {
                this.agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
            }
            return this.agentRepository;
        }
        catch (error) {
            console.error('❌ Error in getRepository():', error.message);
            throw new Error("Database service unavailable");
        }
    }
    async getAllAgents() {
        try {
            console.log("🔄 Service: Getting all agents from database");
            const repository = await this.getRepository();
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
            const repository = await this.getRepository();
            const agent = await repository.findOne({ where: { id } });
            if (!agent) {
                throw new errorMiddleware_1.NotFoundError(`Agent avec ID ${id} non trouvé`);
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
                throw new errorMiddleware_1.ValidationError("Tous les champs obligatoires (matricule, nom, prénom, rôle, mail) doivent être remplis");
            }
            const repository = await this.getRepository();
            const existingAgent = await repository.findOne({
                where: [
                    { matricule: agentData.matricule },
                    { mail: agentData.mail }
                ]
            });
            if (existingAgent) {
                if (existingAgent.matricule === agentData.matricule) {
                    throw new errorMiddleware_1.ValidationError(`Le matricule "${agentData.matricule}" existe déjà`);
                }
                if (existingAgent.mail === agentData.mail) {
                    throw new errorMiddleware_1.ValidationError(`L'email "${agentData.mail}" existe déjà`);
                }
            }
            if (!agentData.image) {
                agentData.image = '/images/default-avatar.svg';
                agentData.imagePublicId = 'default-avatar';
            }
            console.log('🔄 Creating new agent:', {
                matricule: agentData.matricule,
                nom: agentData.nom,
                prenom: agentData.prenom,
                role: agentData.role,
                mail: agentData.mail
            });
            const agent = repository.create(agentData);
            const savedAgent = await repository.save(agent);
            console.log(`✅ Agent created successfully with ID: ${savedAgent.id}`);
            return savedAgent;
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.ValidationError || error instanceof errorMiddleware_1.NotFoundError) {
                throw error;
            }
            console.error("❌ Service Error in createAgent:", error);
            throw new Error("Erreur lors de la création de l'agent: " + error.message);
        }
    }
    async updateAgent(id, agentData) {
        try {
            const agent = await this.getAgentById(id);
            const repository = await this.getRepository();
            if (agentData.matricule || agentData.mail) {
                const existingAgent = await repository.findOne({
                    where: [
                        { matricule: agentData.matricule || agent.matricule },
                        { mail: agentData.mail || agent.mail }
                    ]
                });
                if (existingAgent && existingAgent.id !== id) {
                    if (existingAgent.matricule === (agentData.matricule || agent.matricule)) {
                        throw new errorMiddleware_1.ValidationError("Le matricule existe déjà pour un autre agent");
                    }
                    if (existingAgent.mail === (agentData.mail || agent.mail)) {
                        throw new errorMiddleware_1.ValidationError("L'email existe déjà pour un autre agent");
                    }
                }
            }
            if (!agentData.image) {
                delete agentData.image;
                delete agentData.imagePublicId;
            }
            else if (agentData.image === '/images/default-avatar.svg') {
                agentData.imagePublicId = 'default-avatar';
            }
            console.log(`🔄 Updating agent ${id}:`, {
                nom: agentData.nom || agent.nom,
                prenom: agentData.prenom || agent.prenom,
                role: agentData.role || agent.role
            });
            await repository.update(id, agentData);
            const updatedAgent = await this.getAgentById(id);
            console.log(`✅ Agent ${id} updated successfully`);
            return updatedAgent;
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.NotFoundError || error instanceof errorMiddleware_1.ValidationError) {
                throw error;
            }
            console.error("❌ Service Error in updateAgent:", error);
            throw new Error("Erreur lors de la modification de l'agent: " + error.message);
        }
    }
    async deleteAgent(id) {
        try {
            const agent = await this.getAgentById(id);
            const repository = await this.getRepository();
            console.log(`🔄 Deleting agent ${id}: ${agent.nom} ${agent.prenom}`);
            if (agent.imagePublicId && agent.imagePublicId !== 'default-avatar') {
                try {
                    await this.cloudinaryService.deleteImage(agent.imagePublicId);
                    console.log(`✅ Deleted Cloudinary image: ${agent.imagePublicId}`);
                }
                catch (cloudinaryError) {
                    console.warn(`⚠️ Could not delete Cloudinary image for agent ${id}:`, cloudinaryError);
                }
            }
            await repository.remove(agent);
            console.log(`✅ Agent ${id} deleted successfully`);
        }
        catch (error) {
            if (error instanceof errorMiddleware_1.NotFoundError) {
                throw error;
            }
            console.error("❌ Service Error in deleteAgent:", error);
            throw new Error("Erreur lors de la suppression de l'agent: " + error.message);
        }
    }
    async uploadAgentImage(agentId, fileBuffer) {
        try {
            console.log(`🔄 Service: Uploading real image for agent ${agentId}`);
            const agent = await this.getAgentById(agentId);
            const repository = await this.getRepository();
            if (agent.imagePublicId && agent.imagePublicId !== 'default-avatar') {
                try {
                    console.log(`🗑️ Deleting old Cloudinary image: ${agent.imagePublicId}`);
                    await this.cloudinaryService.deleteImage(agent.imagePublicId);
                    console.log(`✅ Old image deleted: ${agent.imagePublicId}`);
                }
                catch (error) {
                    console.warn("⚠️ Could not delete old image from Cloudinary:", error);
                }
            }
            console.log(`📤 Uploading new image to Cloudinary for agent ${agentId}`);
            const { url, publicId } = await this.cloudinaryService.uploadImage(fileBuffer);
            console.log(`✅ Cloudinary upload successful:`, {
                url: url.substring(0, 50) + '...',
                publicId: publicId
            });
            agent.image = url;
            agent.imagePublicId = publicId;
            const updatedAgent = await repository.save(agent);
            console.log(`✅ Image uploaded successfully for agent ${agentId}`);
            return updatedAgent;
        }
        catch (error) {
            console.error("❌ Service Error uploading agent image:", error);
            throw new Error("Erreur lors de l'upload de l'image: " + error.message);
        }
    }
    async deleteAgentImage(agentId) {
        try {
            console.log(`🔄 Service: Deleting image for agent ${agentId}`);
            const agent = await this.getAgentById(agentId);
            const repository = await this.getRepository();
            if (agent.imagePublicId && agent.imagePublicId !== 'default-avatar') {
                try {
                    console.log(`🗑️ Deleting Cloudinary image: ${agent.imagePublicId}`);
                    await this.cloudinaryService.deleteImage(agent.imagePublicId);
                    console.log(`✅ Image deleted from Cloudinary: ${agent.imagePublicId}`);
                }
                catch (error) {
                    console.warn("⚠️ Could not delete image from Cloudinary:", error);
                }
            }
            agent.image = '/images/default-avatar.svg';
            agent.imagePublicId = 'default-avatar';
            const updatedAgent = await repository.save(agent);
            console.log(`✅ Image reset to default for agent ${agentId}`);
            return updatedAgent;
        }
        catch (error) {
            console.error("❌ Service Error deleting agent image:", error);
            throw new Error("Erreur lors de la suppression de l'image: " + error.message);
        }
    }
    async searchAgents(query) {
        try {
            console.log(`🔍 Service: Searching agents with query: "${query}"`);
            if (!query || query.trim().length === 0) {
                return await this.getAllAgents();
            }
            const repository = await this.getRepository();
            const searchQuery = `%${query.trim()}%`;
            const agents = await repository
                .createQueryBuilder('agent')
                .where('agent.nom ILIKE :query', { query: searchQuery })
                .orWhere('agent.prenom ILIKE :query', { query: searchQuery })
                .orWhere('agent.matricule ILIKE :query', { query: searchQuery })
                .orWhere('agent.mail ILIKE :query', { query: searchQuery })
                .orWhere('agent.role ILIKE :query', { query: searchQuery })
                .orderBy('agent.nom', 'ASC')
                .addOrderBy('agent.prenom', 'ASC')
                .getMany();
            console.log(`✅ Search found ${agents.length} agents for query: "${query}"`);
            return agents;
        }
        catch (error) {
            console.error("❌ Service Error searching agents:", error);
            throw new Error("Erreur lors de la recherche des agents: " + error.message);
        }
    }
    async healthCheck() {
        try {
            const repository = await this.getRepository();
            const agentsCount = await repository.count();
            return {
                status: 'healthy',
                agentsCount: agentsCount
            };
        }
        catch (error) {
            console.error("❌ Service health check failed:", error);
            return {
                status: 'unhealthy',
                agentsCount: 0
            };
        }
    }
}
exports.AgentColarysService = AgentColarysService;
