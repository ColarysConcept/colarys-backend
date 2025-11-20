export interface Agent {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  campagne: string;
  signature?: string;
  dateCreation: string;
}

export interface Presence {
  id: number;
  date: string;
  heureEntree: string;
  heureSortie?: string;
  shift: string;
  heuresTravaillees?: number;
  createdAt: string;
  agent: Agent;
  details?: DetailPresence;
}

export interface DetailPresence {
  id: number;
  signatureEntree: string;
  signatureSortie?: string;
  observations?: string;
}

export interface PointageData {
  matricule: string;
  nom: string;
  prenom: string;
  campagne: string;
  shift: string;
  signatureEntree: string;
  heureEntreeManuelle?: string;
}

export interface AgentMinimal {
  matricule: string;
  nom: string;
  prenom: string;
  campagne: string;
  signature?: string;
}

// frontend/src/types/index.ts
export interface HistoriqueResponse {
  success: boolean;
  data: Presence[];
  totalHeures?: number; 
  totalPresences?: number;
}


export interface HistoriqueFilters {
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

export interface PointageSortieData {
  matricule: string;
  signatureSortie: string;
  heureSortieManuelle?: string; 
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  filters: HistoriqueFilters;
}


// Ajoutez cette interface dans vos types
export interface PresenceData {
  id: number;
  date: string;
  heureEntree: string;
  heureSortie?: string;
  shift: string;
  heuresTravaillees?: number;
  createdAt: string;
  agent: Agent;
  details?: DetailPresence;
}