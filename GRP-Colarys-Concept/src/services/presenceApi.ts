// frontend/src/services/presenceApi.ts - VERSION CORRIGÉE COMPLÈTE
import axios from 'axios';
import type { PointageData, HistoriqueFilters, PointageSortieData, Presence, Agent } from '@/types/index';

// ✅ URL BACKEND PERMANENTE
const API_BASE_URL = 'https://colarys-bakend.vercel.app/api';

// Timeouts différents selon le type de requête
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour les requêtes générales
});

// Instance spécifique pour les requêtes longues (agents)
const longTimeoutClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 secondes pour les requêtes lourdes
});

// Instance pour les requêtes critiques rapides
const fastTimeoutClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 secondes pour les requêtes rapides
});

// Interfaces
interface PresenceStats {
  presentsAujourdhui: number;
  enAttenteSortie: number;
  heuresTravaillees: number;
  totalPointages: number;
  entreesAujourdhui: number;
  sortiesAujourdhui: number;
  moyenneHeures: number;
  tauxPresence: number;
  parCampagne: { [key: string]: number };
}

interface AgentsResponse {
  success: boolean;
  data: Agent[];
  message?: string;
}

interface PresencesResponse {
  success: boolean;
  data: Presence[];
  totalHeures?: number;
  totalPresences?: number;
  message?: string;
}

export const presenceService = {
  // Pointage d'entrée - requête rapide
  pointerEntree: (data: PointageData) => {
    console.log('Envoi de pointageEntree avec les données:', data);
    return fastTimeoutClient.post('/api/presences/entree', data);
  },
  
  // Pointage de sortie - requête rapide
  pointerSortie: (data: PointageSortieData) => {
    console.log('Envoi de pointageSortie avec les données:', data);
    return fastTimeoutClient.post('/api/presences/sortie', data);
  },
  
  // Récupérer l'historique des présences avec filtres
  getHistorique: (filters: HistoriqueFilters): Promise<{ data: PresencesResponse }> => {
    console.log('Récupération historique avec filtres:', filters);
    return apiClient.get('/api/presences/historique', { params: filters });
  },

  // Exporter l'historique
  exportHistorique: (filters: HistoriqueFilters, format: 'pdf' | 'excel') => {
    console.log('Export historique avec filters:', filters, 'format:', format);
    return apiClient.get(`/api/presences/export/${format}`, { 
      params: filters,
      responseType: 'blob'
    });
  },
  
  // Récupérer la présence d'aujourd'hui pour un matricule
  getPresenceAujourdhui: (matricule: string) => {
    console.log('Récupération présence aujourd\'hui pour matricule:', matricule);
    return fastTimeoutClient.get(`/api/presences/aujourdhui/${matricule}`);
  },

  // Récupérer la présence d'aujourd'hui par nom et prénom
  getPresenceAujourdhuiByNomPrenom: (nom: string, prenom: string) => {
    console.log('Récupération présence aujourd\'hui pour:', { nom, prenom });
    return fastTimeoutClient.get(`/api/presences/aujourdhui/nom/${nom}/prenom/${prenom}`);
  },

  // Récupérer toutes les présences d'aujourd'hui
  getPresencesAujourdhui: (): Promise<{ data: PresencesResponse }> => {
    const todayDate = new Date().toISOString().split('T')[0];
    console.log('Récupération toutes les présences aujourd\'hui:', todayDate);
    return apiClient.get('/api/presences/historique', {
      params: {
        dateDebut: todayDate,
        dateFin: todayDate
      }
    });
  },

  // Récupérer les statistiques du jour
  getStatsAujourdhui: (): Promise<{ data: PresencesResponse }> => {
    const todayDate = new Date().toISOString().split('T')[0];
    console.log('Récupération statistiques aujourd\'hui:', todayDate);
    return apiClient.get('/api/presences/historique', {
      params: {
        dateDebut: todayDate,
        dateFin: todayDate
      }
    });
  },

  // Vérifier les données (pour debug)
  verifierDonnees: () => {
    console.log('Vérification des données de présence');
    return apiClient.get('/api/presences/verifier-donnees');
  }
};

export const agentService = {
  // Rechercher un agent par matricule - requête rapide
  getByMatricule: (matricule: string) => {
    console.log('Recherche agent par matricule:', matricule);
    return fastTimeoutClient.get(`/api/agents/matricule/${matricule}`);
  },
  
  // Rechercher un agent par nom et prénom - requête rapide
  getByNomPrenom: (nom: string, prenom: string) => {
    console.log('Recherche agent par nom/prénom:', { nom, prenom });
    return fastTimeoutClient.get(`/api/agents/nom/${nom}/prenom/${prenom}`);
  },
  
  // Récupérer tous les agents - REQUÊTE LONGUE avec timeout étendu
  getAllAgents: (): Promise<{ data: AgentsResponse }> => {
    console.log('Récupération de tous les agents (timeout 45s)');
    return longTimeoutClient.get('/api/agents/search');
  },

  // CORRECTION : Ajouter la méthode manquante getAllAgentsWithTimeout
  getAllAgentsWithTimeout: (timeout: number = 45000): Promise<{ data: AgentsResponse }> => {
    console.log(`Récupération de tous les agents (timeout ${timeout}ms)`);
    // Créer une instance temporaire avec le timeout spécifié
    const customTimeoutClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: timeout
    });
    
    // Appliquer les intercepteurs
    setupInterceptors(customTimeoutClient, `CUSTOM_TIMEOUT_${timeout}`);
    
    return customTimeoutClient.get('/api/agents/search');
  },

  // Récupérer les agents avec pagination
  getAgentsWithPagination: (page: number = 1, limit: number = 100) => {
    console.log('Récupération agents avec pagination:', { page, limit });
    return apiClient.get('/api/agents/search', {
      params: { page, limit }
    });
  },

  // Récupérer les statistiques des agents
  getAgentStats: () => {
    console.log('Récupération statistiques agents');
    return apiClient.get('/api/agents/stats');
  },

  // Créer un nouvel agent
  createAgent: (agentData: Partial<Agent>) => {
    console.log('Création nouvel agent:', agentData);
    return apiClient.post('/api/agents', agentData);
  },

  // Mettre à jour un agent
  updateAgent: (id: number, agentData: Partial<Agent>) => {
    console.log('Mise à jour agent:', { id, agentData });
    return apiClient.put(`/api/agents/${id}`, agentData);
  },

  // Supprimer un agent
  deleteAgent: (id: number) => {
    console.log('Suppression agent:', id);
    return apiClient.delete(`/api/agents/${id}`);
  },

  // Recherche avancée d'agents
  searchAgents: (criteria: {
    nom?: string;
    prenom?: string;
    campagne?: string;
    matricule?: string;
  }) => {
    console.log('Recherche avancée agents:', criteria);
    return apiClient.get('/api/agents/search', { params: criteria });
  }
};

// Service pour les statistiques du dashboard avec gestion d'erreur améliorée
export const dashboardService = {
  // Récupérer toutes les données du dashboard avec gestion des timeouts
  getDashboardData: async () => {
    console.log('Récupération données dashboard');
    
    try {
      const [presencesResponse, agentsResponse] = await Promise.all([
        presenceService.getPresencesAujourdhui(),
        agentService.getAllAgentsWithTimeout(60000) // 60 secondes pour le dashboard
      ]);
      
      return {
        presences: presencesResponse.data,
        agents: agentsResponse.data
      };
    } catch (error: any) {
      console.error('Erreur récupération données dashboard:', error);
      throw error;
    }
  },

  // Récupérer les statistiques calculées avec gestion robuste
  getCalculatedStats: async (): Promise<PresenceStats> => {
    try {
      // Utiliser Promise.allSettled pour ne pas bloquer sur une seule erreur
      const [presencesResult, agentsResult] = await Promise.allSettled([
        presenceService.getPresencesAujourdhui(),
        agentService.getAllAgentsWithTimeout(45000)
      ]);

      // Typage explicite des variables
      let presences: Presence[] = [];
      let agents: Agent[] = [];

      if (presencesResult.status === 'fulfilled') {
        const response = presencesResult.value.data as PresencesResponse;
        presences = response.data || [];
        console.log('✅ Présences chargées:', presences.length);
      } else {
        console.error('❌ Erreur chargement présences:', presencesResult.reason);
      }

      if (agentsResult.status === 'fulfilled') {
        const response = agentsResult.value.data as AgentsResponse;
        agents = response.data || [];
        console.log('✅ Agents chargés:', agents.length);
      } else {
        console.error('❌ Erreur chargement agents:', agentsResult.reason);
        // Même sans agents, on peut calculer certaines stats avec les présences
      }

      // Calcul des statistiques avec typage amélioré
      const agentsPresentsIds = new Set(presences.map(p => p.agent?.id).filter(Boolean));
      const presentsAujourdhui = agentsPresentsIds.size;
      const enAttenteSortie = presences.filter(p => p.heureEntree && !p.heureSortie).length;
      
      // Calcul des heures travaillées plus robuste
      let heuresTravaillees = 0;
      presences.forEach(p => {
        if (p.heuresTravaillees && typeof p.heuresTravaillees === 'number') {
          heuresTravaillees += p.heuresTravaillees;
        }
      });

      const entreesAujourdhui = presences.filter(p => p.heureEntree).length;
      const sortiesAujourdhui = presences.filter(p => p.heureSortie).length;
      const totalPointages = entreesAujourdhui + sortiesAujourdhui;

      // Statistiques par campagne avec typage explicite
      const parCampagne: { [key: string]: number } = {};
      presences.forEach(presence => {
        const campagne = presence.agent?.campagne || 'Non définie';
        parCampagne[campagne] = (parCampagne[campagne] || 0) + 1;
      });

      // Calculs des pourcentages avec gestion des divisions par zéro
      const moyenneHeures = presentsAujourdhui > 0 ? parseFloat((heuresTravaillees / presentsAujourdhui).toFixed(2)) : 0;
      const tauxPresence = agents.length > 0 ? Math.round((presentsAujourdhui / agents.length) * 100) : 0;

      return {
        presentsAujourdhui,
        enAttenteSortie,
        heuresTravaillees: parseFloat(heuresTravaillees.toFixed(2)),
        totalPointages,
        entreesAujourdhui,
        sortiesAujourdhui,
        moyenneHeures,
        tauxPresence,
        parCampagne
      };
    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        presentsAujourdhui: 0,
        enAttenteSortie: 0,
        heuresTravaillees: 0,
        totalPointages: 0,
        entreesAujourdhui: 0,
        sortiesAujourdhui: 0,
        moyenneHeures: 0,
        tauxPresence: 0,
        parCampagne: {}
      };
    }
  }
};

// Intercepteurs pour le logging des requêtes
const setupInterceptors = (client: any, clientName: string) => {
  client.interceptors.request.use(
    (config: any) => {
      console.log(`🔄 ${clientName} Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
      return config;
    },
    (error: any) => {
      console.error(`❌ ${clientName} Request Error:`, error);
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response: any) => {
      console.log(`✅ ${clientName} Response: ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    (error: any) => {
      console.error(`❌ ${clientName} Response Error:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        timeout: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'OTHER'
      });
      return Promise.reject(error);
    }
  );
};

// Configurer les intercepteurs pour tous les clients
setupInterceptors(apiClient, 'API');
setupInterceptors(longTimeoutClient, 'LONG_TIMEOUT_API');
setupInterceptors(fastTimeoutClient, 'FAST_API');

export default apiClient;