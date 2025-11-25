// src/controllers/AdminController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { Presence } from "../entities/Presence";

export class AdminController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Getting admin stats...');
      
      const userRepository = AppDataSource.getRepository(User);
      const agentRepository = AppDataSource.getRepository(Agent);
      const presenceRepository = AppDataSource.getRepository(Presence);

      const [
        totalUsers,
        totalAgents,
        totalPresences,
        activeUsers
      ] = await Promise.all([
        userRepository.count(),
        agentRepository.count(),
        presenceRepository.count(),
        userRepository.count({ where: { /* conditions for active users */ } })
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalAgents,
          totalPresences,
          activeUsers,
          systemStatus: 'operational',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting admin stats:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de récupérer les statistiques'
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('👥 Getting all users...');
      
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error: any) {
      console.error('❌ Error getting users:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de récupérer la liste des utilisateurs'
      });
    }
  }

  async resetUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      console.log(`🔐 Resetting password for user ${userId}...`);
      
      if (!newPassword) {
        res.status(400).json({
          success: false,
          error: 'Nouveau mot de passe requis'
        });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(userId) } });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
        return;
      }

      // Dans un vrai scénario, vous devriez hasher le mot de passe
      // user.password = await bcrypt.hash(newPassword, 10);
      // await userRepository.save(user);

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de réinitialiser le mot de passe'
      });
    }
  }

  async createBackup(req: Request, res: Response): Promise<void> {
    try {
      console.log('💾 Creating backup...');
      
      // Simulation de création de backup
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: ['users', 'agents', 'presences']
      };

      res.json({
        success: true,
        data: {
          message: 'Backup créé avec succès',
          backup: backupData,
          downloadUrl: `/api/admin/backup/download/${Date.now()}`
        }
      });
    } catch (error: any) {
      console.error('❌ Error creating backup:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de créer le backup'
      });
    }
  }

  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 Getting system logs...');
      
      // Simulation de récupération de logs
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'System started successfully',
          service: 'API'
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'INFO',
          message: 'User login successful',
          service: 'Auth'
        }
      ];

      res.json({
        success: true,
        data: logs
      });
    } catch (error: any) {
      console.error('❌ Error getting logs:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de récupérer les logs'
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      console.log(`🗑️ Deleting user ${userId}...`);
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(userId) } });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
        return;
      }

      // Ne pas permettre la suppression de l'utilisateur actuel ou de l'admin principal
      if (user.email === 'ressource.prod@gmail.com') {
        res.status(400).json({
          success: false,
          error: 'Impossible de supprimer l\'administrateur principal'
        });
        return;
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de supprimer l\'utilisateur'
      });
    }
  }
}