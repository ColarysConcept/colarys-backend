<template>
  <PageModel>
    <div class="container my-4">
      <div class="card shadow">
        <div class="header-bg">
          <h2 class="text-center mb-0"><i class="bi bi-calendar-week"></i> Gestion des Plannings et Horaires</h2>
        </div>

        <div class="card-body">
          <!-- Barre d'actions -->
          <div class="row mb-3">
            <div class="col-md-6 action-buttons">
              <button class="btn primary-btn me-2" @click="showAllData">
                <i class="bi bi-eye"></i> Voir Toutes les Données
              </button>
              <button class="btn export-excel-btn me-2" @click="exportAllData">
                <i class="bi bi-file-excel"></i> Exporter Excel
              </button>
              <button class="btn export-pdf-btn" @click="exportToPDF">
                <i class="bi bi-file-pdf"></i> Exporter PDF
              </button>
            </div>
          </div>


        <!-- Section unifiée Upload + Sélecteurs -->
          <div class="row mb-4 align-items-end">
            <!-- Colonne upload -->
            <div class="col-md-6">
              <PlanningUploadForm @upload="handleUploadSuccess" @error="handleUploadError" />
            </div>

           <!-- Colonne sélecteurs -->
            <div class="col-md-6">
              <div class="selectors-row">
                <div class="row">
                  <div class="col-md-4">
                    <label class="form-label">Année</label>
                    <select v-model="selectedYear" @change="onYearChange" class="form-select filter-select">
                      <option value="all">Toutes les années</option>
                      <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                  </div>
                 <div class="col-md-4">
                    <label class="form-label">Mois</label>
                    <select v-model="selectedMonth" @change="onMonthChange" class="form-select filter-select">
                      <option value="all">Tous les mois</option>
                      <option v-for="month in availableMonthsForYear" :key="month" :value="month">
                        {{ formatMonthForDisplay(month) }}
                      </option>
                    </select>
                  </div>
                 <div class="col-md-4">
                    <label class="form-label">Semaine</label>
                    <select v-model="selectedWeek" @change="applyFilters" class="form-select filter-select">
                      <option value="all">Toutes les semaines</option>
                      <option v-for="week in availableWeeksForMonth" :key="week" :value="week">
                        {{ week }} - {{ getWeekDateRange(week) }}
                      </option>
                    </select>
                  </div>
                </div>

                <br>
               <!-- Boutons de filtrage -->
                <div class="row mb-4">
                  <div class="col-md-12 d-flex justify-content-between align-items-center">
                    <button class="btn primary-btn" @click="applyFilters">
                      <i class="bi bi-filter"></i> Appliquer les Filtres
                    </button>
                    <button class="btn secondary-btn" @click="resetFilters">
                      <i class="bi bi-x-circle"></i> Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtres -->
          <FilterPanel v-model:searchQuery="searchQuery" v-model:selectedFilter="selectedFilter"
            v-model:selectedYear="selectedYear" v-model:selectedMonth="selectedMonth"
            v-model:selectedWeek="selectedWeek" :availableYears="availableYears" :availableMonths="availableMonths"
            :availableWeeks="availableWeeks" @filter="applyFilters" @reset="resetFilters" />

          <br>
          <!-- Affichage des données -->
          <div class="mb-4">
            <PlanningStats :stats="planningStore.stats" />
          </div>

          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>

          <div v-else>
            <div v-if="groupedData.length > 0" class="all-data-table">
              <div v-for="({ week, data, days }, index) in groupedData" :key="week || index"
                class="week-table-container mb-5">
                <h4 class="mb-3 section-title">{{ week || 'Semaine inconnue' }} ({{ days[0]?.date }} - {{ days[6]?.date }})</h4>
                <div class="table-wrapper">
                  <PlanningTable :data="data" :days="days" :weekTitle="week || 'Semaine inconnue'"
                    @show-details="showDetails" @export="handleExport" />
                </div>
              </div>
            </div>
            <div v-else class="alert alert-info text-center">
              <i class="bi bi-info-circle"></i> Aucune donnée disponible pour les filtres sélectionnés.
            </div>
          </div>

        </div>
      </div>

       <!-- Modal détails -->
      <div class="modal fade" id="detailsModal" tabindex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header custom-header">
              <h5 class="modal-title" id="detailsModalLabel">Détails Jour</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <PlanningDetails :agent="selectedAgent" :day="selectedDay" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageModel>
</template>

<script setup lang="ts">
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ref, computed, onMounted, watch } from 'vue';
import { usePlanningStore } from '@/stores/planningStore';
import type { Planning, DaySchedule, UploadResponse, UnifiedPlanningFilters } from '@/types/Planning';
import PlanningUploadForm from '@/components/planning/PlanningUploadForm.vue';
import PlanningStats from '@/components/planning/PlanningStats.vue';
import PlanningTable from '@/components/planning/PlanningTable.vue';
import PlanningDetails from '@/components/planning/PlanningDetails.vue';
import FilterPanel from '@/components/planning/FilterPanel.vue';
import PageModel from '@/components/organisms/PageModel.vue';
import { Modal } from 'bootstrap';

const planningStore = usePlanningStore();

const loading = ref(false);
const selectedAgent = ref('');
const selectedDay = ref<DaySchedule | null>(null);
const searchQuery = ref('');
const selectedFilter = ref('all');
const selectedYear = ref('all');
const selectedMonth = ref('all');
const selectedWeek = ref('all');
const availableWeeksForMonth = ref<string[]>([]);
const weekDays = ref<DaySchedule[]>([]);

const availableYears = computed(() => planningStore.availableYears);
const availableMonths = computed(() => planningStore.availableMonths);
const availableWeeks = computed(() => planningStore.availableWeeks);

const availableMonthsForYear = computed(() => {
  return availableMonths.value;
});

const filteredData = computed(() => {
  let data = planningStore.plannings;

  if (searchQuery.value) {
    data = data.filter(p => p.agent_name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  if (selectedFilter.value !== 'all') {
    const shift = selectedFilter.value.toUpperCase();
    data = data.filter(p => p.days.some(d => d.shift === shift));
  }

  return data;
});

const groupedData = computed(() => {
  const groups: { [week: string]: Planning[] } = {};

  filteredData.value.forEach(planning => {
    if (!groups[planning.semaine]) {
      groups[planning.semaine] = [];
    }
    groups[planning.semaine].push(planning);
  });

  return Object.entries(groups).map(([week, data]) => ({
    week,
    data,
    days: data[0]?.days || []
  }));
});

const applyFilters = async () => {
  loading.value = true;
  const filters: UnifiedPlanningFilters = {
    searchQuery: searchQuery.value,
    selectedFilter: selectedFilter.value,
    selectedYear: selectedYear.value,
    selectedMonth: selectedMonth.value,
    selectedWeek: selectedWeek.value,
  };
  await planningStore.applyFilters(filters);
  if (selectedWeek.value !== 'all' && planningStore.plannings.length > 0) {
    weekDays.value = planningStore.plannings[0].days || [];
  }
  loading.value = false;
};

const onYearChange = async () => {
  selectedMonth.value = 'all';
  selectedWeek.value = 'all';
  await loadWeeksForMonth();
  applyFilters();
};

const onMonthChange = async () => {
  selectedWeek.value = 'all';
  await loadWeeksForMonth();
  applyFilters();
};

const loadWeeksForMonth = async () => {
  if (selectedYear.value !== 'all' && selectedMonth.value !== 'all') {
    availableWeeksForMonth.value = await planningStore.searchWeeksForMonth(selectedYear.value, selectedMonth.value);
  } else {
    availableWeeksForMonth.value = availableWeeks.value;
  }

  if (availableWeeksForMonth.value.length > 0 && !availableWeeksForMonth.value.includes(selectedWeek.value)) {
    selectedWeek.value = availableWeeksForMonth.value[0];
  }
};

const formatMonthForDisplay = (month: string) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[parseInt(month) - 1] || month;
};

const getWeekDateRange = (week: string) => {
  const [year, weekNum] = week.split('-W');
  const firstDay = getDateOfISOWeek(parseInt(weekNum), parseInt(year));
  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);

  return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
};

const getDateOfISOWeek = (w: number, y: number): Date => {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);

  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  return ISOweekStart;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  });
};

const resetFilters = () => {
  selectedYear.value = 'all';
  selectedMonth.value = 'all';
  selectedWeek.value = 'all';
  searchQuery.value = '';
  selectedFilter.value = 'all';
  applyFilters();
};

const showDetails = (agent: string, day: DaySchedule) => {
  selectedAgent.value = agent;
  selectedDay.value = day;
  const modalElement = document.getElementById('detailsModal');
  if (modalElement) {
    const modal = new Modal(modalElement);
    modal.show();
  } else {
    console.error('Modal #detailsModal non trouvé');
  }
};

const handleExport = () => {
  exportAllData();
};

const handleUploadSuccess = async (result: UploadResponse) => {
  console.log('Upload réussi:', result);
  await planningStore.refreshAfterUpload();
  if (result.weeks && result.weeks.length > 0) {
    selectedWeek.value = result.weeks[0];
  }
  await applyFilters();
};

const handleUploadError = (message: string) => {
  console.error('Upload erreur:', message);
  alert(`Erreur lors de l'upload: ${message}`);
};

const refreshData = async () => {
  await planningStore.refreshData();
};

const showAllData = async () => {
  resetFilters();
  await applyFilters();
};

onMounted(async () => {
  console.log('onMounted called');
  await planningStore.loadAvailableData();

  if (planningStore.availableWeeks.length > 0) {
    selectedWeek.value = planningStore.availableWeeks[0];
  }

  await applyFilters();

  watch(filteredData, (newData) => {
    console.log('Données filtrées:', newData);
  }, { immediate: true, deep: true });

  watch(groupedData, (newGroupedData) => {
    console.log('Données groupées:', newGroupedData);
  }, { immediate: true, deep: true });
});

watch(availableWeeks, (newWeeks) => {
  if (newWeeks && newWeeks.length > 0 && selectedWeek.value === 'all') {
    selectedWeek.value = newWeeks[0];
    applyFilters();
  }
});

const exportAllData = async () => {
  try {
    const dataToExport = filteredData.value.length > 0 ? filteredData.value : planningStore.plannings;
    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    exportToExcel(dataToExport, `plannings-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
};

const exportToExcel = (data: Planning[], filename: string) => {
  const worksheet = utils.json_to_sheet(data.map(planning => {
    const row: any = {
      'Agent': planning.agent_name,
      'Semaine': planning.semaine,
      'Total Heures': planning.total_heures,
      'Remarques': planning.remarques || ''
    };

    planning.days.forEach(day => {
      row[day.name] = day.shift;
    });

    return row;
  }));

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Plannings');
  writeFile(workbook, filename);
};

const exportToPDF = async () => {
  try {
    const dataToExport = filteredData.value.length > 0 ? filteredData.value : planningStore.plannings;
    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF();

    doc.text('Planning des Agents', 14, 15);

    const tableData = dataToExport.map(planning => [
      planning.agent_name,
      planning.semaine,
      ...planning.days.map(day => day.shift),
      planning.total_heures.toString(),
      planning.remarques || ''
    ]);

    const headers = [
      'Agent',
      'Semaine',
      ...dataToExport[0].days.map(day => day.name),
      'Total Heures',
      'Remarques'
    ];

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 20,
    });

    doc.save(`plannings-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erreur export PDF:', error);
    alert('Erreur lors de l\'export PDF');
  }
};
</script>

<style scoped>
.container {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding: 20px;
}

.card {
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 0;
}

.header-bg {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  padding: 2rem 1rem;
  border-radius: 8px 8px 0 0;
}

.card-body {
  padding-bottom: 0;
  background: rgba(255, 255, 255, 0.1);
}

/* Boutons */
.primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: transparent;
  color: white;
  border-radius: 25px;
  font-weight: 600;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-2px);
}

.secondary-btn {
  background: #95a5a6;
  border-color: transparent;
  color: white;
  border-radius: 25px;
  font-weight: 600;
}

.secondary-btn:hover {
  background: #7b8a8b;
  transform: translateY(-2px);
}

.export-excel-btn {
  background: #28a745;
  border-color: transparent;
  color: white;
  border-radius: 25px;
  font-weight: 600;
}

.export-excel-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.export-pdf-btn {
  background: #dc3545;
  border-color: transparent;
  color: white;
  border-radius: 25px;
  font-weight: 600;
}

.export-pdf-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
}

/* Formulaires - CORRECTION IMPORTANTE */
.form-label {
  color: #f0f0f5;
  font-weight: 500;
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

/* Sections */
.section-title {
  color: #ffc107;
}

.selectors-row {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.week-table-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 0;
}

/* Alertes */
.alert {
  border-radius: 8px;
  border: none;
}

.alert-info {
  background: rgba(23, 162, 184, 0.2);
  border: 1px solid rgba(23, 162, 184, 0.3);
  color: #f0f0f5;
}

.alert-warning {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

/* Modal */
.modal-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.custom-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffc107;
  border-radius: 8px 8px 0 0;
}

/* Barre d'actions */
.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
}

.action-buttons button {
  white-space: nowrap;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .row.mb-4.align-items-end {
    flex-direction: column;
  }

  .selectors-row .row {
    flex-direction: column;
  }

  .selectors-row .col-md-4 {
    width: 100%;
    margin-bottom: 10px;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  .action-buttons button {
    flex: 1;
    min-width: 120px;
    margin: 2px 0;
  }
}

@media (max-width: 576px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons button {
    width: 100%;
    margin: 2px 0;
  }
}

/* Style pour le tableau à l'intérieur du wrapper */
.table-wrapper :deep(table) {
  min-width: 1200px;
  width: 100%;
  margin-bottom: 0;
}

.table-wrapper :deep(th) {
  background: rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
  color: #ffc107;
}

.table-wrapper :deep(td) {
  white-space: nowrap;
  vertical-align: middle;
  color: #f0f0f5;
}

/* Pour le chargement */
.text-center.py-4 {
  padding-bottom: 1rem !important;
  margin-bottom: 0 !important;
}

.text-muted {
  color: rgba(240, 240, 245, 0.7) !important;
}
</style>