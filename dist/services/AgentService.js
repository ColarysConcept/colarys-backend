"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const data_source_1 = require("../config/data-source");
const Agent_1 = require("../entities/Agent");
class AgentService {
    constructor() {
        this.agentRepository = null;
    }
    getRepository() {
        if (!data_source_1.AppDataSource.isInitialized) {
            throw new Error("Database connection unavailable");
        }
        if (!this.agentRepository) {
            this.agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
        }
        return this.agentRepository;
    }
    async createAgent(agentData) {
        const repository = this.getRepository();
        const agent = repository.create(agentData);
        return await repository.save(agent);
    }
    async findAgentByMatricule(matricule) {
        if (!matricule)
            return null;
        const repository = this.getRepository();
        return await repository.findOne({
            where: { matricule },
            relations: ["presences"]
        });
    }
    async findAgentByNomPrenom(nom, prenom) {
        const repository = this.getRepository();
        return await repository.findOne({
            where: {
                nom: nom,
                prenom: prenom
            },
            relations: ["presences"]
        });
    }
    async updateAgentSignature(matricule, signature) {
        if (!matricule) {
            throw new Error("Matricule requis pour mise à jour");
        }
        const repository = this.getRepository();
        const agent = await this.findAgentByMatricule(matricule);
        if (!agent) {
            throw new Error("Agent non trouvé");
        }
        agent.signature = signature;
        return await repository.save(agent);
    }
    async getAllAgents() {
        const repository = this.getRepository();
        return await repository.find({
            relations: ["presences"],
            order: { nom: "ASC" }
        });
    }
    async getAgentByMatricule(matricule) {
        if (!matricule)
            return null;
        const repository = this.getRepository();
        return await repository.findOne({
            where: { matricule }
        });
    }
    async findAgentsByNomPrenom(nom, prenom) {
        const repository = this.getRepository();
        const queryBuilder = repository.createQueryBuilder('agent');
        if (nom) {
            queryBuilder.andWhere('agent.nom ILIKE :nom', { nom: `%${nom}%` });
        }
        if (prenom) {
            queryBuilder.andWhere('agent.prenom ILIKE :prenom', { prenom: `%${prenom}%` });
        }
        return await queryBuilder
            .leftJoinAndSelect('agent.presences', 'presences')
            .orderBy('agent.nom', 'ASC')
            .addOrderBy('agent.prenom', 'ASC')
            .getMany();
    }
}
exports.AgentService = AgentService;
