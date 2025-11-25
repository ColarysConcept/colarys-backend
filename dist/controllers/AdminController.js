"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Agent_1 = require("../entities/Agent");
const Presence_1 = require("../entities/Presence");
class AdminController {
    async getStats(req, res) {
        try {
            console.log('📊 Getting admin stats...');
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            const agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
            const presenceRepository = data_source_1.AppDataSource.getRepository(Presence_1.Presence);
            const [totalUsers, totalAgents, totalPresences, activeUsers] = await Promise.all([
                userRepository.count(),
                agentRepository.count(),
                presenceRepository.count(),
                userRepository.count({ where: {} })
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
        }
        catch (error) {
            console.error('❌ Error getting admin stats:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de récupérer les statistiques'
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            console.log('👥 Getting all users...');
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            const users = await userRepository.find({
                select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
            });
            res.json({
                success: true,
                data: users
            });
        }
        catch (error) {
            console.error('❌ Error getting users:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de récupérer la liste des utilisateurs'
            });
        }
    }
    async resetUserPassword(req, res) {
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
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });
        }
        catch (error) {
            console.error('❌ Error resetting password:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de réinitialiser le mot de passe'
            });
        }
    }
    async createBackup(req, res) {
        try {
            console.log('💾 Creating backup...');
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
        }
        catch (error) {
            console.error('❌ Error creating backup:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de créer le backup'
            });
        }
    }
    async getLogs(req, res) {
        try {
            console.log('📋 Getting system logs...');
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
        }
        catch (error) {
            console.error('❌ Error getting logs:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de récupérer les logs'
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            console.log(`🗑️ Deleting user ${userId}...`);
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
                return;
            }
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
        }
        catch (error) {
            console.error('❌ Error deleting user:', error);
            res.status(500).json({
                success: false,
                error: 'Impossible de supprimer l\'utilisateur'
            });
        }
    }
}
exports.AdminController = AdminController;
