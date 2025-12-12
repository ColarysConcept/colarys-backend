// src/routes/presenceRoutes.ts - VERSION CORRIGÉE (juste les routes)
import { Router } from 'express';
import { PresenceController } from '../controllers/PresenceController';

const router = Router();
const presenceController = new PresenceController();

// Route racine
router.get('/', (req, res) => {
  console.log('GET /presences/ appelé');
  res.json({ message: 'API de présences - Utilisez les routes spécifiques' });
});

// Pointage entrée
router.post('/entree', presenceController.pointageEntree.bind(presenceController));

// Pointage sortie
router.post('/sortie', presenceController.pointageSortie.bind(presenceController));

// Vérification état présence
router.post('/verifier-etat', presenceController.verifierEtatPresence.bind(presenceController));

// Historique
router.get('/historique', presenceController.getHistorique.bind(presenceController));

// Toutes les présences
router.get('/recent', presenceController.getAllPresences.bind(presenceController));

// Présence aujourd'hui par matricule
router.get('/aujourdhui/:matricule', presenceController.getPresenceAujourdhui.bind(presenceController));

// Présence aujourd'hui par nom + prénom
router.get('/aujourdhui/nom/:nom/prenom/:prenom', presenceController.getPresenceAujourdhuiByNomPrenom.bind(presenceController));

// Export PDF/Excel
router.get('/export/:format', presenceController.exportHistorique.bind(presenceController));

export default router;