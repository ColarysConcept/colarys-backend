// PlanningService.ts - Interface améliorée
interface Planning {
  id: number;
  agent_name: string;
  semaine: string;
  year: string;
  month: string[];
  days: DaySchedule[];
  total_heures: number;
  remarques: string | null;
  lundi: string;
  mardi: string;
  mercredi: string;
  jeudi: string;
  vendredi: string;
  samedi: string;
  dimanche: string;
  [key: string]: any;
}

interface DaySchedule {
  day: string;
  name: string;
  date: string;
  fullDate: string;
  shift: string;
  hours: number;
  remarques?: string;
}

interface UnifiedPlanningFilters {
  searchQuery: string;
  selectedFilter: string;
  selectedYear: string;
  selectedMonth: string;
  selectedWeek: string;
}

interface PlanningStats {
  totalAgents: number;
  totalHours: number;
  avgHours: number;
  present: number;
  absent: number;
  dayShift: number;
  nightShift: number;
  shiftCounts: Record<string, number>;
  count?: number;
  weeks?: any[];
  message?: string;
  data?: any[];
}

interface UploadResponse {
  file?: File;
  count: number;
  weeks: any[];
  message: string;
  data: any[];
}

interface DeleteResponse {
  message: string;
  count: number;
}

export class PlanningService {
  private static baseUrl: string = 'http://localhost:3000/api/plannings';
// PlanningService.ts - Méthode getPlannings mise à jour avec typage
// PlanningService.ts - Méthode getPlannings robuste
static async getPlannings(filters: Partial<UnifiedPlanningFilters> = {}): Promise<Planning[]> {
  try {
    const completeFilters: UnifiedPlanningFilters = {
      searchQuery: '',
      selectedFilter: 'all',
      selectedYear: 'all',
      selectedMonth: 'all',
      selectedWeek: 'all',
      ...filters,
    };

    const query = new URLSearchParams();
    if (completeFilters.searchQuery) query.append('searchQuery', completeFilters.searchQuery);
    if (completeFilters.selectedFilter && completeFilters.selectedFilter !== 'all') 
      query.append('selectedFilter', completeFilters.selectedFilter);
    if (completeFilters.selectedYear && completeFilters.selectedYear !== 'all') 
      query.append('selectedYear', completeFilters.selectedYear);
    if (completeFilters.selectedMonth && completeFilters.selectedMonth !== 'all') 
      query.append('selectedMonth', completeFilters.selectedMonth);
    if (completeFilters.selectedWeek && completeFilters.selectedWeek !== 'all') 
      query.append('selectedWeek', completeFilters.selectedWeek);

    console.log('Envoi requête getPlannings avec params:', query.toString());

    const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Gérer les deux formats de réponse
    let dataArray = [];
    
    if (Array.isArray(responseData)) {
      dataArray = responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      dataArray = responseData.data;
    }
    
    // Convertir le format simple au format attendu
    return dataArray.map((item: any) => {
      // Si c'est déjà au bon format, retourner tel quel
      if (item.semaine && item.agent_name) {
        return {
          ...item,
          days: item.days || [],
        };
      }
      
      // Sinon, convertir du format simple au format planning
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const weekNumber = Math.ceil(
        (currentDate.getDate() + 
         new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7
      );
      
      return {
        id: item.id || 0,
        agent_name: item.agent?.nom && item.agent?.prenom 
          ? `${item.agent.nom} ${item.agent.prenom}`
          : `Agent ${item.agent_id}`,
        semaine: `${year}-W${weekNumber.toString().padStart(2, '0')}`,
        year: year,
        month: [month],
        days: [
          { day: "LUNDI", name: "LUN", date: "09/12", fullDate: "2025-12-09", shift: item.shift || "JOUR", hours: 8 },
          { day: "MARDI", name: "MAR", date: "10/12", fullDate: "2025-12-10", shift: item.shift || "JOUR", hours: 8 },
          { day: "MERCREDI", name: "MER", date: "11/12", fullDate: "2025-12-11", shift: "OFF", hours: 0 },
          { day: "JEUDI", name: "JEU", date: "12/12", fullDate: "2025-12-12", shift: "OFF", hours: 0 },
          { day: "VENDREDI", name: "VEN", date: "13/12", fullDate: "2025-12-13", shift: "OFF", hours: 0 },
          { day: "SAMEDI", name: "SAM", date: "14/12", fullDate: "2025-12-14", shift: "OFF", hours: 0 },
          { day: "DIMANCHE", name: "DIM", date: "15/12", fullDate: "2025-12-15", shift: "OFF", hours: 0 }
        ],
        total_heures: 16,
        remarques: null,
        lundi: item.shift || "JOUR",
        mardi: item.shift || "JOUR",
        mercredi: "OFF",
        jeudi: "OFF",
        vendredi: "OFF",
        samedi: "OFF",
        dimanche: "OFF",
        originalData: item // Garder les données originales
      };
    });
  } catch (error: any) {
    console.error('Erreur getPlannings:', error);
    throw new Error(error.message || 'Erreur lors de la récupération des plannings');
  }
}

  static async uploadPlanning(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Uploading to: /api/plannings/upload');
      
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as UploadResponse;
      
      return {
        file,
        count: result.count,
        weeks: result.weeks,
        message: result.message,
        data: result.data
      };
    } catch (error: any) {
      console.error('Erreur uploadPlanning:', error);
      throw new Error(error.message || 'Erreur lors de l\'upload du planning');
    }
  }

  static async uploadSheetPlanning(file: File, semaine?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (semaine) formData.append('semaine', semaine);

      const response = await fetch(`${this.baseUrl}/upload-sheet`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as UploadResponse;
    } catch (error: unknown) {
      console.error('Erreur uploadSheetPlanning:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  static async uploadPlanningWithSpecificFormat(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/upload-specific-format`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as UploadResponse;
    } catch (error: unknown) {
      console.error('Erreur uploadPlanningWithSpecificFormat:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  static async uploadMultiWeekPlanning(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/upload-multi-week`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as UploadResponse;
    } catch (error: unknown) {
      console.error('Erreur uploadMultiWeekPlanning:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  static async deletePlanning(semaine?: string): Promise<DeleteResponse> {
    try {
      const params = new URLSearchParams();
      if (semaine && semaine !== 'all') {
        params.append('semaine', semaine);
      }

      const url = `${this.baseUrl}?${params.toString()}`;
      console.log('Requête DELETE:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as DeleteResponse;
    } catch (error: unknown) {
      console.error('Erreur deletePlanning:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  static async getAvailableYears(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/years`);
      
      if (!response.ok) {
        console.warn('Endpoint /years non disponible, retour données par défaut');
        return [new Date().getFullYear().toString()];
      }
      
      return await response.json() as string[];
    } catch (error: any) {
      console.warn('Erreur getAvailableYears, données par défaut:', error);
      return [new Date().getFullYear().toString()];
    }
  }

  static async getAvailableMonths(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/months`);
      if (!response.ok) {
        console.warn('Endpoint /months non disponible, retour données par défaut');
        return Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
      }
      return await response.json() as string[];
    } catch (error: unknown) {
      console.warn('Erreur getAvailableMonths, données par défaut:', error);
      return Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    }
  }

  static async getAvailableWeeks(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/weeks`);
      if (!response.ok) {
        console.warn('Endpoint /weeks non disponible, tentative de récupération via une autre méthode');
        
        // Fallback: récupérer les semaines à partir des plannings
        const plannings = await this.getPlannings({
          searchQuery: '',
          selectedFilter: 'all',
          selectedYear: 'all',
          selectedMonth: 'all',
          selectedWeek: 'all',
        });
        const weeks = [...new Set(plannings.map(p => p.semaine))].sort();
        return weeks;
      }
      return await response.json() as string[];
    } catch (error: unknown) {
      console.warn('Erreur getAvailableWeeks, tentative de fallback:', error);
      
      // Fallback: récupérer les semaines à partir des plannings
      try {
        const plannings = await this.getPlannings({
          searchQuery: '',
          selectedFilter: 'all',
          selectedYear: 'all',
          selectedMonth: 'all',
          selectedWeek: 'all',
        });
        const weeks = [...new Set(plannings.map(p => p.semaine))].sort();
        return weeks;
      } catch (fallbackError) {
        console.error('Fallback également en erreur:', fallbackError);
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 52 }, (_, i) =>
          `${currentYear}-W${(i + 1).toString().padStart(2, '0')}`
        );
      }
    }
  }

  static async getAvailableAgents(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`);
      if (!response.ok) {
        console.warn('Endpoint /agents non disponible, retour liste vide');
        return [];
      }
      return await response.json() as string[];
    } catch (error: unknown) {
      console.warn('Erreur getAvailableAgents, liste vide:', error);
      return [];
    }
  }

// PlanningService.ts - Méthode getStats mise à jour
// PlanningService.ts - Méthode getStats mise à jour avec typage
static async getStats(filters: Partial<UnifiedPlanningFilters> = {}): Promise<PlanningStats> {
  try {
    const completeFilters: UnifiedPlanningFilters = {
      searchQuery: '',
      selectedFilter: 'all',
      selectedYear: 'all',
      selectedMonth: 'all',
      selectedWeek: 'all',
      ...filters,
    };

    const query = new URLSearchParams();
    if (completeFilters.searchQuery) query.append('searchQuery', completeFilters.searchQuery);
    if (completeFilters.selectedFilter && completeFilters.selectedFilter !== 'all') 
      query.append('selectedFilter', completeFilters.selectedFilter);
    if (completeFilters.selectedYear && completeFilters.selectedYear !== 'all') 
      query.append('selectedYear', completeFilters.selectedYear);
    if (completeFilters.selectedMonth && completeFilters.selectedMonth !== 'all') 
      query.append('selectedMonth', completeFilters.selectedMonth);
    if (completeFilters.selectedWeek && completeFilters.selectedWeek !== 'all') 
      query.append('selectedWeek', completeFilters.selectedWeek);

    const response = await fetch(`${this.baseUrl}/stats?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Définir un type pour la réponse des stats
    interface StatsApiResponse {
      success?: boolean;
      data?: PlanningStats;
      [key: string]: any;
    }

    const responseData = await response.json() as StatsApiResponse;
    const stats = responseData.data || responseData;
    
    return stats as PlanningStats;
  } catch (error: any) {
    console.error('Erreur getStats:', error);
    return {
      totalAgents: 0,
      totalHours: 0,
      avgHours: 0,
      present: 0,
      absent: 0,
      dayShift: 0,
      nightShift: 0,
      shiftCounts: {},
    };
  }
}

  static async searchWeeks(criteria: { year?: string; month?: string; partialWeek?: string }): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      if (criteria.year) params.append('selectedYear', criteria.year);
      if (criteria.month) params.append('selectedMonth', criteria.month);
      if (criteria.partialWeek) params.append('partialWeek', criteria.partialWeek);

      const response = await fetch(`${this.baseUrl}/search-weeks?${params.toString()}`);
      if (!response.ok) {
        console.warn('Endpoint /search-weeks non disponible');
        return [];
      }
      return await response.json() as string[];
    } catch (error: unknown) {
      console.warn('Erreur searchWeeks:', error);
      return [];
    }
  }

  static async getWeeksByMonthAndYear(month: string, year: string): Promise<string[]> {
    try {
      const params = new URLSearchParams({ month, year });
      const response = await fetch(`${this.baseUrl}/weeks-by-month-year?${params.toString()}`);
      if (!response.ok) {
        console.warn('Endpoint /weeks-by-month-year non disponible');
        return [];
      }
      return await response.json() as string[];
    } catch (error: unknown) {
      console.warn('Erreur getWeeksByMonthAndYear:', error);
      return [];
    }
  }
}