import { Request, Response, NextFunction } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { ValidationError, NotFoundError } from "../middleware/errorMiddleware";

const agentService = new AgentColarysService();

export class AgentColarysController {
  
  static async getAllAgents(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agents = await agentService.getAllAgents();
      
      // ✅ FORMAT DE RÉPONSE CORRIGÉ
      res.json(agents); // ✅ Retourne directement le tableau
      
    } catch (error: any) {
      console.error("❌ Controller Error getting all agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur lors du chargement des agents",
        message: error.message
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
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      // ✅ RETOUR DIRECT DE L'AGENT
      res.json(agent);
      
    } catch (error: any) {
      console.error("❌ Controller Error getting agent by ID:", error);
      
      if (error.message.includes("non trouvé") || error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur lors de la récupération de l'agent",
          message: error.message
        });
      }
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agentData = req.body;
      
      // ✅ IMAGE PAR DÉFAUT POUR TOUS LES AGENTS
      agentData.image = '/images/default-avatar.svg';
      
      console.log("🔄 Controller: Creating new agent", { 
        ...agentData, 
        password: '***' // Masquer le mot de passe dans les logs
      });
      
      const newAgent = await agentService.createAgent(agentData);
      
      res.status(201).json(newAgent); // ✅ Retour direct
      
    } catch (error: any) {
      console.error("❌ Controller Error creating agent:", error);
      
      res.status(400).json({
        success: false,
        error: "Erreur lors de la création de l'agent",
        message: error.message
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
      
      // ✅ TOUJOURS UTILISER L'IMAGE PAR DÉFAUT SUR VERCEL
      agentData.image = '/images/default-avatar.svg';
      
      console.log(`🔄 Controller: Updating agent ${id}`, { 
        ...agentData, 
        password: '***' 
      });
      
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      if (!updatedAgent) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      res.json(updatedAgent); // ✅ Retour direct
      
    } catch (error: any) {
      console.error("❌ Controller Error updating agent:", error);
      
      if (error.message.includes("non trouvé") || error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Erreur lors de la modification de l'agent",
          message: error.message
        });
      }
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
    
    // ✅ CORRECTION : Appel simple sans vérification de résultat
    await agentService.deleteAgent(id);
    
    res.json({
      success: true,
      message: "Agent supprimé avec succès"
    });
    
  } catch (error: any) {
    console.error("❌ Controller Error deleting agent:", error);
    
    if (error.message.includes("non trouvé") || error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Erreur lors de la suppression de l'agent",
        message: error.message
      });
    }
  }
}

  // ✅ ENDPOINT SIMPLIFIÉ - TOUJOURS RETOURNER L'AVATAR PAR DÉFAUT
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

  // ✅ ENDPOINT DE SANTÉ SIMPLIFIÉ
  static async healthCheck(_req: Request, res: Response) {
    try {
      console.log("🔍 Health check agents endpoint");
      
      const agents = await agentService.getAllAgents();
      
      res.json({
        success: true,
        message: "Service agents opérationnel",
        agentsCount: agents.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("❌ Health check agents failed:", error);
      
      res.status(500).json({
        success: false,
        error: "Service agents non disponible",
        message: error.message
      });
    }
  }

  // ✅ NOUVEL ENDPOINT : RECHERCHE D'AGENTS
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
      
      // ✅ RECHERCHE SIMPLE DANS TOUS LES CHAMPS
      const filteredAgents = allAgents.filter(agent => 
        agent.nom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.prenom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.matricule?.toLowerCase().includes(query.toLowerCase()) ||
        agent.mail?.toLowerCase().includes(query.toLowerCase()) ||
        agent.role?.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json(filteredAgents); // ✅ Retour direct du tableau
      
    } catch (error: any) {
      console.error("❌ Controller Error searching agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche des agents",
        message: error.message
      });
    }
  }
}