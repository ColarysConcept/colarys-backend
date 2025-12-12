// backend/src/routes/presenceRoutes.ts

import { Router } from 'express';
import { PresenceController } from '../controllers/PresenceController';

const router = Router();
const controller = new PresenceController();

// Pointages
router.post('/entree', controller.pointageEntree.bind(controller));
router.post('/sortie', controller.pointageSortie.bind(controller));

// Historique
router.get('/historique', controller.getHistorique.bind(controller));

// Présence aujourd'hui
router.get('/aujourdhui/:matricule', controller.getPresenceAujourdhui.bind(controller));
router.get('/aujourdhui/nom/:nom/prenom/:prenom', controller.getPresenceAujourdhuiByNomPrenom.bind(controller));

// Export
router.get('/export/:format', controller.exportHistorique.bind(controller));

export default router;