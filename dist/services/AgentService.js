"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const data_source_1 = require("../config/data-source");
const Agent_1 = require("../entities/Agent");
class AgentService {
    constructor() {
        this.agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
        this.agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
    }
    async createAgent(agentData) {
        const agent = this.agentRepository.create(agentData);
        return await this.agentRepository.save(agent);
    }
    async findAgentByMatricule(matricule) {
        if (!matricule)
            return null;
        return await this.agentRepository.findOne({
            where: { matricule },
            relations: ["presences"]
        });
    }
    async findAgentByNomPrenom(nom, prenom) {
        return await this.agentRepository.findOne({
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
        const agent = await this.findAgentByMatricule(matricule);
        if (!agent) {
            throw new Error("Agent non trouvé");
        }
        agent.signature = signature;
        return await this.agentRepository.save(agent);
    }
    async getAllAgents() {
        return await this.agentRepository.find({
            relations: ["presences"],
            order: { nom: "ASC" }
        });
    }
    async getAgentByMatricule(matricule) {
        if (!matricule)
            return null;
        return await this.agentRepository.findOne({
            where: { matricule }
        });
    }
    async findAgentsByNomPrenom(nom, prenom) {
        const queryBuilder = this.agentRepository.createQueryBuilder('agent');
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
