import { Request, Response } from "express";
import { AuthService } from "../services/Auth/AuthService";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      console.log('🔐 Login attempt:', { email });
      
      // ✅ UTILISATION RÉELLE DU SERVICE
      const authResult = await AuthService.login(email, password);
      
      // ✅ Réponse de succès AVEC VRAIES DONNÉES
      res.json({
        success: true,
        message: 'Login successful',
        token: authResult.token, // Vrai token JWT
        user: authResult.user    // Vrai utilisateur de la base
      });
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // ✅ Gestion propre des erreurs
      res.status(401).json({
        success: false,
        error: error.message || 'Email ou mot de passe incorrect'
      });
    }
  }
}