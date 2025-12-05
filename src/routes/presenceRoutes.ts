// src/routes/presenceRoutes.ts
import { Router } from 'express';
import { PresenceController } from '../controllers/PresenceController';

const router = Router();
const presenceController = new PresenceController();

// Route racine
router.get('/', (req, res) => {
  console.log('GET /presences/ appelé');
  presenceController.getAllPresences(req, res);
});

// POINTAGE ENTRÉE – accepte matricule OU nom + prénom
router.post('/entree', async (req, res) => {
  console.log('POST /presences/entree appelé avec body:', req.body);
  try {
    await presenceController.pointageEntree(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POINTAGE SORTIE – CORRIGÉ POUR FONCTIONNER SANS MATRICULE
router.post('/sortie', async (req, res) => {
  console.log('POST /presences/sortie appelé avec body:', req.body);

  const { matricule, nom, prenom, signatureSortie, heureSortieManuelle } = req.body;

  // Validation de base
  if (!signatureSortie) {
    return res.status(400).json({
      success: false,
      error: 'La signature de sortie est obligatoire'
    });
  }

  // On doit avoir soit un matricule, soit nom + prénom
  if (!matricule && (!nom || !prenom)) {
    return res.status(400).json({
      success: false,
      error: 'Matricule ou nom + prénom requis pour identifier l\'agent'
    });
  }

  try {
    // On passe tout le body au contrôleur – il gère les deux cas
    await presenceController.pointageSortie(req, res);
  } catch (error: any) {
    console.error('Erreur pointage sortie:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors du pointage de sortie'
    });
  }
});

// Vérification état présence
router.post('/verifier-etat', async (req, res) => {
  console.log('POST /presences/verifier-etat appelé avec body:', req.body);
  try {
    await presenceController.verifierEtatPresence(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Historique
router.get('/historique', async (req, res) => {
  console.log('GET /presences/historique appelé avec query:', req.query);
  try {
    await presenceController.getHistorique(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Présence aujourd'hui par matricule
router.get('/aujourdhui/:matricule', async (req, res) => {
  console.log('GET /presences/aujourdhui/:matricule appelé avec matricule:', req.params.matricule);
  try {
    await presenceController.getPresenceAujourdhui(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Présence aujourd'hui par nom + prénom
router.get('/aujourdhui/nom/:nom/prenom/:prenom', async (req, res) => {
  console.log('GET /presences/aujourdhui/nom/:nom/prenom/:prenom appelé avec:', req.params);
  try {
    await presenceController.getPresenceAujourdhuiByNomPrenom(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Export PDF/Excel
router.get('/export/:format', async (req, res) => {
  console.log('GET /presences/export/:format appelé avec params:', req.params, 'query:', req.query);
  try {
    await presenceController.exportHistorique(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur export' });
  }
});

export default router;