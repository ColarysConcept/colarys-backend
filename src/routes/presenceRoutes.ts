// src/routes/presenceRoutes.ts - VERSION CORRIGÉE
import { Router } from 'express';
import axios from 'axios';

const router = Router();
const API_BASE_URL = 'https://theme-gestion-des-resources-et-prod.vercel.app/api';

// Route racine
router.get('/', (req, res) => {
  console.log('GET /presences/ appelé');
  res.json({ message: 'API de présences - Utilisez les routes spécifiques' });
});

// Pointage entrée - redirige vers l'API minimal.js
router.post('/entree', async (req, res) => {
  console.log('POST /presences/entree appelé avec body:', req.body);
  
  // ✅ VALIDATION RENFORCÉE
  const { nom, prenom } = req.body;
  
  if (!nom || !prenom) {
    return res.status(400).json({
      success: false,
      error: 'Nom et prénom sont obligatoires'
    });
  }
  
  try {
    // Appeler l'API minimal.js qui fonctionne
    const response = await axios.post(`${API_BASE_URL}/presences/entree-ultra-simple`, req.body);
    
    // Retourner la réponse de l'API
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur lors du pointage:', error);
    
    // En cas d'erreur, utiliser la route garantie
    try {
      const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/pointage-garanti`, req.body);
      res.status(fallbackResponse.status).json(fallbackResponse.data);
    } catch (fallbackError: any) {
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        details: error.message
      });
    }
  }
});

// Pointage sortie
router.post('/sortie', async (req, res) => {
  console.log('POST /presences/sortie appelé avec body:', req.body);

  const { matricule, nom, prenom, heureSortieManuelle } = req.body;

  // On doit avoir soit un matricule, soit nom + prénom
  if (!matricule && (!nom || !prenom)) {
    return res.status(400).json({
      success: false,
      error: 'Matricule ou nom + prénom requis pour identifier l\'agent'
    });
  }

  try {
    // Appeler l'API minimal.js
    const response = await axios.post(`${API_BASE_URL}/presences/sortie-ultra-simple`, {
      matricule: matricule || '',
      heureSortieManuelle
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur pointage sortie:', error);
    
    // Essayer la version simple
    try {
      const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/sortie-simple`, {
        matricule: matricule || '',
        heureSortieManuelle
      });
      res.status(fallbackResponse.status).json(fallbackResponse.data);
    } catch (fallbackError: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors du pointage de sortie'
      });
    }
  }
});

// Vérification état présence
router.post('/verifier-etat', async (req, res) => {
  console.log('POST /presences/verifier-etat appelé avec body:', req.body);
  try {
    const response = await axios.post(`${API_BASE_URL}/presences/verifier-etat`, req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur vérification état:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Historique
router.get('/historique', async (req, res) => {
  console.log('GET /presences/historique appelé avec query:', req.query);
  try {
    const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
      params: req.query
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur historique:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Présence aujourd'hui par matricule
router.get('/aujourdhui/:matricule', async (req, res) => {
  console.log('GET /presences/aujourdhui/:matricule appelé avec matricule:', req.params.matricule);
  try {
    const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/${req.params.matricule}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur présence aujourd\'hui:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Présence aujourd'hui par nom + prénom
router.get('/aujourdhui/nom/:nom/prenom/:prenom', async (req, res) => {
  console.log('GET /presences/aujourdhui/nom/:nom/prenom/:prenom appelé avec:', req.params);
  try {
    const nom = encodeURIComponent(req.params.nom);
    const prenom = encodeURIComponent(req.params.prenom);
    const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/nom/${nom}/prenom/${prenom}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Erreur présence nom/prénom:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Export PDF/Excel
router.get('/export/:format', async (req, res) => {
  console.log('GET /presences/export/:format appelé avec params:', req.params, 'query:', req.query);
  try {
    // Pour l'export, générer le PDF localement avec les données de l'API
    if (req.params.format === 'pdf') {
      // Récupérer les données d'historique
      const historiqueResponse = await axios.get(`${API_BASE_URL}/presences/historique`, {
        params: req.query
      });
      
      const { data, totalHeures, totalPresences } = historiqueResponse.data;
      
      // Générer le PDF localement
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      
      // Titre
      doc.fontSize(18).font('Helvetica-Bold').text('Rapport des Présences - Colarys', 30, 40);
      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 30, 65);
      
      // Stats
      doc.fontSize(12).fillColor('#2c3e50');
      doc.text(`Total présences : ${totalPresences}`, 30, 95);
      doc.text(`Total heures travaillées : ${totalHeures.toFixed(2)} h`, 30, 115);
      
      // Colonnes
      const columns = [
        { label: 'Date', width: 80 },
        { label: 'Matricule', width: 90 },
        { label: 'Nom Prénom', width: 160 },
        { label: 'Entrée', width: 70 },
        { label: 'Sortie', width: 70 },
        { label: 'Heures', width: 70 },
        { label: 'Shift', width: 60 },
        { label: 'Campagne', width: 100 },
      ];
      
      let y = 160;
      const rowHeight = 30;
      
      // En-tête tableau
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
      let x = 30;
      columns.forEach(col => {
        doc.text(col.label, x, y, { width: col.width, align: 'center' });
        x += col.width;
      });
      
      y += rowHeight;
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      
      // Lignes de données
      for (const p of data) {
        if (y > 550) {
          doc.addPage();
          y = 50;
        }
        
        x = 30;
        const nomComplet = `${p.nom} ${p.prenom}`.trim();
        
        const rowData = [
          new Date(p.date).toLocaleDateString('fr-FR'),
          p.matricule || '—',
          nomComplet.length > 25 ? nomComplet.substring(0, 22) + '...' : nomComplet,
          p.heure_entree || '—',
          p.heure_sortie || '—',
          p.heures_travaillees ? p.heures_travaillees.toFixed(2) + 'h' : '—',
          p.shift || 'JOUR',
          p.campagne || 'Standard',
        ];
        
        rowData.forEach((text, i) => {
          doc.text(text, x, y, { width: columns[i].width, align: 'center' });
          x += columns[i].width;
        });
        
        y += rowHeight;
      }
      
      // Pied de page
      doc.fontSize(10).fillColor('#2c3e50');
      doc.text(`TOTAL : ${totalPresences} présence(s) — ${totalHeures.toFixed(2)} heures`, 30, y + 20);
      
      // Stream du PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique-presences-${new Date().toISOString().split('T')[0]}.pdf`
      );
      
      doc.pipe(res);
      doc.end();
    } else {
      res.status(400).json({ success: false, error: 'Format non supporté' });
    }
  } catch (error: any) {
    console.error('Erreur export:', error);
    res.status(500).json({ success: false, error: 'Erreur export', details: error.message });
  }
});

export default router;