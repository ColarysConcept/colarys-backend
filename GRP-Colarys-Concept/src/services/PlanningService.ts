import axios from 'axios';
import { UnifiedPlanningFilters, Planning, PlanningStats, UploadResponse } from '@/types/Planning';

// ✅ URL BACKEND PERMANENTE
const API_BASE_URL = 'https://colarys-bakend.vercel.app/api';

export const SHIFT_HOURS_MAP: { [key: string]: number } = {
  'MAT5': 8,
  'MAT8': 8,
  'MAT9': 8,
  'JOUR': 8,
  'NUIT': 8,
  'OFF': 0,
  'CONGE': 0,
  'CONGÉ': 0,
  'FORMATION': 0,
  '-': 0,
};

export class PlanningService {
  private static baseUrl: string = `${API_BASE_URL}/api/plannings`;

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
      if (completeFilters.selectedFilter) query.append('selectedFilter', completeFilters.selectedFilter);
      if (completeFilters.selectedYear) query.append('selectedYear', completeFilters.selectedYear);
      if (completeFilters.selectedMonth) query.append('selectedMonth', completeFilters.selectedMonth);
      if (completeFilters.selectedWeek) query.append('selectedWeek', completeFilters.selectedWeek);

      console.log('Envoi requête getPlannings avec params:', query.toString());

      const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      return responseData.map((agent: any) => ({
        ...agent,
        days: agent.days || [],
      }));
    } catch (error: any) {
      console.error('Erreur getPlannings:', error);
      throw new Error(error.message || 'Erreur lors de la récupération des plannings');
    }
  }

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
      if (completeFilters.selectedFilter) query.append('selectedFilter', completeFilters.selectedFilter);
      if (completeFilters.selectedYear) query.append('selectedYear', completeFilters.selectedYear);
      if (completeFilters.selectedMonth) query.append('selectedMonth', completeFilters.selectedMonth);
      if (completeFilters.selectedWeek) query.append('selectedWeek', completeFilters.selectedWeek);

      const response = await fetch(`${this.baseUrl}/stats?${query.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
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

  static async searchWeeks(criteria: { year?: string; month?: string; partialWeek?: string } = {}): Promise<string[]> {
    try {
      console.log('searchWeeks criteria:', criteria);
      const response = await axios.get(`${this.baseUrl}/weeks`, { params: criteria });
      console.log('searchWeeks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur searchWeeks:', error);
      return [];
    }
  }

  static async getAvailableYears(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/years`);
      console.log('getAvailableYears response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getAvailableYears:', error);
      return [new Date().getFullYear().toString()];
    }
  }

  static async getAvailableMonths(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/months`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Erreur getAvailableMonths:', error);
      return [];
    }
  }

  static async getAvailableWeeks(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/weeks`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Erreur getAvailableWeeks:', error);
      return [];
    }
  }

  static async getAvailableAgents(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Erreur getAvailableAgents:', error);
      return [];
    }
  }

  static async getMonthsByYear(year: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/months-by-year`, {
        params: { year }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur getMonthsByYear:', error);
      return [];
    }
  }

  static async getWeeksByYear(year: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/weeks-by-year`, {
        params: { year }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur getWeeksByYear:', error);
      return [];
    }
  }

  static async getWeeksByMonthAndYear(month: string, year: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/weeks-by-month-year`, {
        params: { month, year }
      });
      console.log('getWeeksByMonthAndYear response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getWeeksByMonthAndYear:', error);
      return [];
    }
  }

  static async getPlanningsByMonth(month: string, year: string): Promise<Planning[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/by-month`, {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur getPlanningsByMonth:', error);
      throw new Error('Erreur lors de la récupération des plannings par mois');
    }
  }

  static async uploadPlanning(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Uploading to:', `${this.baseUrl}/upload`);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return {
        file,
        count: result.count,
        weeks: result.weeks,
        message: result.message,
        data: result.data,
      };
    } catch (error: any) {
      console.error('Erreur uploadPlanning:', error);
      throw new Error(error.message || 'Erreur lors de l\'upload du planning');
    }
  }

  static getShiftHours(shift: string): number {
    const normalized = shift.toUpperCase().replace(/\s+/g, '');  // e.g., "MAT 8" -> "MAT8"
    return SHIFT_HOURS_MAP[normalized] || 0;
  }

  static async deleteAllPlannings(): Promise<{ message: string; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete-all`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erreur deleteAllPlannings:', error);
      throw new Error(error.message || 'Erreur lors de la suppression des plannings');
    }
  }
}