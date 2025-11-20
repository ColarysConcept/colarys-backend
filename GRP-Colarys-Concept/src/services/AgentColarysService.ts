// src/services/AgentColarysService.ts
import { AgentColarys, CreateAgentColarysRequest, UpdateAgentColarysRequest } from '@/types/AgentColarys';

// ✅ URL BACKEND PERMANENTE
const API_BASE_URL = 'https://colarys-bakend.vercel.app/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    statusCode: number;
  };
}

export class AgentColarysService {
  private static readonly BASE_URL = API_BASE_URL;

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);

    if (!response.ok) {
      let errorMessage = 'Erreur inconnue';
      try {
        const errorData: ApiResponse<T> = await response.json();
        errorMessage = errorData.error?.message || errorData.message || `Erreur ${response.status}`;
      } catch {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Opération échouée');
    }
    
    return data.data as T;
  }

  async getAllAgents(): Promise<AgentColarys[]> {
    try {
      console.log(`🔄 Fetching agents from: ${API_BASE_URL}/api/agents-colarys`);
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Vérification que la réponse est un tableau
      if (!Array.isArray(data)) {
        console.warn('⚠️ API response is not an array:', data);
        return [];
      }
      
      const agents: AgentColarys[] = data;
      console.log(`✅ ${agents.length} agents loaded successfully`);
      return agents;
    } catch (error) {
      console.error('❌ Error fetching agents:', error);
      throw new Error('Impossible de charger la liste des agents');
    }
  }

  async getAgentById(id: number): Promise<AgentColarys> {
    console.log('🔄 Fetching agent:', `${API_BASE_URL}/api/agents-colarys/${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/${id}`);
      return await this.handleResponse<AgentColarys>(response);
    } catch (error) {
      console.error('❌ Error fetching agent:', error);
      throw new Error('Impossible de charger les détails de l\'agent');
    }
  }

  async createAgent(agentData: CreateAgentColarysRequest | FormData): Promise<AgentColarys> {
    const isFormData = agentData instanceof FormData;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys`, {
        method: 'POST',
        headers: isFormData ? {} : { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: isFormData ? agentData : JSON.stringify(agentData),
      });
      
      return await this.handleResponse<AgentColarys>(response);
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      throw new Error('Impossible de créer l\'agent');
    }
  }

  async updateAgent(id: number, agentData: UpdateAgentColarysRequest | FormData): Promise<AgentColarys> {
    const isFormData = agentData instanceof FormData;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/${id}`, {
        method: 'PUT',
        headers: isFormData ? {} : { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: isFormData ? agentData : JSON.stringify(agentData),
      });
      
      return await this.handleResponse<AgentColarys>(response);
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      throw new Error('Impossible de modifier l\'agent');
    }
  }

  async deleteAgent(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors de la suppression';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Ignorer si la réponse n'est pas du JSON
        }
        
        throw new Error(errorMessage);
      }
      
      // Vérifier si la réponse a du contenu avant de parser
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        await this.handleResponse<void>(response);
      }
    } catch (error) {
      console.error('❌ Error deleting agent:', error);
      throw new Error('Impossible de supprimer l\'agent');
    }
  }

  async uploadImage(imageFile: File): Promise<{ imageUrl: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      return await this.handleResponse<{ imageUrl: string; filename: string }>(response);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw new Error('Impossible d\'uploader l\'image');
    }
  }

  async getAgentsStats(): Promise<{
    totalAgents: number;
    nouveauxAgents: number;
    rolesActifs: number;
    tauxCompletion: number;
  }> {
    try {
      const agents = await this.getAllAgents();
      
      // Agents créés ce mois-ci
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const nouveauxAgents = agents.filter(agent => {
        const agentDate = new Date(agent.created_at);
        return agentDate.getMonth() === currentMonth && agentDate.getFullYear() === currentYear;
      }).length;

      // Rôles actifs
      const rolesActifs = new Set(agents.map(agent => agent.role)).size;

      // Taux de completion
      const agentsComplets = agents.filter(agent => 
        agent.nom && agent.prenom && agent.matricule && agent.role && agent.mail
      ).length;
      const tauxCompletion = agents.length > 0 ? 
        Math.round((agentsComplets / agents.length) * 100) : 0;

      return {
        totalAgents: agents.length,
        nouveauxAgents,
        rolesActifs,
        tauxCompletion
      };
    } catch (error) {
      console.error('❌ Error getting agents stats:', error);
      throw new Error('Impossible de charger les statistiques des agents');
    }
  }

  async generatePdfReport(agents: AgentColarys[], options: any): Promise<Blob> {
    try {
      console.log('🔄 Génération du rapport PDF...');
      
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/reports/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents,
          options,
          title: 'Rapport des Agents - Colarys Concept',
          date: new Date().toLocaleDateString('fr-FR')
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Error generating PDF report:', error);
      throw new Error('Impossible de générer le rapport PDF');
    }
  }

  async generateExcelReport(agents: AgentColarys[], options: any): Promise<Blob> {
    try {
      console.log('🔄 Génération du rapport Excel...');
      
      const response = await fetch(`${API_BASE_URL}/api/agents-colarys/reports/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents,
          options,
          title: 'Rapport des Agents - Colarys Concept'
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du Excel');
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Error generating Excel report:', error);
      throw new Error('Impossible de générer le rapport Excel');
    }
  }

  async generateCsvReport(agents: AgentColarys[], options: any): Promise<Blob> {
    try {
      console.log('🔄 Génération du rapport CSV...');
      
      // Génération simple côté client pour CSV
      const headers = ['Matricule', 'Nom', 'Prénom', 'Rôle', 'Email', 'Contact', 'Entreprise', 'Date Création'];
      const csvData = agents.map(agent => [
        agent.matricule,
        agent.nom,
        agent.prenom,
        agent.role,
        agent.mail,
        agent.contact || '',
        agent.entreprise,
        new Date(agent.created_at).toLocaleDateString('fr-FR')
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('❌ Error generating CSV report:', error);
      throw new Error('Impossible de générer le rapport CSV');
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      console.log('🔄 Health check vers:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Health check réussi:', data);
      return data;
    } catch (error) {
      console.error('❌ Health check échoué:', error);
      throw new Error('Impossible de se connecter au serveur');
    }
  }

  async getAgentsDashboardStats(): Promise<{
    totalAgents: number;
    nouveauxAgents: number;
    rolesActifs: number;
    tauxCompletion: number;
    parRole: { [role: string]: number };
  }> {
    try {
      const agents = await this.getAllAgents();
      
      // Agents créés ce mois-ci
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const nouveauxAgents = agents.filter(agent => {
        const agentDate = new Date(agent.created_at);
        return agentDate.getMonth() === currentMonth && agentDate.getFullYear() === currentYear;
      }).length;

      // Répartition par rôle
      const parRole: { [role: string]: number } = {};
      agents.forEach(agent => {
        const role = agent.role || 'Non spécifié';
        parRole[role] = (parRole[role] || 0) + 1;
      });

      // Rôles actifs
      const rolesActifs = Object.keys(parRole).length;

      // Taux de completion
      const agentsComplets = agents.filter(agent => 
        agent.nom && agent.prenom && agent.matricule && agent.role && agent.mail
      ).length;
      const tauxCompletion = agents.length > 0 ? 
        Math.round((agentsComplets / agents.length) * 100) : 0;

      return {
        totalAgents: agents.length,
        nouveauxAgents,
        rolesActifs,
        tauxCompletion,
        parRole
      };
    } catch (error) {
      console.error('❌ Error getting agents dashboard stats:', error);
      throw new Error('Impossible de charger les statistiques du dashboard');
    }
  }
}