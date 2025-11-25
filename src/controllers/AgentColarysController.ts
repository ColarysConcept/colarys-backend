import { Request, Response, NextFunction } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { ValidationError, NotFoundError } from "../middleware/errorMiddleware";

const agentService = new AgentColarysService();

export class AgentColarysController {
  
  static async getAllAgents(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agents = await agentService.getAllAgents();
      
      // ✅ FORMAT DE RÉPONSE STANDARD
      res.json({
        success: true,
        data: agents,
        count: agents.length
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error getting all agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur serveur lors du chargement des agents",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
      
      res.json({
        success: true,
        data: agent
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

      agentData.image = '/images/default-avatar.svg';
      
      console.log("🔄 Controller: Creating new agent", { 
        nom: agentData.nom,
        prenom: agentData.prenom,
        matricule: agentData.matricule,
        mail: agentData.mail,
        role: agentData.role
      });
      
      const newAgent = await agentService.createAgent(agentData);
      
      res.status(201).json({
        success: true,
        message: "Agent créé avec succès",
        data: newAgent
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
      
       // ✅ GARDER L'IMAGE EXISTANTE OU UTILISER SVG PAR DÉFAUT
    if (!agentData.image || agentData.image.includes('default-avatar')) {
      agentData.image = '/images/default-avatar.svg';
    }

      console.log(`🔄 Controller: Updating agent ${id}`, {
        nom: agentData.nom,
        prenom: agentData.prenom,
        matricule: agentData.matricule,
        mail: agentData.mail,
        role: agentData.role
      });
      
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      res.json({
        success: true,
        message: "Agent modifié avec succès",
        data: updatedAgent
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
}