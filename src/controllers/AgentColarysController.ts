// src/controllers/AgentColarysController.ts
import { Request, Response, NextFunction } from "express";
import { AgentColarysService } from "../services/AgentColarysService";
import { ValidationError, NotFoundError } from "../middleware/errorMiddleware";
import { v2 as cloudinary } from 'cloudinary';

// 🔥 CONFIGURATION CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const agentService = new AgentColarysService();

// 🔥 SERVICE CLOUDINARY CORRIGÉ
class CloudinaryService {
  static async uploadImage(buffer: Buffer, filename: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'colarys-agents',
          public_id: `agent-${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        },
        (error, result) => {
          // 🔥 CORRECTION: VÉRIFIER SI result EST DÉFINI
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('Cloudinary upload failed: no result returned'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Image deleted from Cloudinary: ${publicId}`, result);
    } catch (error) {
      console.error(`❌ Error deleting image from Cloudinary: ${error}`);
    }
  }
}

export class AgentColarysController {
  
  // AU DÉBUT DE CHAQUE MÉTHODE DU CONTROLLER
// AU DÉBUT DE CHAQUE MÉTHODE DU CONTROLLER
static async getAllAgents(_req: Request, res: Response, next: NextFunction) {
  try {
    // 🔥 AJOUTER CES HEADERS CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    console.log("🔄 Controller: Getting all agents");
    const agents = await agentService.getAllAgents();
    
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);
    next(error);
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
    } catch (error) {
      console.error("❌ Controller Error:", error);
      next(error);
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agentData = req.body;
      
      console.log("🔄 Controller: Creating new agent", agentData);
      
      // 🔥 GÉRER L'UPLOAD D'IMAGE AVEC CLOUDINARY
      if (req.file) {
        console.log("📸 Processing image upload to Cloudinary...");
        const { url, publicId } = await CloudinaryService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
        
        // 🔥 UTILISER LES NOMS DE CHAMP CORRECTS
        agentData.image = url;
        agentData.imagePublicId = publicId;
        console.log(`✅ Image uploaded to Cloudinary: ${url}`);
      } else if (req.body.image) {
        // Si une URL d'image est fournie, l'utiliser directement
        agentData.image = req.body.image;
      }
      
      const newAgent = await agentService.createAgent(agentData);
      
      res.status(201).json({
        success: true,
        message: "Agent créé avec succès",
        data: newAgent
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);
      next(error);
    }
  }

  static async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError("ID invalide");
      }
      
      const agentData = req.body;
      let oldImagePublicId: string | null = null;
      
      // 🔥 RÉCUPÉRER L'ANCIENNE IMAGE POUR LA SUPPRIMER DE CLOUDINARY SI NÉCESSAIRE
      try {
        const existingAgent = await agentService.getAgentById(id);
        if (existingAgent && existingAgent.imagePublicId) {
          oldImagePublicId = existingAgent.imagePublicId;
        }
      } catch (error) {
        console.log("ℹ️ No existing agent found or no image to delete");
      }
      
      // 🔥 GÉRER L'UPLOAD D'IMAGE AVEC CLOUDINARY
      if (req.file) {
        console.log("📸 Processing image upload to Cloudinary for update...");
        const { url, publicId } = await CloudinaryService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
        
        agentData.image = url;
        agentData.imagePublicId = publicId;
        console.log(`✅ New image uploaded to Cloudinary: ${url}`);
        
        // 🔥 SUPPRIMER L'ANCIENNE IMAGE DE CLOUDINARY
        if (oldImagePublicId) {
          await CloudinaryService.deleteImage(oldImagePublicId);
        }
      } else if (req.body.image) {
        // Si une URL d'image est fournie, l'utiliser directement
        agentData.image = req.body.image;
        // Si on change l'URL sans upload, on peut vouloir supprimer l'ancien publicId
        if (req.body.image && oldImagePublicId) {
          agentData.imagePublicId = null; // Ou supprimer l'ancien publicId
        }
      }
      
      console.log(`🔄 Controller: Updating agent ${id}`, agentData);
      
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      res.json({
        success: true,
        message: "Agent modifié avec succès",
        data: updatedAgent
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);
      next(error);
    }
  }

  static async deleteAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError("ID invalide");
      }
      
      // 🔥 RÉCUPÉRER L'AGENT POUR SUPPRIMER SON IMAGE DE CLOUDINARY
      let imagePublicId: string | null = null;
      try {
        const agent = await agentService.getAgentById(id);
        if (agent && agent.imagePublicId) {
          imagePublicId = agent.imagePublicId;
        }
      } catch (error) {
        console.log("ℹ️ Could not retrieve agent for image deletion, continuing with deletion...");
      }
      
      console.log(`🔄 Controller: Deleting agent ${id}`);
      await agentService.deleteAgent(id);
      
      // 🔥 SUPPRIMER L'IMAGE ASSOCIÉE DE CLOUDINARY
      if (imagePublicId) {
        await CloudinaryService.deleteImage(imagePublicId);
      }
      
      res.status(200).json({
        success: true,
        message: "Agent supprimé avec succès"
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);
      next(error);
    }
  }

  // 🔥 ENDPOINT POUR UPLOADER UNE IMAGE SEULE VERS CLOUDINARY
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError("Aucun fichier uploadé");
      }
      
      console.log("📸 Uploading single image to Cloudinary...");
      
      const { url, publicId } = await CloudinaryService.uploadImage(
        req.file.buffer,
        req.file.originalname
      );
      
      console.log(`✅ Single image uploaded to Cloudinary: ${url}`);
      
      res.json({
        success: true,
        message: "Image uploadée avec succès",
        data: {
          imageUrl: url,
          publicId: publicId,
          filename: req.file.originalname
        }
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);
      next(error);
    }
  }

  // 🔥 MÉTHODE POUR TRANSFORMER LES URLS LOCALES EN URLS CLOUDINARY (POUR LA MIGRATION)
  private static transformLocalToCloudinaryUrl(localUrl: string): string {
    // Pour l'instant, retourner une URL par défaut
    // Vous pouvez implémenter une logique de migration ici
    return "/default-avatar.png";
  }
}