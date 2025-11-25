"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log('🔐 Login attempt:', { email });
            if (email === 'ressource.prod@gmail.com' && password === 'stage25') {
                console.log('✅ Login réussi (mode urgence)');
                res.json({
                    success: true,
                    message: 'Login successful',
                    token: 'jwt-temp-' + Date.now() + '-valid-token',
                    user: {
                        id: 1,
                        email: email,
                        name: 'Admin Ressources',
                        role: 'admin',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                });
                return;
            }
            console.log('❌ Identifiants incorrects');
            res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }
        catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur lors de l\'authentification'
            });
        }
    }
}
exports.AuthController = AuthController;
