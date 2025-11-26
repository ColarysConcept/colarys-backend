import { Request, Response, NextFunction } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { ValidationError, NotFoundError } from "../middleware/errorMiddleware";
import { upload } from '../config/multer';

const agentService = new AgentColarysService();

export class AgentColarysController {
  
  // Dans AgentColarysController.ts (backend) - VÉRIFIER
static async getAllAgents(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agents = await agentService.getAllAgents();
      
      // ✅ FORMATER LES IMAGES POUR CHAQUE AGENT
      const agentsWithFormattedImages = agents.map(agent => ({
        ...agent,
        displayImage: agent.getDisplayImage(),
        hasDefaultImage: agent.hasDefaultImage()
      }));
      
      res.json({
        success: true,
        data: agentsWithFormattedImages,
        count: agents.length
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error getting all agents:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur lors du chargement des agents",
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  static async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      console.log(`🔄 Controller: Getting agent with ID: ${id}`);
      const agent = await agentService.getAgentById(id);
      
      // ✅ FORMATER L'IMAGE POUR CET AGENT
      const agentWithFormattedImage = {
        ...agent,
        displayImage: agent.getDisplayImage(),
        hasDefaultImage: agent.hasDefaultImage()
      };
      
      res.json({
        success: true,
        data: agentWithFormattedImage
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error getting agent by ID:", error);
      
      if (error instanceof NotFoundError || error.message.includes("non trouvé")) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération de l'agent",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agentData = req.body;

      // ✅ NE PAS FORCER L'IMAGE PAR DÉFAUT SI UNE IMAGE EST FOURNIE
      if (!agentData.image || agentData.image.includes('default-avatar')) {
        agentData.image = '/images/default-avatar.svg';
      }
      
      console.log("🔄 Controller: Creating new agent", { 
        nom: agentData.nom,
        prenom: agentData.prenom,
        matricule: agentData.matricule,
        mail: agentData.mail,
        role: agentData.role,
        image: agentData.image // Log l'image utilisée
      });
      
      const newAgent = await agentService.createAgent(agentData);
      
      // ✅ FORMATER L'IMAGE POUR LA RÉPONSE
      const agentWithFormattedImage = {
        ...newAgent,
        displayImage: newAgent.getDisplayImage(),
        hasDefaultImage: newAgent.hasDefaultImage()
      };
      
      res.status(201).json({
        success: true,
        message: "Agent créé avec succès",
        data: agentWithFormattedImage
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error creating agent:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la création de l'agent",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      const agentData = req.body;
      
      // ✅ CONSERVER L'IMAGE EXISTANTE SI AUCUNE NOUVELLE N'EST FOURNIE
      if (!agentData.image) {
        // Ne pas modifier l'image existante
        delete agentData.image;
        delete agentData.imagePublicId;
      } else if (agentData.image.includes('default-avatar')) {
        // Si on veut remettre l'image par défaut
        agentData.image = '/images/default-avatar.svg';
        agentData.imagePublicId = null;
      }
      
      console.log(`🔄 Controller: Updating agent ${id}`, {
        nom: agentData.nom,
        prenom: agentData.prenom,
        matricule: agentData.matricule,
        mail: agentData.mail,
        role: agentData.role,
        image: agentData.image
      });
      
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      // ✅ FORMATER L'IMAGE POUR LA RÉPONSE
      const agentWithFormattedImage = {
        ...updatedAgent,
        displayImage: updatedAgent.getDisplayImage(),
        hasDefaultImage: updatedAgent.hasDefaultImage()
      };
      
      res.json({
        success: true,
        message: "Agent modifié avec succès",
        data: agentWithFormattedImage
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error updating agent:", error);
      
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la modification de l'agent",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      console.log(`🔄 Controller: Deleting agent ${id}`);
      
      await agentService.deleteAgent(id);
      
      res.json({
        success: true,
        message: "Agent supprimé avec succès"
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error deleting agent:", error);
      
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la suppression de l'agent",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🔄 Upload image endpoint called");
      
      // ✅ SUR VERCEL, ON RETOURNE TOUJOURS L'AVATAR PAR DÉFAUT
      res.json({
        success: true,
        message: "Image upload simulé - avatar par défaut utilisé",
        data: {
          imageUrl: '/images/default-avatar.svg',
          filename: 'default-avatar.svg'
        }
      });
    } catch (error: any) {
      console.error("❌ Controller Error uploading image:", error);
      
      res.status(400).json({
        success: false,
        error: "Erreur lors de l'upload de l'image",
        message: error.message
      });
    }
  }

  static async healthCheck(_req: Request, res: Response) {
    try {
      console.log("🔍 Health check agents endpoint");
      const agents = await agentService.getAllAgents();
      
      res.json({
        success: true,
        message: "Service agents opérationnel",
        data: {
          agentsCount: agents.length,
          timestamp: new Date().toISOString(),
          status: "healthy"
        }
      });
    } catch (error: any) {
      console.error("❌ Health check agents failed:", error);
      
      res.status(500).json({
        success: false,
        error: "Service agents non disponible",
        message: error.message,
        status: "unhealthy"
      });
    }
  }

  static async searchAgents(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      console.log(`🔍 Searching agents with query: ${query}`);
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Paramètre de recherche manquant"
        });
      }
      
      const allAgents = await agentService.getAllAgents();
      const filteredAgents = allAgents.filter(agent => 
        agent.nom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.prenom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.matricule?.toLowerCase().includes(query.toLowerCase()) ||
        agent.mail?.toLowerCase().includes(query.toLowerCase()) ||
        agent.role?.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json({
        success: true,
        data: filteredAgents,
        count: filteredAgents.length
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error searching agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche des agents",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // 🔥 NOUVELLE MÉTHODE POUR UPLOADER DES IMAGES RÉELLES
 static async uploadAgentImage(req: Request, res: Response, next: NextFunction) {
    try {
      const agentId = parseInt(req.params.agentId);
      
      if (isNaN(agentId)) {
        return res.status(400).json({
          success: false,
          error: "ID agent invalide"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Aucun fichier image fourni"
        });
      }

      console.log(`🔄 Uploading real image for agent ${agentId}`);

      // Utiliser le service avec Supabase
      const updatedAgent = await agentService.uploadAgentImage(
        agentId, 
        req.file.buffer
      );

      res.json({
        success: true,
        message: "Image uploadée avec succès",
        data: {
          agent: {
            ...updatedAgent,
            displayImage: updatedAgent.getDisplayImage(),
            hasDefaultImage: updatedAgent.hasDefaultImage()
          }
        }
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error uploading agent image:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'upload de l'image",
        message: error.message
      });
    }
  }

static async deleteAgentImage(req: Request, res: Response, next: NextFunction) {
    try {
      const agentId = parseInt(req.params.agentId);
      
      if (isNaN(agentId)) {
        return res.status(400).json({
          success: false,
          error: "ID agent invalide"
        });
      }

      const updatedAgent = await agentService.deleteAgentImage(agentId);

      res.json({
        success: true,
        message: "Image supprimée avec succès",
        data: {
          agent: {
            ...updatedAgent,
            displayImage: updatedAgent.getDisplayImage(),
            hasDefaultImage: updatedAgent.hasDefaultImage()
          }
        }
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error deleting agent image:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la suppression de l'image",
        message: error.message
      });
    }
  }
}