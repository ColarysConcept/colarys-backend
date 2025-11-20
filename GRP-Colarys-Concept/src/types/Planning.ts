export interface Planning {
  id?: string;
  agent_name: string;
  semaine: string;
  year: string;
  month: string[];
  days: DaySchedule[];
  total_heures: number;
  remarques?: string;
  lundi?: string;
  mardi?: string;
  mercredi?: string;
  jeudi?: string;
  vendredi?: string;
  samedi?: string;
  dimanche?: string;
  agent_order?: number;  
}

export interface DaySchedule {
  fullDate: string;
  name: string;
  date: string;
  shift: string;
  hours: number;
  day: string;
  remarques?: string; 
}

// Le reste inchangé, mais unifiez PlanningStatsType en PlanningStats si besoin
export type PlanningStats = PlanningStatsType;  // Alias pour simplicité

export interface PlanningStatsType {
  totalAgents: number;
  totalHours: number;
  avgHours: number;
  present: number;
  absent: number;
  dayShift: number;
  nightShift: number;
  shiftCounts: { [key: string]: number };
}

export interface UnifiedPlanningFilters {
  search?: string;
  searchQuery: string;
  shiftType?: string;
  selectedFilter: string;
  year?: string;
  month?: string;
  selectedYear: string;
  selectedMonth: string;
  selectedWeek: string;
  agentName?: string;
  team?: string;
  status?: string;
  department?: string;
  location?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  partialWeek?: string;
  semaine?: string;
}

// Planning.ts
export interface UploadResponse {
  message?: string;
  count: number;
  file: File;  
  weeks: string[];
  data?: any;
}