// backend/src/services/AgentService.ts
import { AppDataSource } from "../config/data-source";
import { Agent } from "../entities/Agent";

export class AgentService {
  private agentRepository;

  constructor() {
    // Ne pas initialiser le repository immédiatement
    this.agentRepository = null;
  }

  // Méthode pour obtenir le repository (avec vérification de la DB)
  private getRepository() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database connection unavailable");
    }
    
    if (!this.agentRepository) {
      this.agentRepository = AppDataSource.getRepository(Agent);
    }
    
    return this.agentRepository;
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    const repository = this.getRepository();
    const agent = repository.create(agentData);
    return await repository.save(agent);
  }

  async findAgentByMatricule(matricule: string | null): Promise<Agent | null> {
    if (!matricule) return null;
    
    const repository = this.getRepository();
    return await repository.findOne({
      where: { matricule },
      relations: ["presences"]
    });
  }

  async findAgentByNomPrenom(nom: string, prenom: string): Promise<Agent | null> {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { 
        nom: nom,
        prenom: prenom 
      },
      relations: ["presences"]
    });
  }

  async updateAgentSignature(matricule: string | null, signature: string): Promise<Agent> {
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

  async getAllAgents(): Promise<Agent[]> {
    const repository = this.getRepository();
    return await repository.find({
      relations: ["presences"],
      order: { nom: "ASC" }
    });
  }

  async getAgentByMatricule(matricule: string | null): Promise<Agent | null> {
    if (!matricule) return null;
    
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { matricule } 
    });
  }

  async findAgentsByNomPrenom(nom?: string, prenom?: string): Promise<Agent[]> {
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