"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/Auth/AuthService");
const logger_1 = require("../config/logger");
class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            logger_1.logger.warn('Tentative de connexion sans credentials', {
                email: email || 'non fourni',
                ip: req.ip
            });
            return res.status(400).json({ error: "Email et mot de passe requis" });
        }
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        try {
            logger_1.logger.info(`Tentative de connexion pour ${trimmedEmail}`, {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            const { user, token } = await AuthService_1.AuthService.login(email, password);
            const userResponse = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            };
            logger_1.logger.info(`Connexion réussie pour ${trimmedEmail}`, {
                userId: user.id,
                role: user.role
            });
            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            });
        }
        catch (error) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }
    }
}
exports.AuthController = AuthController;
