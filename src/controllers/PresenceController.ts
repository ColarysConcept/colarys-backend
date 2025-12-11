// PresenceController.ts - VERSION SIMPLIFIÉE (Proxy vers l'API minimal.js)
import { Request, Response } from "express";
import axios from "axios";

const API_BASE_URL = 'https://theme-gestion-des-resources-et-prod.vercel.app/api';

export class PresenceController {
  constructor() {}

  async pointageEntree(req: Request, res: Response) {
    try {
      console.log('Controller - pointageEntree:', req.body);
      
      // Appeler l'API minimal.js qui fonctionne
      const response = await axios.post(`${API_BASE_URL}/presences/entree-ultra-simple`, req.body);
      
      // Retourner la réponse de l'API
      res.status(201).json(response.data);
    } catch (error: any) {
      console.error('Controller - Erreur pointage entrée:', error);
      
      // Essayer la route garantie en cas d'échec
      try {
        const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/pointage-garanti`, req.body);
        res.status(200).json(fallbackResponse.data);
      } catch (fallbackError: any) {
        res.status(400).json({ 
          success: false, 
          error: error.message || "Erreur lors du pointage d'entrée" 
        });
      }
    }
  }

  async pointageSortie(req: Request, res: Response) {
    try {
      const { matricule, heureSortieManuelle } = req.body;
      if (!matricule) {
        return res.status(400).json({ success: false, error: "Matricule requis" });
      }

      // Appeler l'API minimal.js
      const response = await axios.post(`${API_BASE_URL}/presences/sortie-ultra-simple`, {
        matricule,
        heureSortieManuelle
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error('Controller - Erreur pointage sortie:', error);
      
      // Essayer la version simple
      try {
        const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/sortie-simple`, {
          matricule: req.body.matricule,
          heureSortieManuelle: req.body.heureSortieManuelle
        });
        res.json(fallbackResponse.data);
      } catch (fallbackError: any) {
        res.status(400).json({ 
          success: false, 
          error: error.message || "Erreur lors du pointage de sortie" 
        });
      }
    }
  }

  async getHistorique(req: Request, res: Response) {
    console.log('Controller - getHistorique avec query:', req.query);
    try {
      // Appeler l'API minimal.js
      const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
        params: req.query
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error('Controller - Erreur historique:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Erreur serveur" 
      });
    }
  }

  async getAllPresences(req: Request, res: Response) {
    try {
      // Récupérer les dernières présences
      const response = await axios.get(`${API_BASE_URL}/presences/recent`);
      
      res.json({
        success: true,
        count: response.data.count,
        data: response.data.data,
      });
    } catch (error: any) {
      console.error('Controller - Erreur getAllPresences:', error);
      res.status(500).json({
        success: false,
        error: "Impossible de récupérer toutes les présences",
      });
    }
  }

  async verifierEtatPresence(req: Request, res: Response) {
    try {
      const { matricule, nom, prenom } = req.body;

      if (!matricule && (!nom || !prenom)) {
        return res.status(400).json({
          success: false,
          error: "Matricule OU nom + prénom requis",
        });
      }

      // Appeler l'API minimal.js
      const response = await axios.post(`${API_BASE_URL}/presences/verifier-etat`, {
        matricule,
        nom,
        prenom
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error('Controller - Erreur verifierEtatPresence:', error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur de vérification",
      });
    }
  }

  async getPresenceAujourdhui(req: Request, res: Response) {
    try {
      const { matricule } = req.params;
      if (!matricule) {
        return res.status(400).json({ success: false, error: "Matricule requis" });
      }

      // Appeler l'API minimal.js
      const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/${matricule}`);
      
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }

  async getPresenceAujourdhuiByNomPrenom(req: Request, res: Response) {
    try {
      const { nom, prenom } = req.params;
      if (!nom || !prenom) {
        return res.status(400).json({ success: false, error: "Nom et prénom requis" });
      }

      // Appeler l'API minimal.js
      const nomEncoded = encodeURIComponent(nom);
      const prenomEncoded = encodeURIComponent(prenom);
      const response = await axios.get(
        `${API_BASE_URL}/presences/aujourdhui/nom/${nomEncoded}/prenom/${prenomEncoded}`
      );
      
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }

  async exportHistorique(req: Request, res: Response) {
    try {
      const { dateDebut, dateFin, matricule, annee, mois, campagne, shift } = req.query;
      const { format } = req.params;

      if (format !== 'pdf') {
        return res.status(400).json({ success: false, error: "Seul le format PDF est supporté" });
      }

      // Récupérer les données
      const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
        params: { dateDebut, dateFin, matricule, annee, mois, campagne, shift }
      });

      const { data, totalHeures, totalPresences } = response.data;

      // Générer le PDF
      const pdfBuffer = await this.generatePDF(data, totalHeures, totalPresences);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique-presences-${new Date().toISOString().split('T')[0]}.pdf`
      );

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Controller - Erreur export PDF:', error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur lors de la génération du PDF",
      });
    }
  }

  private async generatePDF(data: any[], totalHeures: number, totalPresences: number): Promise<Buffer> {
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

    // Finalisation
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}