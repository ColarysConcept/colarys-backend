import { AppDataSource } from "../config/data-source";
import { AgentColarys } from "../entities/AgentColarys";
import { NotFoundError, ValidationError } from "../middleware/errorMiddleware";
import { Repository } from "typeorm";

export class AgentColarysService {
  private agentRepository: Repository<AgentColarys>;

  constructor() {
    this.agentRepository = AppDataSource.getRepository(AgentColarys);
  }

  async getAllAgents(): Promise<AgentColarys[]> {
    try {
      console.log("🔄 Service: Getting all agents from database");
      const agents = await this.agentRepository.find({
        order: { nom: "ASC", prenom: "ASC" }
      });
      console.log(`✅ Service: Found ${agents.length} agents`);
      return agents;
    } catch (error) {
      console.error("❌ Service Error in getAllAgents:", error);
      throw new Error("Erreur lors de la récupération des agents: " + error.message);
    }
  }

  async getAgentById(id: number): Promise<AgentColarys> {
    try {
      console.log(`🔄 Service: Getting agent by ID: ${id}`);
      const agent = await this.agentRepository.findOne({ where: { id } });
      
      if (!agent) {
        throw new NotFoundError(`Agent avec l'ID ${id} non trouvé`);
      }
      
      console.log(`✅ Service: Found agent: ${agent.nom} ${agent.prenom}`);
      return agent;
    } catch (error) {
      console.error("❌ Service Error in getAgentById:", error);
      // Relancer l'erreur telle quelle pour que le contrôleur la gère
      throw error;
    }
  }

  async createAgent(agentData: Partial<AgentColarys>): Promise<AgentColarys> {
    try {
      // ✅ Validation des champs obligatoires
      const requiredFields = ['matricule', 'nom', 'prenom', 'role', 'mail'];
      const missingFields = requiredFields.filter(field => !agentData[field as keyof AgentColarys]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      }

      // ✅ Vérification des doublons
      const existingAgent = await this.agentRepository.findOne({
        where: [
          { matricule: agentData.matricule },
          { mail: agentData.mail }
        ]
      });

      if (existingAgent) {
        if (existingAgent.matricule === agentData.matricule) {
          throw new ValidationError(`Un agent avec le matricule ${agentData.matricule} existe déjà`);
        }
        if (existingAgent.mail === agentData.mail) {
          throw new ValidationError(`Un agent avec l'email ${agentData.mail} existe déjà`);
        }
      }

      // ✅ Image par défaut si non fournie
      if (!agentData.image) {
        agentData.image = '/images/default-avatar.svg';
      }

      const agent = this.agentRepository.create(agentData);
      const savedAgent = await this.agentRepository.save(agent);
      
      console.log(`✅ Service: Agent créé avec ID: ${savedAgent.id}`);
      return savedAgent;
      
    } catch (error) {
      console.error("❌ Service Error in createAgent:", error);
      // Relancer l'erreur pour le contrôleur
      throw error;
    }
  }

  async updateAgent(id: number, agentData: Partial<AgentColarys>): Promise<AgentColarys> {
    try {
      // ✅ Vérifier que l'agent existe
      const existingAgent = await this.getAgentById(id);
      
      // ✅ Vérifier les doublons (sauf pour l'agent actuel)
      if (agentData.matricule || agentData.mail) {
        const duplicateAgent = await this.agentRepository.findOne({
          where: [
            { matricule: agentData.matricule },
            { mail: agentData.mail }
          ]
        });

        if (duplicateAgent && duplicateAgent.id !== id) {
          if (duplicateAgent.matricule === agentData.matricule) {
            throw new ValidationError(`Un autre agent avec le matricule ${agentData.matricule} existe déjà`);
          }
          if (duplicateAgent.mail === agentData.mail) {
            throw new ValidationError(`Un autre agent avec l'email ${agentData.mail} existe déjà`);
          }
        }
      }

      // ✅ Image par défaut si non fournie
      if (!agentData.image) {
        agentData.image = '/images/default-avatar.svg';
      }

      // ✅ Mettre à jour l'agent
      await this.agentRepository.update(id, agentData);
      
      // ✅ Récupérer l'agent mis à jour
      const updatedAgent = await this.getAgentById(id);
      console.log(`✅ Service: Agent ${id} mis à jour`);
      
      return updatedAgent;
      
    } catch (error) {
      console.error("❌ Service Error in updateAgent:", error);
      throw error;
    }
  }

  async deleteAgent(id: number): Promise<void> {
    try {
      // ✅ Vérifier que l'agent existe
      const agent = await this.getAgentById(id);
      
      // ✅ Supprimer l'agent
      await this.agentRepository.remove(agent);
      
      console.log(`✅ Service: Agent ${id} supprimé`);
      
    } catch (error) {
      console.error("❌ Service Error in deleteAgent:", error);
      throw error;
    }
  }
}