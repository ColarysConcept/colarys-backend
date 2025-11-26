// src/routes/agentRoutes.ts
import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';

const router = Router();
const agentController = new AgentController();

// Routes simples - la vérification DB est maintenant dans le contrôleur
router.get('/', (req, res) => agentController.getAll(req, res));
router.get('/matricule/:matricule', (req, res) => agentController.getByMatricule(req, res));
router.get('/nom/:nom/prenom/:prenom', (req, res) => agentController.getByNomPrenom(req, res));
router.get('/search', (req, res) => agentController.searchByNomPrenom(req, res));

console.log('✅ Agent routes registered');

export default router;