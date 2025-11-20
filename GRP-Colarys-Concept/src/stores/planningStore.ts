import { defineStore } from 'pinia';
import { PlanningService } from '@/services/PlanningService';
import type { Planning, UnifiedPlanningFilters, PlanningStats } from '@/types/Planning';

interface PlanningState {
  plannings: Planning[];
  stats: PlanningStats;
  currentFilters: UnifiedPlanningFilters;
  availableYears: string[];
  availableMonths: string[];
  availableWeeks: string[];
  availableAgents: string[];
}

export const usePlanningStore = defineStore('planning', {
  state: () => ({
    plannings: [] as Planning[],
    stats: {
      totalAgents: 0,
      totalHours: 0,
      avgHours: 0,
      present: 0,
      absent: 0,
      dayShift: 0,
      nightShift: 0,
      shiftCounts: {}
    } as PlanningStats,
    currentFilters: {
      searchQuery: '',
      selectedFilter: 'all',
      selectedYear: 'all',
      selectedMonth: 'all',
      selectedWeek: 'all',
    } as UnifiedPlanningFilters,
    availableYears: [] as string[],
    availableMonths: [] as string[],
    availableWeeks: [] as string[],
    availableAgents: [] as string[],
  }),
actions: {
    async loadAvailableData() {
      try {
        const [years, months, weeks, agents] = await Promise.all([
          PlanningService.getAvailableYears(),
          PlanningService.getAvailableMonths(),
          PlanningService.getAvailableWeeks(),
          PlanningService.getAvailableAgents(),
        ]);
        
        this.availableYears = years;
        this.availableMonths = months;
        this.availableWeeks = weeks;
        this.availableAgents = agents;
      } catch (error) {
        console.error('Erreur loadAvailableData:', error);
        
        // Valeurs par défaut en cas d'erreur
        this.availableYears = [new Date().getFullYear().toString()];
        this.availableMonths = Array.from({ length: 12 }, (_, i) => 
          (i + 1).toString().padStart(2, '0')
        );
        this.availableWeeks = [];
        this.availableAgents = [];
      }
    },

    async loadStats(filters?: UnifiedPlanningFilters) {
      try {
        const effectiveFilters = filters ?? this.currentFilters;
        this.stats = await PlanningService.getStats(effectiveFilters);
      } catch (error) {
        console.error('Erreur loadStats:', error);
        this.stats = {
          totalAgents: 0,
          totalHours: 0,
          avgHours: 0,
          present: 0,
          absent: 0,
          dayShift: 0,
          nightShift: 0,
          shiftCounts: {}
        };
      }
    },

    async loadPlannings(filters?: UnifiedPlanningFilters) {
      try {
        const effectiveFilters = filters ?? this.currentFilters;
        console.log('loadPlannings filters:', effectiveFilters);
        
        const plannings = await PlanningService.getPlannings(effectiveFilters);
        
        // Pas besoin de tri ici, backend gère par semaine et agent_order
        this.plannings = plannings;
      } catch (error) {
        console.error('Erreur loadPlannings:', error);
        this.plannings = [];
      }
    },


    async loadPlanningsByMonth(month: string, year: string) {
      try {
        this.plannings = await PlanningService.getPlanningsByMonth(month, year);
      } catch (error) {
        console.error('Erreur loadPlanningsByMonth:', error);
        this.plannings = [];
      }
    },

    async updateAvailableWeeks() {
      try {
        this.availableWeeks = await PlanningService.getAvailableWeeks();
      } catch (error) {
        console.error('Erreur updateAvailableWeeks:', error);
      }
    },

    async searchWeeksForMonth(year: string, month: string) {
      try {
        const result = await PlanningService.getWeeksByMonthAndYear(month, year);
        console.log('searchWeeksForMonth:', { year, month, result });
        return result;
      } catch (error) {
        console.error('Erreur searchWeeksForMonth:', error);
        return [];
      }
    },

    async applyFilters(filters: UnifiedPlanningFilters) {
      this.currentFilters = { ...this.currentFilters, ...filters };
      await this.loadPlannings(this.currentFilters);
      await this.loadStats(this.currentFilters);
    },
    async refreshData() {
      console.log('refreshData called');
      await this.loadAvailableData();
      await this.updateAvailableWeeks();
      await this.applyFilters(this.currentFilters);
    },

   // Dans planningStore.ts
async refreshAfterUpload() {
  console.log('Refreshing after upload...');
  // Réinitialiser les filtres pour voir toutes les données
  this.currentFilters = {
    searchQuery: '',
    selectedFilter: 'all',
    selectedYear: 'all',
    selectedMonth: 'all',
    selectedWeek: 'all',
  };
  
  // Recharger toutes les données disponibles
  await this.loadAvailableData();
  await this.loadPlannings(this.currentFilters);
  await this.loadStats(this.currentFilters);
},

    resetFilters() {
      this.currentFilters = {
        search: '',
        searchQuery: '',
        shiftType: '',
        selectedFilter: 'all',
        selectedYear: 'all',
        selectedMonth: 'all',
        selectedWeek: 'all',
        agentName: '',
        team: '',
        status: '',
        department: '',
        location: '',
        dateRange: '',
        sortBy: '',
        sortOrder: 'asc'
      };
    },
  },

getters: {
    filteredPlannings: (state): Planning[] => {
      // Pas de tri supplémentaire, ordre backend préservé
      return state.plannings;
    },
  },
  
});

