// src/types/AgentColarys.ts
export interface AgentColarys {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  role: string;
  image?: string;
  contact?: string;
  mail: string;
  entreprise: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentColarysRequest {
  matricule: string;
  nom: string;
  prenom: string;
  role: string;
  image?: string;
  contact?: string;
  mail: string;
  entreprise?: string;
}

export interface UpdateAgentColarysRequest {
  matricule?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  image?: string;
  contact?: string;
  mail?: string;
  entreprise?: string;
}

export type AgentFormData = CreateAgentColarysRequest | UpdateAgentColarysRequest;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// Types pour les statistiques
export interface AgentsStats {
  totalAgents: number;
  nouveauxAgents: number;
  rolesActifs: number;
  tauxCompletion: number;
}

export interface PresenceStats {
  presentsAujourdhui: number;
  enAttenteSortie: number;
  heuresTravaillees: number;
  tauxPresence: number;
  parRole: { [role: string]: number };
}

export interface PlanningStats {
  agentsProgrammes: number;
  congesSemaine: number;
  heuresMoyennes: number;
  couvertures: number;
}