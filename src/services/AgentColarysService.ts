// src/services/AgentColarysService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { AppDataSource } from "../config/data-source";
import { AgentColarys } from "../entities/AgentColarys";
import { NotFoundError, ValidationError } from "../middleware/errorMiddleware";
import { Repository } from "typeorm";

export class AgentColarysService {
  private agentRepository: Repository<AgentColarys> | null = null;
  private storageService: any = null; // Temporairement désactivé

  constructor() {
    // Ne pas initialiser immédiatement - attendre que la DB soit prête
  }

  // Méthode pour obtenir le repository (avec vérification)
  private getRepository(): Repository<AgentColarys> {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database connection unavailable");
    }
    
    if (!this.agentRepository) {
      this.agentRepository = AppDataSource.getRepository(AgentColarys);
    }
    
    return this.agentRepository;
  }

  async getAllAgents(): Promise<AgentColarys[]> {
    try {
      console.log("🔄 Service: Getting all agents from database");
      
      const repository = this.getRepository();
      
      const agents = await repository.find({
        order: { nom: "ASC", prenom: "ASC" }
      });
      
      console.log(`✅ Service: Found ${agents.length} agents`);
      return agents;
    } catch (error: any) {
      console.error("❌ Service Error in getAllAgents:", error);
      throw new Error("Erreur lors de la récupération des agents: " + error.message);
    }
  }

  async getAgentById(id: number): Promise<AgentColarys> {
    try {
      console.log(`🔄 Service: Getting agent by ID: ${id}`);
      const repository = this.getRepository();
      const agent = await repository.findOne({ where: { id } });
      if (!agent) {
        throw new NotFoundError("Agent non trouvé");
      }
      console.log(`✅ Service: Found agent: ${agent.nom} ${agent.prenom}`);
      return agent;
    } catch (error) {
      console.error("❌ Service Error in getAgentById:", error);
      throw error;
    }
  }

  async createAgent(agentData: Partial<AgentColarys>): Promise<AgentColarys> {
    try {
      if (!agentData.matricule || !agentData.nom || !agentData.prenom || !agentData.role || !agentData.mail) {
        throw new ValidationError("Tous les champs obligatoires doivent être remplis");
      }

      const repository = this.getRepository();

      const existingAgent = await repository.findOne({
        where: [
          { matricule: agentData.matricule },
          { mail: agentData.mail }
        ]
      });

      if (existingAgent) {
        throw new ValidationError("Le matricule ou l'email existe déjà");
      }

      const agent = repository.create(agentData);
      return await repository.save(agent);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error("Erreur lors de la création de l'agent");
    }
  }

  async updateAgent(id: number, agentData: Partial<AgentColarys>): Promise<AgentColarys> {
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
          throw new ValidationError("Le matricule ou l'email existe déjà pour un autre agent");
        }
      }

      await repository.update(id, agentData);
      return await this.getAgentById(id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error("Erreur lors de la modification de l'agent");
    }
  }

  async deleteAgent(id: number): Promise<void> {
    try {
      const agent = await this.getAgentById(id);
      const repository = this.getRepository();
      await repository.remove(agent);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Erreur lors de la suppression de l'agent");
    }
  }

  async uploadAgentImage(agentId: number, fileBuffer: Buffer): Promise<AgentColarys> {
    try {
      console.log(`🔄 Uploading image for agent ${agentId}`);
      
      const agent = await this.getAgentById(agentId);
      const repository = this.getRepository();
      
      // TEMPORAIRE: Retourner l'agent sans modification
      // La fonctionnalité d'upload sera implémentée plus tard
      console.log(`✅ Image upload simulé pour l'agent ${agentId}`);
      
      return agent;
    } catch (error: any) {
      console.error("❌ Service Error uploading agent image:", error);
      throw new Error("Erreur lors de l'upload de l'image: " + error.message);
    }
  }

  async deleteAgentImage(agentId: number): Promise<AgentColarys> {
    try {
      const agent = await this.getAgentById(agentId);
      const repository = this.getRepository();
      
      // Réinitialiser à l'image par défaut
      agent.image = '/images/default-avatar.svg';
      agent.imagePublicId = null;
      
      return await repository.save(agent);
    } catch (error: any) {
      console.error("❌ Service Error deleting agent image:", error);
      throw new Error("Erreur lors de la suppression de l'image: " + error.message);
    }
  }

  // Méthode utilitaire pour la recherche
  async searchAgents(query: string): Promise<AgentColarys[]> {
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
    } catch (error: any) {
      console.error("❌ Service Error searching agents:", error);
      throw new Error("Erreur lors de la recherche des agents: " + error.message);
    }
  }
}