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

// src/routes/presenceRoutes.ts
router.post('/entree', async (req, res) => {
  console.log('POST /presences/entree appelé avec body:', req.body);
  
  // ✅ VALIDATION RENFORCÉE
  const { nom, prenom, signatureEntree } = req.body;
  
  if (!nom || !prenom) {
    return res.status(400).json({
      success: false,
      error: 'Nom et prénom sont obligatoires'
    });
  }
  
  // Signature optionnelle pour l'entrée, mais si présente, doit être valide
  if (signatureEntree && signatureEntree.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Signature invalide (trop courte)'
    });
  }

  try {
    await presenceController.pointageEntree(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.post('/sortie', async (req, res) => {
  console.log('POST /presences/sortie appelé avec body:', req.body);

  const { matricule, nom, prenom, signatureSortie, heureSortieManuelle } = req.body;

  // ✅ VALIDATION OBLIGATOIRE POUR LA SORTIE
  if (!signatureSortie) {
    return res.status(400).json({
      success: false,
      error: 'La signature de sortie est obligatoire'
    });
  }

  // Vérifier que la signature n'est pas vide
  if (signatureSortie.trim().length < 50) { // Base64 minimal
    return res.status(400).json({
      success: false,
      error: 'Signature trop courte ou invalide'
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
    await presenceController.pointageSortie(req, res);
  } catch (error: any) {
    console.error('Erreur pointage sortie:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors du pointage de sortie'
    });
  }
});

// Dans presenceRoutes.ts
router.get('/signature/:id/:type', async (req, res) => {
  try {
    await presenceController.getSignature(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
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