// PlanningService.ts - Version corrigée avec typage

// Définir les interfaces
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

// Interface pour la réponse API
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: any;
}

export class PlanningService {
  private static baseUrl: string = 'https://theme-gestion-des-resources-et-prod.vercel.app/api/plannings';

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

      // Typer la réponse avec notre interface ApiResponse
      const responseData = await response.json() as ApiResponse<Planning[]> | Planning[];
      
      // Extraire le tableau de données
      let dataArray: Planning[] = [];
      
      if (Array.isArray(responseData)) {
        // Si la réponse est directement un tableau
        dataArray = responseData;
      } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        // Si la réponse a une propriété 'data' qui est un tableau
        dataArray = responseData.data;
      } else if (responseData && Array.isArray((responseData as any).data)) {
        // Fallback pour TypeScript strict
        dataArray = (responseData as any).data;
      }
      
      // S'assurer que nous travaillons avec un tableau
      if (!Array.isArray(dataArray)) {
        console.warn('Les données de réponse ne sont pas un tableau:', dataArray);
        return [];
      }
      
      // Transformer les données si nécessaire
      return dataArray.map((item: any) => {
        // Si l'élément a déjà le bon format Planning
        if (item.semaine && item.agent_name) {
          return {
            ...item,
            days: Array.isArray(item.days) ? item.days : [],
          } as Planning;
        }
        
        // Sinon, créer un planning par défaut
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
            : item.agent_name || `Agent ${item.agent_id || item.id}`,
          semaine: `${year}-W${weekNumber.toString().padStart(2, '0')}`,
          year: year,
          month: [month],
          days: [
            { day: "LUNDI", name: "LUN", date: "09/12", fullDate: "2025-12-09", shift: "JOUR", hours: 8 },
            { day: "MARDI", name: "MAR", date: "10/12", fullDate: "2025-12-10", shift: "JOUR", hours: 8 },
            { day: "MERCREDI", name: "MER", date: "11/12", fullDate: "2025-12-11", shift: "OFF", hours: 0 },
            { day: "JEUDI", name: "JEU", date: "12/12", fullDate: "2025-12-12", shift: "OFF", hours: 0 },
            { day: "VENDREDI", name: "VEN", date: "13/12", fullDate: "2025-12-13", shift: "OFF", hours: 0 },
            { day: "SAMEDI", name: "SAM", date: "14/12", fullDate: "2025-12-14", shift: "OFF", hours: 0 },
            { day: "DIMANCHE", name: "DIM", date: "15/12", fullDate: "2025-12-15", shift: "OFF", hours: 0 }
          ],
          total_heures: 16,
          remarques: null,
          lundi: "JOUR",
          mardi: "JOUR",
          mercredi: "OFF",
          jeudi: "OFF",
          vendredi: "OFF",
          samedi: "OFF",
          dimanche: "OFF",
        } as Planning;
      });
    } catch (error: any) {
      console.error('Erreur getPlannings:', error);
      throw new Error(error.message || 'Erreur lors de la récupération des plannings');
    }
  }

  // Méthode getStats corrigée
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

      // Typer la réponse
      const responseData = await response.json() as ApiResponse<PlanningStats> | PlanningStats;
      
      // Extraire les statistiques
      let stats: PlanningStats;
      
      if ('data' in responseData && responseData.data) {
        // Si la réponse a une propriété 'data'
        stats = responseData.data as PlanningStats;
      } else {
        // Sinon, utiliser directement la réponse
        stats = responseData as PlanningStats;
      }
      
      return stats;
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

  // Méthode uploadPlanning corrigée
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

      // Typer la réponse
      const result = await response.json() as ApiResponse<UploadResponse> | UploadResponse;
      
      // Extraire les données
      let uploadResult: UploadResponse;
      
      if ('data' in result && result.data) {
        // Si la réponse a une propriété 'data'
        uploadResult = result.data as UploadResponse;
      } else {
        // Sinon, utiliser directement la réponse
        uploadResult = result as UploadResponse;
      }
      
      return {
        file,
        count: uploadResult.count,
        weeks: uploadResult.weeks,
        message: uploadResult.message,
        data: uploadResult.data
      };
    } catch (error: any) {
      console.error('Erreur uploadPlanning:', error);
      throw new Error(error.message || 'Erreur lors de l\'upload du planning');
    }
  }

  // Méthodes auxiliaires avec typage
  static async getAvailableYears(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/years`);
      
      if (!response.ok) {
        console.warn('Endpoint /years non disponible, retour données par défaut');
        return [new Date().getFullYear().toString()];
      }
      
      // Typer la réponse
      const responseData = await response.json() as ApiResponse<string[]> | string[];
      
      let years: string[];
      
      if (Array.isArray(responseData)) {
        years = responseData;
      } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        years = responseData.data;
      } else {
        years = [new Date().getFullYear().toString()];
      }
      
      return years;
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
      
      // Typer la réponse
      const responseData = await response.json() as ApiResponse<string[]> | string[];
      
      let months: string[];
      
      if (Array.isArray(responseData)) {
        months = responseData;
      } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        months = responseData.data;
      } else {
        months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
      }
      
      return months;
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
      
      // Typer la réponse
      const responseData = await response.json() as ApiResponse<string[]> | string[];
      
      let weeks: string[];
      
      if (Array.isArray(responseData)) {
        weeks = responseData;
      } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        weeks = responseData.data;
      } else {
        // Fallback
        const plannings = await this.getPlannings({
          searchQuery: '',
          selectedFilter: 'all',
          selectedYear: 'all',
          selectedMonth: 'all',
          selectedWeek: 'all',
        });
        weeks = [...new Set(plannings.map(p => p.semaine))].sort();
      }
      
      return weeks;
    } catch (error: unknown) {
      console.warn('Erreur getAvailableWeeks, tentative de fallback:', error);
      
      // Fallback
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