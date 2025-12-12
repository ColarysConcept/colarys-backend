// PresenceController.ts - VERSION CORRIGÉE
import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../config/data-source"; // Assurez-vous que ce chemin est correct
import { Presence } from "../entities/Presence";
import { Agent } from "../entities/Agent";
import { PresenceService } from "../services/PresenceService"; // Import du service

const API_BASE_URL = 'https://theme-gestion-des-resources-et-prod.vercel.app/api';

export class PresenceController {
  private presenceService: PresenceService;

  constructor() {
    this.presenceService = new PresenceService();
  }

  async pointageEntree(req: Request, res: Response) {
    try {
      console.log('Controller - pointageEntree:', req.body);
      
      // VALIDATION
      const { nom, prenom, matricule, campagne, shift, heureEntreeManuelle } = req.body;
      
      if (!nom || !prenom) {
        return res.status(400).json({ 
          success: false, 
          error: "Nom et prénom sont requis" 
        });
      }

      // Utiliser le service
      const data = {
        matricule: matricule || '',
        nom,
        prenom,
        campagne: campagne || 'Standard',
        shift: shift || 'JOUR',
        heureEntreeManuelle
      };
      
      const result = await this.presenceService.pointageEntree(data);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
      
    } catch (error: any) {
      console.error('Controller - Erreur pointage entrée:', error);
      
      // Fallback vers l'API externe
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

      // Utiliser le service
      const result = await this.presenceService.pointageSortie(matricule, heureSortieManuelle);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Controller - Erreur pointage sortie:', error);
      
      // Fallback vers l'API externe
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
      // 1. D'abord, essayer d'utiliser notre propre base de données
      try {
        // Récupérer les filtres
        const {
          dateDebut,
          dateFin,
          matricule,
          nom,
          prenom,
          annee,
          mois,
          campagne,
          shift,
          limit = 100,
          offset = 0
        } = req.query;

        // Vérifier la connexion à la base de données
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

        // Créer le query builder
        const presenceRepository = AppDataSource.getRepository(Presence);
        let query = presenceRepository
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

        // Appliquer les filtres de date
        let startDate = dateDebut as string;
        let endDate = dateFin as string;

        // Si pas de dates, utiliser ce mois-ci
        if (!startDate || !endDate) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
          
          console.log('📅 Dates par défaut appliquées:', { startDate, endDate });
        }

        query.where('presence.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });

        // Filtre par matricule
        if (matricule) {
          query.andWhere('agent.matricule LIKE :matricule', {
            matricule: `%${matricule}%`
          });
        }

        // Filtre par nom
        if (nom) {
          query.andWhere('agent.nom LIKE :nom', {
            nom: `%${nom}%`
          });
        }

        // Filtre par prénom
        if (prenom) {
          query.andWhere('agent.prenom LIKE :prenom', {
            prenom: `%${prenom}%`
          });
        }

        // Filtre par campagne
        if (campagne) {
          query.andWhere('agent.campagne = :campagne', { campagne });
        }

        // Filtre par shift
        if (shift) {
          query.andWhere('presence.shift = :shift', { shift });
        }

        // Filtre par année/mois (alternative)
        if (annee && mois) {
          query.andWhere('EXTRACT(YEAR FROM presence.date) = :annee', { annee });
          query.andWhere('EXTRACT(MONTH FROM presence.date) = :mois', { mois });
        }

        // Pagination
        const limitNum = parseInt(limit as string) || 100;
        const offsetNum = parseInt(offset as string) || 0;
        
        query
          .orderBy('presence.date', 'DESC')
          .addOrderBy('presence.heureEntree', 'DESC')
          .skip(offsetNum)
          .take(limitNum);

        // Exécuter la requête
        const presences = await query.getMany();
        const totalCount = await query.getCount();

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

        // Calculer le total des heures
        const totalHeures = presences.reduce((sum, p) => {
          return sum + (p.heuresTravaillees ? parseFloat(p.heuresTravaillees.toString()) : 0);
        }, 0);

        // Réponse réussie
        return res.json({
          success: true,
          data: formattedData,
          totalHeures: parseFloat(totalHeures.toFixed(2)),
          totalPresences: totalCount,
          count: presences.length,
          offset: offsetNum,
          limit: limitNum,
          dates_utilisees: {
            dateDebut: startDate,
            dateFin: endDate
          },
          message: `${presences.length} présence(s) trouvée(s)`
        });

      } catch (dbError: any) {
        console.error('❌ Erreur base de données:', dbError.message);
        
        // 2. Fallback: utiliser le service (qui peut appeler l'API externe)
        try {
          const filters = req.query as any;
          const result = await this.presenceService.getHistoriquePresences(filters);
          
          if (result.success !== false) {
            return res.json(result);
          }
          
          // Si le service échoue, continuer au fallback suivant
          throw new Error('Service échoué');
          
        } catch (serviceError: any) {
          console.error('❌ Erreur service:', serviceError.message);
          
          // 3. Fallback final: appeler l'API externe directement
          try {
            const response = await axios.get(`${API_BASE_URL}/presences/historique`, {
              params: req.query
            });
            
            // Formater la réponse de l'API externe
            const apiData = response.data;
            return res.json({
              success: true,
              data: apiData.data || apiData.presences || apiData,
              totalHeures: apiData.totalHeures || 0,
              totalPresences: apiData.totalPresences || (apiData.data ? apiData.data.length : 0),
              count: apiData.count || (apiData.data ? apiData.data.length : 0),
              message: apiData.message || 'Données récupérées depuis API externe'
            });
            
          } catch (apiError: any) {
            console.error('❌ Erreur API externe:', apiError.message);
            throw new Error('Toutes les méthodes ont échoué');
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erreur historique complète:', error);
      
      // En dernier recours, retourner des données vides
      res.status(500).json({ 
        success: false, 
        error: error.message || "Erreur serveur",
        data: [],
        totalHeures: 0,
        totalPresences: 0,
        message: "Impossible de récupérer l'historique"
      });
    }
  }

  async getAllPresences(req: Request, res: Response) {
    try {
      // Utiliser le service
      const presences = await this.presenceService.findAll();
      
      res.json({
        success: true,
        count: presences.length,
        data: presences,
      });
    } catch (error: any) {
      console.error('Controller - Erreur getAllPresences:', error);
      
      // Fallback vers l'API externe
      try {
        const response = await axios.get(`${API_BASE_URL}/presences/recent`);
        res.json({
          success: true,
          count: response.data.count || response.data.data?.length || 0,
          data: response.data.data || [],
        });
      } catch (apiError) {
        res.status(500).json({
          success: false,
          error: "Impossible de récupérer toutes les présences",
          data: []
        });
      }
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

      // Utiliser le service
      const result = await this.presenceService.verifierEtatPresence(matricule, nom, prenom);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Controller - Erreur verifierEtatPresence:', error);
      
      // Fallback vers l'API externe
      try {
        const response = await axios.post(`${API_BASE_URL}/presences/verifier-etat`, {
          matricule: req.body.matricule,
          nom: req.body.nom,
          prenom: req.body.prenom
        });
        res.json(response.data);
      } catch (apiError) {
        res.status(500).json({
          success: false,
          error: error.message || "Erreur de vérification",
        });
      }
    }
  }

  async getPresenceAujourdhui(req: Request, res: Response) {
    try {
      const { matricule } = req.params;
      
      if (!matricule) {
        return res.status(400).json({ success: false, error: "Matricule requis" });
      }

      // Utiliser le service
      const result = await this.presenceService.getPresenceAujourdhuiByMatricule(matricule);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Controller - Erreur getPresenceAujourdhui:', error);
      
      // Fallback vers l'API externe
      try {
        const response = await axios.get(`${API_BASE_URL}/presences/aujourdhui/${req.params.matricule}`);
        res.json(response.data);
      } catch (apiError) {
        res.status(500).json({
          success: false,
          error: error.message || "Erreur serveur",
        });
      }
    }
  }

async getPresenceAujourdhuiByNomPrenom(req: Request, res: Response) {
  // Définir les variables en dehors du try pour qu'elles soient accessibles dans le catch
  const { nom, prenom } = req.params;
  
  if (!nom || !prenom) {
    return res.status(400).json({ success: false, error: "Nom et prénom requis" });
  }
  
  try {
    // Utiliser le service
    const result = await this.presenceService.getPresenceAujourdhuiByNomPrenom(nom, prenom);
    
    res.json(result);
    
  } catch (error: any) {
    console.error('Controller - Erreur getPresenceAujourdhuiByNomPrenom:', error);
    
    // Fallback vers l'API externe
    try {
      const nomEncoded = encodeURIComponent(nom);
      const prenomEncoded = encodeURIComponent(prenom);
      const response = await axios.get(
        `${API_BASE_URL}/presences/aujourdhui/nom/${nomEncoded}/prenom/${prenomEncoded}`
      );
      res.json(response.data);
    } catch (apiError: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }
}

  async exportHistorique(req: Request, res: Response) {
    try {
      const filters = req.query;
      const { format } = req.params;

      if (format !== 'pdf') {
        return res.status(400).json({ success: false, error: "Seul le format PDF est supporté" });
      }

      // Récupérer les données via le service
      const result = await this.presenceService.getHistoriquePresences(filters);

      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: "Impossible de récupérer les données pour l'export"
        });
      }

      const { data, totalHeures, totalPresences } = result;

      // Générer le PDF
      const pdfBuffer = await this.presenceService.generatePDF(data, totalHeures, totalPresences);

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
}