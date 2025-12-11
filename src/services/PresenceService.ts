// PresenceService.ts - VERSION SIMPLIFIÉE (Proxy vers l'API)
import axios from 'axios';

const API_BASE_URL = 'https://theme-gestion-des-resources-et-prod.vercel.app/api';

interface PointageEntreeData {
  matricule?: string;
  nom: string;
  prenom: string;
  campagne?: string;
  shift?: string;
  heureEntreeManuelle?: string;
}

interface HistoriqueFilters {
  dateDebut?: string;
  dateFin?: string;
  matricule?: string;
  nom?: string;
  prenom?: string;
  annee?: string;
  mois?: string;
  campagne?: string;
  shift?: string;
}

export class PresenceService {
  // Pointage entrée - utilise l'API minimal.js
  async pointageEntree(data: PointageEntreeData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/presences/entree-ultra-simple`, data);
      return response.data;
    } catch (error) {
      // Fallback vers la route garantie
      const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/pointage-garanti`, data);
      return fallbackResponse.data;
    }
  }

  // Pointage sortie
  async pointageSortie(matricule: string, heureSortieManuelle?: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/presences/sortie-ultra-simple`, {
        matricule,
        heureSortieManuelle
      });
      return response.data;
    } catch (error) {
      // Fallback vers la version simple
      const fallbackResponse = await axios.post(`${API_BASE_URL}/presences/sortie-simple`, {
        matricule,
        heureSortieManuelle
      });
      return fallbackResponse.data;
    }
  }

  // Vérification état présence
  async verifierEtatPresence(matricule?: string, nom?: string, prenom?: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/presences/verifier-etat`, {
        matricule,
        nom,
        prenom
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        etat: 'ERROR',
        message: error.message || 'Erreur de vérification'
      };
    }
  }

  // Historique des présences
  async getHistoriquePresences(filters: HistoriqueFilters) {
    try {
      const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
        params: filters
      });
      
      const { data, totalHeures, totalPresences } = response.data;
      
      return {
        data,
        totalHeures,
        totalPresences
      };
    } catch (error: any) {
      console.error('Erreur récupération historique:', error);
      return {
        data: [],
        totalHeures: 0,
        totalPresences: 0
      };
    }
  }

  // Toutes les présences
  async findAll() {
    try {
      const response = await axios.get(`${API_BASE_URL}/presences/recent`);
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Présence aujourd'hui par matricule
  async getPresenceAujourdhuiByMatricule(matricule: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/${matricule}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur serveur'
      };
    }
  }

  // Présence aujourd'hui par nom/prénom
  async getPresenceAujourdhuiByNomPrenom(nom: string, prenom: string) {
    try {
      const nomEncoded = encodeURIComponent(nom);
      const prenomEncoded = encodeURIComponent(prenom);
      const response = await axios.get(
        `${API_BASE_URL}/presences/aujourdhui/nom/${nomEncoded}/prenom/${prenomEncoded}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur serveur'
      };
    }
  }

  // Génération PDF (identique à la version précédente)
  async generatePDF(data: any[], totalHeures: number, totalPresences: number): Promise<Buffer> {
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