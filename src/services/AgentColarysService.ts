import { AppDataSource } from "../config/data-source";
import { AgentColarys } from "../entities/AgentColarys";
import { NotFoundError, ValidationError } from "../middleware/errorMiddleware";
import { Repository } from "typeorm"; // Import ajouté
import { CloudinaryService } from "./CloudinaryService";

export class AgentColarysService {
  private agentRepository: Repository<AgentColarys>;
  private cloudinaryService: CloudinaryService;

  constructor() {
    // Initialisation directe si la DataSource est déjà initialisée
    this.agentRepository = AppDataSource.getRepository(AgentColarys);
    this.cloudinaryService = new CloudinaryService();
  }


// Dans AgentColarysService.ts (backend)
async getAllAgents(): Promise<AgentColarys[]> {
  try {
    console.log("🔄 Service: Getting all agents from database");
    
    // ✅ VÉRIFIER LA CONNEXION BD
    if (!this.agentRepository) {
      throw new Error('Repository non initialisé');
    }
    
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
    // await this.ensureInitialized();
    
    try {
      console.log(`🔄 Service: Getting agent by ID: ${id}`);
      const agent = await this.agentRepository.findOne({ where: { id } });
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
    // await this.ensureInitialized();
    
    try {
      if (!agentData.matricule || !agentData.nom || !agentData.prenom || !agentData.role || !agentData.mail) {
        throw new ValidationError("Tous les champs obligatoires doivent être remplis");
      }

      const existingAgent = await this.agentRepository.findOne({
        where: [
          { matricule: agentData.matricule },
          { mail: agentData.mail }
        ]
      });

      if (existingAgent) {
        throw new ValidationError("Le matricule ou l'email existe déjà");
      }

      const agent = this.agentRepository.create(agentData);
      return await this.agentRepository.save(agent);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error("Erreur lors de la création de l'agent");
    }
  }

  async updateAgent(id: number, agentData: Partial<AgentColarys>): Promise<AgentColarys> {
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
          throw new ValidationError("Le matricule ou l'email existe déjà pour un autre agent");
        }
      }

      await this.agentRepository.update(id, agentData);
      return await this.getAgentById(id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error("Erreur lors de la modification de l'agent");
    }
  }

  async deleteAgent(id: number): Promise<void> {
    // await this.ensureInitialized();
    
    try {
      const agent = await this.getAgentById(id);
      await this.agentRepository.remove(agent);
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
      
      // Supprimer l'ancienne image de Cloudinary si elle existe
      if (agent.imagePublicId) {
        try {
          await this.cloudinaryService.deleteImage(agent.imagePublicId);
          console.log(`✅ Old image deleted: ${agent.imagePublicId}`);
        } catch (error) {
          console.warn('⚠️ Could not delete old image:', error);
        }
      }

      // Uploader la nouvelle image sur Cloudinary
      console.log('📤 Uploading new image to Cloudinary...');
      const { url, publicId } = await this.cloudinaryService.uploadImage(fileBuffer);
      console.log(`✅ New image uploaded: ${url}`);

      // Mettre à jour l'agent avec la nouvelle image
      agent.image = url;
      agent.imagePublicId = publicId;
      
      const updatedAgent = await this.agentRepository.save(agent);
      console.log(`✅ Agent ${agentId} image updated in database`);
      
      return updatedAgent;
    } catch (error) {
      console.error("❌ Service Error uploading agent image:", error);
      throw new Error("Erreur lors de l'upload de l'image: " + error.message);
    }
  }

async deleteAgentImage(agentId: number): Promise<AgentColarys> {
    try {
      const agent = await this.getAgentById(agentId);
      
      if (agent.imagePublicId) {
        await this.cloudinaryService.deleteImage(agent.imagePublicId);
      }
      
      // Réinitialiser à l'image par défaut
      agent.image = '/images/default-avatar.svg';
      agent.imagePublicId = null;
      
      return await this.agentRepository.save(agent);
    } catch (error) {
      console.error("❌ Service Error deleting agent image:", error);
      throw new Error("Erreur lors de la suppression de l'image: " + error.message);
    }
  }
}