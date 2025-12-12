// PresenceService.ts - VERSION CORRIGÉE (Lecture directe depuis la base)
import axios from 'axios';
import { AppDataSource } from '../config/data-source'; // Assurez-vous d'avoir cette importation
import { Presence } from '../entities/Presence';
import { Agent } from '../entities/Agent';

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
  // Pointage entrée
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

  // Historique des présences - VERSION CORRIGÉE
  async getHistoriquePresences(filters: HistoriqueFilters) {
    try {
      // Créer le query builder pour récupérer les présences
      const presenceRepository = AppDataSource.getRepository(Presence);
      const queryBuilder = presenceRepository
        .createQueryBuilder('presence')
        .leftJoinAndSelect('presence.agent', 'agent')
        .select([
          'presence.id',
          'presence.date',
          'presence.heureEntree',
          'presence.heureSortie',
          'presence.heuresTravaillees',
          'presence.shift',
          'presence.createdAt',
          'agent.id',
          'agent.matricule',
          'agent.nom',
          'agent.prenom',
          'agent.campagne'
        ]);

      // Appliquer les filtres
      if (filters.dateDebut && filters.dateFin) {
        queryBuilder.andWhere('presence.date BETWEEN :dateDebut AND :dateFin', {
          dateDebut: filters.dateDebut,
          dateFin: filters.dateFin
        });
      } else if (filters.annee && filters.mois) {
        // Filtre par année/mois
        queryBuilder.andWhere('EXTRACT(YEAR FROM presence.date) = :annee', { annee: filters.annee });
        queryBuilder.andWhere('EXTRACT(MONTH FROM presence.date) = :mois', { mois: filters.mois });
      } else {
        // Par défaut: ce mois-ci
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        queryBuilder.andWhere('presence.date BETWEEN :dateDebut AND :dateFin', {
          dateDebut: firstDay.toISOString().split('T')[0],
          dateFin: lastDay.toISOString().split('T')[0]
        });
      }

      if (filters.matricule) {
        queryBuilder.andWhere('agent.matricule LIKE :matricule', { 
          matricule: `%${filters.matricule}%` 
        });
      }

      if (filters.nom) {
        queryBuilder.andWhere('agent.nom LIKE :nom', { 
          nom: `%${filters.nom}%` 
        });
      }

      if (filters.prenom) {
        queryBuilder.andWhere('agent.prenom LIKE :prenom', { 
          prenom: `%${filters.prenom}%` 
        });
      }

      if (filters.campagne) {
        queryBuilder.andWhere('agent.campagne = :campagne', { 
          campagne: filters.campagne 
        });
      }

      if (filters.shift) {
        queryBuilder.andWhere('presence.shift = :shift', { 
          shift: filters.shift 
        });
      }

      // Ordonner par date descendante
      queryBuilder.orderBy('presence.date', 'DESC');
      queryBuilder.addOrderBy('presence.heureEntree', 'DESC');

      // Exécuter la requête
      const presences = await queryBuilder.getMany();

      // Calculer le total des heures
      let totalHeures = 0;
      presences.forEach(p => {
        if (p.heuresTravaillees) {
          totalHeures += parseFloat(p.heuresTravaillees.toString());
        }
      });

      // Formater les données pour la réponse
      const formattedData = presences.map(presence => ({
        id: presence.id,
        date: presence.date,
        heure_entree: presence.heureEntree,
        heure_sortie: presence.heureSortie,
        heures_travaillees: presence.heuresTravaillees ? parseFloat(presence.heuresTravaillees.toString()) : null,
        shift: presence.shift,
        agent_id: presence.agent?.id,
        matricule: presence.agent?.matricule || 'N/A',
        nom: presence.agent?.nom || 'Inconnu',
        prenom: presence.agent?.prenom || '',
        campagne: presence.agent?.campagne || 'Standard',
        created_at: presence.createdAt
      }));

      return {
        success: true,
        data: formattedData,
        totalHeures: parseFloat(totalHeures.toFixed(2)),
        totalPresences: presences.length,
        message: `${presences.length} présence(s) trouvée(s)`
      };

    } catch (error: any) {
      console.error('Erreur récupération historique:', error);
      
      // Fallback: essayer l'API externe
      try {
        const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
          params: filters
        });
        return response.data;
      } catch (apiError) {
        return {
          success: false,
          data: [],
          totalHeures: 0,
          totalPresences: 0,
          error: error.message || 'Erreur lors de la récupération de l\'historique'
        };
      }
    }
  }

  // Toutes les présences (version simplifiée)
  async findAll() {
    try {
      const presenceRepository = AppDataSource.getRepository(Presence);
      const presences = await presenceRepository.find({
        relations: ['agent'],
        order: { date: 'DESC', heureEntree: 'DESC' },
        take: 50
      });

      return presences.map(p => ({
        id: p.id,
        date: p.date,
        heure_entree: p.heureEntree,
        heure_sortie: p.heureSortie,
        heures_travaillees: p.heuresTravaillees,
        shift: p.shift,
        matricule: p.agent?.matricule,
        nom: p.agent?.nom,
        prenom: p.agent?.prenom,
        campagne: p.agent?.campagne
      }));

    } catch (error) {
      console.error('Erreur findAll:', error);
      
      // Fallback vers l'API externe
      try {
        const response = await axios.get(`${API_BASE_URL}/presences/recent`);
        return response.data.data || [];
      } catch (apiError) {
        return [];
      }
    }
  }

  // Présence aujourd'hui par matricule
  async getPresenceAujourdhuiByMatricule(matricule: string) {
    try {
      const presenceRepository = AppDataSource.getRepository(Presence);
      const agentRepository = AppDataSource.getRepository(Agent);
      
      // Trouver l'agent
      const agent = await agentRepository.findOne({
        where: { matricule }
      });

      if (!agent) {
        return {
          success: false,
          message: "Agent non trouvé"
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const presence = await presenceRepository.findOne({
        where: {
          agent: { id: agent.id },
          date: today
        },
        relations: ['agent']
      });

      if (!presence) {
        return {
          success: true,
          data: null,
          message: "Aucune présence aujourd'hui"
        };
      }

      return {
        success: true,
        data: {
          id: presence.id,
          date: presence.date,
          heure_entree: presence.heureEntree,
          heure_sortie: presence.heureSortie,
          heures_travaillees: presence.heuresTravaillees,
          shift: presence.shift,
          matricule: agent.matricule,
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        }
      };

    } catch (error: any) {
      console.error('Erreur getPresenceAujourdhuiByMatricule:', error);
      
      // Fallback vers l'API externe
      try {
        const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/${matricule}`);
        return response.data;
      } catch (apiError) {
        return {
          success: false,
          error: error.message || 'Erreur serveur'
        };
      }
    }
  }

  // Présence aujourd'hui par nom/prénom
  async getPresenceAujourdhuiByNomPrenom(nom: string, prenom: string) {
    try {
      const presenceRepository = AppDataSource.getRepository(Presence);
      const agentRepository = AppDataSource.getRepository(Agent);
      
      // Trouver l'agent
      const agent = await agentRepository.findOne({
        where: { nom, prenom }
      });

      if (!agent) {
        return {
          success: true,
          data: null,
          message: "Agent non trouvé"
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const presence = await presenceRepository.findOne({
        where: {
          agent: { id: agent.id },
          date: today
        },
        relations: ['agent']
      });

      if (!presence) {
        return {
          success: true,
          data: null,
          message: "Aucune présence aujourd'hui"
        };
      }

      return {
        success: true,
        data: {
          id: presence.id,
          date: presence.date,
          heure_entree: presence.heureEntree,
          heure_sortie: presence.heureSortie,
          heures_travaillees: presence.heuresTravaillees,
          shift: presence.shift,
          matricule: agent.matricule,
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        }
      };

    } catch (error: any) {
      console.error('Erreur getPresenceAujourdhuiByNomPrenom:', error);
      
      // Fallback vers l'API externe
      try {
        const nomEncoded = encodeURIComponent(nom);
        const prenomEncoded = encodeURIComponent(prenom);
        const response = await axios.get(
          `${API_BASE_URL}/presences/aujourdhui/nom/${nomEncoded}/prenom/${prenomEncoded}`
        );
        return response.data;
      } catch (apiError) {
        return {
          success: false,
          error: error.message || 'Erreur serveur'
        };
      }
    }
  }

  // Génération PDF
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