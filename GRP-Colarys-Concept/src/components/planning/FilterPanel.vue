<template>
  <div class="card">
    <div class="card-header custom-header">
      <h5><i class="bi bi-funnel"></i> Filtres Avancés</h5>
    </div>
    <div class="card-body">
      <!-- Recherche par nom -->
      <div class="mb-3">
        <label class="form-label">🔍 Recherche par nom</label>
        <input
          type="text"
          class="form-control search-input"
          :value="internalSearchQuery"
          @input="updateSearchQuery(($event.target as HTMLInputElement).value)"
          placeholder="Nom de l'agent..."
        >
      </div>

      <!-- Filtre par type de service -->
      <div class="mb-3">
        <label class="form-label">📊 Type de service</label>
        <select
          class="form-select filter-select"
          :value="internalSelectedFilter"
          @change="updateSelectedFilter(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Tous les services</option>
          <option value="MAT5">MAT5</option>
          <option value="MAT8">MAT8</option>
          <option value="MAT9">MAT9</option>
          <option value="JOUR">JOUR</option>
          <option value="NUIT">NUIT</option>
          <option value="OFF">OFF</option>
          <option value="CONGE">CONGÉ</option>
          <option value="FORMATION">FORMATION</option>
          <option value="-">Absent (-)</option>
        </select>
      </div>

      <!-- Filtre par année -->
      <div class="mb-3">
        <label class="form-label">📅 Année</label>
        <select
          class="form-select filter-select"
          :value="internalSelectedYear"
          @change="updateSelectedYear(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Toutes les années</option>
          <option v-for="year in availableYears || []" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <!-- Filtre par mois -->
      <div class="mb-3">
        <label class="form-label">📆 Mois</label>
        <select
          class="form-select filter-select"
          :value="internalSelectedMonth"
          @change="updateSelectedMonth(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Tous les mois</option>
          <option v-for="month in availableMonths || []" :key="month" :value="month">
            {{ getMonthName(month) }}
          </option>
        </select>
      </div>

      <!-- Filtre par semaine -->
      <div class="mb-3">
        <label class="form-label">📋 Semaine</label>
        <select
          class="form-select filter-select"
          :value="internalSelectedWeek"
          @change="updateSelectedWeek(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Toutes les semaines</option>
          <option v-for="week in availableWeeks || []" :key="week" :value="week">
            {{ week }}
          </option>
        </select>
      </div>

      <!-- Conteneur pour les boutons alignés -->
      <div class="buttons-container">
        <button class="btn btn-primary me-2 flex-grow-1 primary-btn" @click="applyFilters">
          <i class="bi bi-funnel"></i> Appliquer les filtres
        </button>
        <button class="btn btn-outline-secondary flex-grow-1 secondary-btn" @click="resetFilters">
          <i class="bi bi-arrow-counterclockwise"></i> Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UnifiedPlanningFilters } from '@/types/Planning';

const props = defineProps<{
  searchQuery?: string;
  selectedFilter?: string;
  selectedYear?: string;
  selectedMonth?: string;
  selectedWeek?: string;
  availableYears?: string[];
  availableMonths?: string[];
  availableWeeks?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:selectedFilter', value: string): void;
  (e: 'update:selectedYear', value: string): void;
  (e: 'update:selectedMonth', value: string): void;
  (e: 'update:selectedWeek', value: string): void;
  (e: 'filter', filters: UnifiedPlanningFilters): void;
  (e: 'reset'): void;
}>();

const internalSearchQuery = ref(props.searchQuery || '');
const internalSelectedFilter = ref(props.selectedFilter || 'all');
const internalSelectedYear = ref(props.selectedYear || 'all');
const internalSelectedMonth = ref(props.selectedMonth || 'all');
const internalSelectedWeek = ref(props.selectedWeek || 'all');

watch(
  () => props.availableWeeks,
  (newWeeks, oldWeeks) => {
    if (newWeeks && newWeeks.length > 0) {
      if (
        internalSelectedWeek.value === 'all' ||
        (oldWeeks && newWeeks.length > oldWeeks.length)
      ) {
        const newValue = newWeeks[0];
        internalSelectedWeek.value = newValue;
        emit('update:selectedWeek', newValue);
      }
    }
  },
  { immediate: true, deep: true }
);

const updateSearchQuery = (value: string) => {
  internalSearchQuery.value = value;
  emit('update:searchQuery', value);
};

const updateSelectedFilter = (value: string) => {
  internalSelectedFilter.value = value;
  emit('update:selectedFilter', value);
};

const updateSelectedYear = (value: string) => {
  internalSelectedYear.value = value;
  emit('update:selectedYear', value);
};

const updateSelectedMonth = (value: string) => {
  internalSelectedMonth.value = value;
  emit('update:selectedMonth', value);
};

const updateSelectedWeek = (value: string) => {
  internalSelectedWeek.value = value;
  emit('update:selectedWeek', value);
};

const applyFilters = () => {
  emit('filter', {
    searchQuery: internalSearchQuery.value,
    selectedFilter: internalSelectedFilter.value,
    selectedYear: internalSelectedYear.value,
    selectedMonth: internalSelectedMonth.value,
    selectedWeek: internalSelectedWeek.value,
  });
};

const resetFilters = () => {
  internalSearchQuery.value = '';
  internalSelectedFilter.value = 'all';
  internalSelectedYear.value = 'all';
  internalSelectedMonth.value = 'all';
  internalSelectedWeek.value = 'all';

  emit('update:searchQuery', '');
  emit('update:selectedFilter', 'all');
  emit('update:selectedYear', 'all');
  emit('update:selectedMonth', 'all');
  emit('update:selectedWeek', 'all');
  emit('reset');
};

const getMonthName = (monthNumber: string): string => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthIndex = parseInt(monthNumber) - 1;
  return months[monthIndex] || monthNumber;
};
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.card-body{
   background: rgba(255, 255, 255, 0.1);
}

.custom-header {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  border: none;
  border-radius: 8px 8px 0 0;
}

.form-label {
  font-weight: 500;
  color: #f0f0f5;
}

/* CORRECTION : Style des champs de saisie et sélecteurs */
.search-input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ced4da;
  border-radius: 8px;
  color: #333333;
  padding: 8px 12px;
}

.search-input:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  background: rgba(255, 255, 255, 0.95);
}

.search-input::placeholder {
  color: #6c757d;
}

.filter-select {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ced4da;
  border-radius: 8px;
  color: #333333;
  padding: 8px 12px;
}

.filter-select:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  background: rgba(255, 255, 255, 0.95);
}

/* Style pour les options du select */
.filter-select option {
  background: white;
  color: #333333;
  padding: 8px;
}

.filter-select option:hover {
  background: #f8f9fa;
}

/* Conteneur pour les boutons alignés */
.buttons-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 1rem;
}

/* Style pour le bouton Appliquer */
.primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: transparent;
  color: white;
  order: 1;
  border-radius: 25px;
  font-weight: 600;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-2px);
}

/* Style pour le bouton Réinitialiser */
.secondary-btn {
  color: white;
  background: #95a5a6;
  border-color: transparent;
  order: 2;
  border-radius: 25px;
  font-weight: 600;
}

.secondary-btn:hover {
  background: #7b8a8b;
  border-color: transparent;
  color: white;
  transform: translateY(-2px);
}

/* Assure que les boutons prennent la même largeur */
.flex-grow-1 {
  flex-grow: 1;
}
</style>


