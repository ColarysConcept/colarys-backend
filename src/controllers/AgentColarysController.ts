// src/controllers/AgentColarysController.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Request, Response } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { AgentColarys } from "../entities/AgentColarys";

export class AgentColarysController {
  
  static async getAllAgents(_req: Request, res: Response) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agentService = new AgentColarysService();
      const agents = await agentService.getAllAgents();
      
      // ✅ FORMATER LES IMAGES POUR CHAQUE AGENT
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
      
      // ✅ FORMATER L'IMAGE POUR CET AGENT
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
      console.log('📸 File received in createAgent:', req.file);
      console.log('📦 Body received:', req.body);
      
      let agentData: Partial<AgentColarys>;
      const agentService = new AgentColarysService();
      
      // ✅ GESTION CORRECTE DES FORM DATA AVEC IMAGE
      if (req.file) {
        // Cas 1: Formulaire avec image (FormData)
        agentData = {
          matricule: req.body.matricule,
          nom: req.body.nom,
          prenom: req.body.prenom,
          role: req.body.role,
          mail: req.body.mail,
          contact: req.body.contact || '',
          entreprise: req.body.entreprise || 'Colarys Concept'
        };
        
        console.log("🔄 Controller: Creating agent with image", agentData);
        
        // Créer l'agent d'abord
        const newAgent = await agentService.createAgent(agentData);
        
        // Puis uploader l'image
        if (req.file && newAgent.id) {
          try {
            console.log(`📤 Uploading image for new agent ${newAgent.id}`);
            const updatedAgent = await agentService.uploadAgentImage(newAgent.id, req.file.buffer);
            
            // Formater la réponse avec l'image Cloudinary
            const agentWithFormattedImage = {
              ...updatedAgent,
              displayImage: updatedAgent.image,
              hasDefaultImage: !updatedAgent.image || updatedAgent.image.includes('default-avatar')
            };
            
            return res.status(201).json({
              success: true,
              message: "Agent créé avec succès avec image",
              data: agentWithFormattedImage
            });
            
          } catch (uploadError: any) {
            console.error("❌ Error uploading image during creation:", uploadError);
            // Supprimer l'agent créé si l'upload échoue
            await agentService.deleteAgent(newAgent.id);
            throw new Error("Échec de l'upload de l'image: " + uploadError.message);
          }
        }
        
      } else {
        // Cas 2: Données JSON sans image
        agentData = req.body;
        
        console.log("🔄 Controller: Creating agent without image", agentData);
        
        const newAgent = await agentService.createAgent(agentData);
        
        // Formater l'image pour la réponse
        const agentWithFormattedImage = {
          ...newAgent,
          displayImage: newAgent.image,
          hasDefaultImage: !newAgent.image || newAgent.image.includes('default-avatar')
        };
        
        return res.status(201).json({
          success: true,
          message: "Agent créé avec succès",
          data: agentWithFormattedImage
        });
      }
      
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
      
      if (error.message.includes("Échec de l'upload")) {
        return res.status(400).json({
          success: false,
          error: "Erreur lors de l'upload de l'image",
          message: error.message
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
      
      console.log('📸 File received in updateAgent:', req.file);
      console.log('📦 Body received:', req.body);
      
      const agentService = new AgentColarysService();
      let updatedAgent: AgentColarys;
      
      // ✅ GESTION CORRECTE DE LA MODIFICATION AVEC IMAGE
      if (req.file) {
        // Cas 1: Modification avec nouvelle image
        const agentData = {
          matricule: req.body.matricule,
          nom: req.body.nom,
          prenom: req.body.prenom,
          role: req.body.role,
          mail: req.body.mail,
          contact: req.body.contact || '',
          entreprise: req.body.entreprise || 'Colarys Concept'
        };
        
        console.log(`🔄 Controller: Updating agent ${id} with new image`);
        
        // Mettre à jour les données de l'agent
        updatedAgent = await agentService.updateAgent(id, agentData);
        
        // Uploader la nouvelle image
        updatedAgent = await agentService.uploadAgentImage(id, req.file.buffer);
        
      } else {
        // Cas 2: Modification sans nouvelle image
        const agentData = req.body;
        
        // ✅ GESTION CORRECTE DE L'IMAGE EXISTANTE
        if (!agentData.image) {
          // Ne pas modifier l'image existante si aucune nouvelle image n'est fournie
          delete agentData.image;
          delete agentData.imagePublicId;
        } else if (agentData.image.includes('default-avatar')) {
          // Si on veut explicitement remettre l'image par défaut
          agentData.image = '/images/default-avatar.svg';
          agentData.imagePublicId = 'default-avatar';
        }
        
        console.log(`🔄 Controller: Updating agent ${id} without new image`, {
          nom: agentData.nom,
          prenom: agentData.prenom,
          role: agentData.role
        });
        
        updatedAgent = await agentService.updateAgent(id, agentData);
      }
      
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

  // 🔍 MÉTHODE DE RECHERCHE
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
      const agents = await agentService.searchAgents(query);
      
      // Formater les images pour les résultats
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
      console.error("❌ Controller Error searching agents:", error);
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche des agents",
        message: error.message
      });
    }
  }

  // 🩺 HEALTH CHECK
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

  // 📸 MÉTHODE D'UPLOAD D'IMAGE SIMPLE (pour compatibilité)
  static async uploadImage(req: Request, res: Response) {
    try {
      console.log("🔄 Upload image endpoint called");
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Aucun fichier image fourni"
        });
      }

      // Retourner une URL temporaire ou utiliser Cloudinary
      res.json({
        success: true,
        message: "Image uploadée avec succès",
        data: {
          imageUrl: '/images/default-avatar.svg', // Temporaire
          filename: req.file.originalname
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
}