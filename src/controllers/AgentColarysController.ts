// src/controllers/AgentColarysController.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Request, Response } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { AgentColarys } from "../entities/AgentColarys";

export class AgentColarysController {
  
  static async getAllAgents(_req: Request, res: Response) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agentService = new AgentColarysService(); // Instance à chaque appel
      const agents = await agentService.getAllAgents();
      
      // ✅ FORMATER LES IMAGES POUR CHAQUE AGENT (version sécurisée)
      const agentsWithFormattedImages = agents.map(agent => ({
        ...agent,
        displayImage: agent.image && !agent.image.includes('default-avatar') 
          ? agent.image 
          : '/images/default-avatar.svg',
        hasDefaultImage: !agent.image || agent.image.includes('default-avatar')
      }));
      
      res.json({
        success: true,
        data: agentsWithFormattedImages,
        count: agents.length
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error getting all agents:", error);
      
      if (error.message.includes("Database")) {
        return res.status(503).json({
          success: false,
          error: "Database unavailable",
          message: "Service temporarily unavailable"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur serveur lors du chargement des agents",
        message: error.message
      });
    }
  }

  static async getAgentById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      console.log(`🔄 Controller: Getting agent with ID: ${id}`);
      const agentService = new AgentColarysService();
      const agent = await agentService.getAgentById(id);
      
      // ✅ FORMATER L'IMAGE POUR CET AGENT (version sécurisée)
      const agentWithFormattedImage = {
        ...agent,
        displayImage: agent.image && !agent.image.includes('default-avatar') 
          ? agent.image 
          : '/images/default-avatar.svg',
        hasDefaultImage: !agent.image || agent.image.includes('default-avatar')
      };
      
      res.json({
        success: true,
        data: agentWithFormattedImage
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error getting agent by ID:", error);
      
      if (error.message.includes("non trouvé") || error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération de l'agent",
        message: error.message
      });
    }
  }

  static async createAgent(req: Request, res: Response) {
  try {
    let agentData: Partial<AgentColarys>;
    
    // Vérifier si c'est un FormData (upload d'image)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      agentData = {
        matricule: req.body.matricule,
        nom: req.body.nom,
        prenom: req.body.prenom,
        role: req.body.role,
        mail: req.body.mail,
        contact: req.body.contact,
        entreprise: req.body.entreprise || 'Colarys Concept'
      };
      
      // Si une image est uploadée, elle sera traitée séparément
      if (req.file) {
        // Pour la création, on peut uploader l'image après la création de l'agent
        // ou modifier la logique pour gérer l'upload pendant la création
        console.log('📸 Image reçue lors de la création, mais non traitée directement');
      }
    } else {
      // Données JSON normales
      agentData = req.body;
    }

    const agentService = new AgentColarysService();
    
    console.log("🔄 Controller: Creating new agent", { 
      nom: agentData.nom,
      prenom: agentData.prenom,
      matricule: agentData.matricule,
      mail: agentData.mail,
      role: agentData.role
    });
    
    const newAgent = await agentService.createAgent(agentData);
    
    // Si une image était fournie lors de la création, l'uploader maintenant
    if (req.file && newAgent.id) {
      try {
        const updatedAgent = await agentService.uploadAgentImage(newAgent.id, req.file.buffer);
        newAgent.image = updatedAgent.image;
        newAgent.imagePublicId = updatedAgent.imagePublicId;
      } catch (uploadError) {
        console.error("❌ Error uploading image during creation:", uploadError);
        // Continuer même si l'upload échoue
      }
    }
    
    // Formater l'image pour la réponse
    const agentWithFormattedImage = {
      ...newAgent,
      displayImage: newAgent.image,
      hasDefaultImage: !newAgent.image || newAgent.image.includes('default-avatar')
    };
    
    res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: agentWithFormattedImage
    });
    
  } catch (error: any) {
    console.error("❌ Controller Error creating agent:", error);
    
    if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
      return res.status(400).json({
        success: false,
        error: "Le matricule ou l'email existe déjà"
      });
    }
    
    if (error.message.includes("champs obligatoires") || error.message.includes("required")) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires doivent être remplis"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'agent",
      message: error.message
    });
  }
}
  static async updateAgent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      const agentData = req.body;
      const agentService = new AgentColarysService();
      
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
        displayImage: updatedAgent.image && !updatedAgent.image.includes('default-avatar') 
          ? updatedAgent.image 
          : '/images/default-avatar.svg',
        hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar')
      };
      
      res.json({
        success: true,
        message: "Agent modifié avec succès",
        data: agentWithFormattedImage
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error updating agent:", error);
      
      if (error.message.includes("non trouvé") || error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
        return res.status(400).json({
          success: false,
          error: "Le matricule ou l'email existe déjà pour un autre agent"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la modification de l'agent",
        message: error.message
      });
    }
  }

  static async deleteAgent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "ID invalide"
        });
      }
      
      console.log(`🔄 Controller: Deleting agent ${id}`);
      const agentService = new AgentColarysService();
      
      await agentService.deleteAgent(id);
      
      res.json({
        success: true,
        message: "Agent supprimé avec succès"
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error deleting agent:", error);
      
      if (error.message.includes("non trouvé") || error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la suppression de l'agent",
        message: error.message
      });
    }
  }

  static async uploadImage(req: Request, res: Response) {
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
      const agentService = new AgentColarysService();
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
      
      const agentService = new AgentColarysService();
      const allAgents = await agentService.getAllAgents();
      const filteredAgents = allAgents.filter(agent => 
        agent.nom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.prenom?.toLowerCase().includes(query.toLowerCase()) ||
        agent.matricule?.toLowerCase().includes(query.toLowerCase()) ||
        agent.mail?.toLowerCase().includes(query.toLowerCase()) ||
        agent.role?.toLowerCase().includes(query.toLowerCase())
      );
      
      // Formater les images pour les résultats
      const agentsWithFormattedImages = filteredAgents.map(agent => ({
        ...agent,
        displayImage: agent.image && !agent.image.includes('default-avatar') 
          ? agent.image 
          : '/images/default-avatar.svg',
        hasDefaultImage: !agent.image || agent.image.includes('default-avatar')
      }));
      
      res.json({
        success: true,
        data: agentsWithFormattedImages,
        count: filteredAgents.length
      });
      
    } catch (error: any) {
      console.error("❌ Controller Error searching agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche des agents",
        message: error.message
      });
    }
  }

  // 🔥 MÉTHODE POUR UPLOADER DES IMAGES RÉELLES
 static async uploadAgentImage(req: Request, res: Response) {
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

    console.log(`🔄 Controller: Uploading real image for agent ${agentId}`);
    const agentService = new AgentColarysService();

    const updatedAgent = await agentService.uploadAgentImage(
      agentId, 
      req.file.buffer
    );

    // Formater l'image pour la réponse
    const agentWithFormattedImage = {
      ...updatedAgent,
      displayImage: updatedAgent.image,
      hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar')
    };

    res.json({
      success: true,
      message: "Image uploadée avec succès",
      data: {
        agent: agentWithFormattedImage
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
  static async deleteAgentImage(req: Request, res: Response) {
    try {
      const agentId = parseInt(req.params.agentId);
      
      if (isNaN(agentId)) {
        return res.status(400).json({
          success: false,
          error: "ID agent invalide"
        });
      }

      const agentService = new AgentColarysService();
      const updatedAgent = await agentService.deleteAgentImage(agentId);

      // Formater l'image pour la réponse
      const agentWithFormattedImage = {
        ...updatedAgent,
        displayImage: updatedAgent.image && !updatedAgent.image.includes('default-avatar') 
          ? updatedAgent.image 
          : '/images/default-avatar.svg',
        hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar')
      };

      res.json({
        success: true,
        message: "Image supprimée avec succès",
        data: {
          agent: agentWithFormattedImage
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