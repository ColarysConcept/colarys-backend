import { Request, Response, NextFunction } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { ValidationError, NotFoundError } from "../middleware/errorMiddleware";
import fs from 'fs';
import path from 'path';

const agentService = new AgentColarysService();

export class AgentColarysController {
  
  static async getAllAgents(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🔄 Controller: Getting all agents");
      const agents = await agentService.getAllAgents();
      
      // ✅ CORRECTION : Format de réponse standardisé
      res.json({
        success: true,
        data: agents,
        count: agents.length,
        message: `${agents.length} agents récupérés avec succès`
      });
    } catch (error: any) {
      console.error("❌ Controller Error getting all agents:", error);
      
      // ✅ CORRECTION : Gestion d'erreur améliorée
      res.status(500).json({
        success: false,
        error: "Erreur lors du chargement des agents",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
      });
    }
  }

  static async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError("ID invalide");
      }
      
      console.log(`🔄 Controller: Getting agent with ID: ${id}`);
      const agent = await agentService.getAgentById(id);
      
      res.json({
        success: true,
        data: agent
      });
    } catch (error: any) {
      console.error("❌ Controller Error getting agent by ID:", error);
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: "Agent non trouvé"
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur lors de la récupération de l'agent"
        });
      }
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agentData = req.body;
      
      // ✅ CORRECTION : Gestion sécurisée des uploads Vercel
      if (req.file) {
        if (process.env.VERCEL) {
          // Sur Vercel : stocker en mémoire ou utiliser un service cloud
          console.log('⚠️ Upload fichier ignoré sur Vercel - utilisation image par défaut');
          agentData.image = '/images/default-avatar.svg';
        } else {
          // En local : sauvegarder le fichier
          agentData.image = `/uploads/${req.file.filename}`;
        }
      } else if (req.body.image) {
        // Si une URL d'image est fournie, l'utiliser directement
        agentData.image = req.body.image;
      } else {
        // Image par défaut
        agentData.image = '/images/default-avatar.svg';
      }
      
      console.log("🔄 Controller: Creating new agent", { 
        ...agentData, 
        password: '***' // Masquer le mot de passe dans les logs
      });
      
      const newAgent = await agentService.createAgent(agentData);
      
      res.status(201).json({
        success: true,
        message: "Agent créé avec succès",
        data: newAgent
      });
    } catch (error: any) {
      // ✅ CORRECTION : Nettoyage sécurisé des fichiers uploadés
      if (req.file && !process.env.VERCEL) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️ Fichier uploadé nettoyé après erreur');
        } catch (fsError) {
          console.error('❌ Erreur nettoyage fichier:', fsError);
        }
      }
      
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
        throw new ValidationError("ID invalide");
      }
      
      const agentData = req.body;
      
      // ✅ CORRECTION : Récupération sécurisée de l'agent existant
      let existingAgent;
      try {
        existingAgent = await agentService.getAgentById(id);
      } catch (error) {
        throw new NotFoundError("Agent non trouvé");
      }
      
      let oldImagePath: string | null = null;
      
      // ✅ CORRECTION : Gestion conditionnelle des fichiers
      if (!process.env.VERCEL && existingAgent && existingAgent.image && existingAgent.image.startsWith('/uploads/')) {
        oldImagePath = path.join(__dirname, '../public', existingAgent.image);
      }
      
      // Gérer l'upload d'image
      if (req.file) {
        if (process.env.VERCEL) {
          agentData.image = '/images/default-avatar.svg';
        } else {
          agentData.image = `/uploads/${req.file.filename}`;
        }
      } else if (req.body.image) {
        agentData.image = req.body.image;
      }
      // Si aucune nouvelle image n'est fournie, conserver l'ancienne
      
      console.log(`🔄 Controller: Updating agent ${id}`, { 
        ...agentData, 
        password: '***' 
      });
      
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      // ✅ CORRECTION : Suppression sécurisée de l'ancienne image
      if (req.file && !process.env.VERCEL && oldImagePath && fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ Ancienne image supprimée');
        } catch (fsError) {
          console.error('❌ Erreur suppression ancienne image:', fsError);
        }
      }
      
      res.json({
        success: true,
        message: "Agent modifié avec succès",
        data: updatedAgent
      });
    } catch (error: any) {
      // ✅ CORRECTION : Nettoyage sécurisé
      if (req.file && !process.env.VERCEL) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (fsError) {
          console.error('❌ Erreur nettoyage fichier:', fsError);
        }
      }
      
      console.error("❌ Controller Error updating agent:", error);
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
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
        throw new ValidationError("ID invalide");
      }
      
      // ✅ CORRECTION : Récupération et suppression sécurisées
      let imagePath: string | null = null;
      
      if (!process.env.VERCEL) {
        try {
          const agent = await agentService.getAgentById(id);
          if (agent.image && agent.image.startsWith('/uploads/')) {
            imagePath = path.join(__dirname, '../public', agent.image);
          }
        } catch (error) {
          // Si l'agent n'existe pas, on continue quand même
          console.log('⚠️ Agent non trouvé pour suppression image');
        }
      }
      
      console.log(`🔄 Controller: Deleting agent ${id}`);
      await agentService.deleteAgent(id);
      
      // ✅ CORRECTION : Suppression sécurisée de l'image
      if (imagePath && fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Image agent supprimée');
        } catch (fsError) {
          console.error('❌ Erreur suppression image:', fsError);
        }
      }
      
      res.json({
        success: true,
        message: "Agent supprimé avec succès"
      });
    } catch (error: any) {
      console.error("❌ Controller Error deleting agent:", error);
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
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

  // Endpoint pour uploader une image seule
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError("Aucun fichier uploadé");
      }
      
      let imageUrl: string;
      
      // ✅ CORRECTION : Gestion Vercel vs Local
      if (process.env.VERCEL) {
        console.log('⚠️ Upload image ignoré sur Vercel');
        imageUrl = '/images/default-avatar.svg';
      } else {
        imageUrl = `/uploads/${req.file.filename}`;
      }
      
      res.json({
        success: true,
        message: "Image uploadée avec succès",
        data: {
          imageUrl: imageUrl,
          filename: req.file.filename
        }
      });
    } catch (error: any) {
      // ✅ CORRECTION : Nettoyage sécurisé
      if (req.file && !process.env.VERCEL) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (fsError) {
          console.error('❌ Erreur nettoyage fichier:', fsError);
        }
      }
      
      console.error("❌ Controller Error uploading image:", error);
      
      res.status(400).json({
        success: false,
        error: "Erreur lors de l'upload de l'image",
        message: error.message
      });
    }
  }

  // ✅ CORRECTION : Ajout d'un endpoint de santé pour les agents
  static async healthCheck(_req: Request, res: Response) {
    try {
      console.log("🔍 Health check agents endpoint");
      
      // Test simple de la base de données
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
}