// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// ✅ CORRECTION : Seulement les routes existantes
router.post('/login', (req, res) => {
  console.log('POST /auth/login called with:', req.body);
  authController.login(req, res);
});

// Route de base pour tester
router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth API is working',
    availableEndpoints: ['POST /login'] // ✅ Seulement login pour l'instant
  });
});

export default router;