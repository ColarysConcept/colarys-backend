// src/types/planning.ts
export interface AgentResponse {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  role: string;
  email?: string;
  contact?: string;
  entreprise?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlanningStats {
  count: number;
  weeks: any[];
  message: string;
  data: any[];
}

export interface UploadResponse {
  message: string;
  filename?: string;
  url?: string;
  success: boolean;
}

export interface DeleteResponse {
  message: string;
  count: number;
  success: boolean;
}