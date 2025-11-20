<template>
  <div class="card mb-4">
    <div class="card-header custom-header">
      <h5 class="mb-0"><i class="bi bi-graph-up"></i> Statistiques</h5>
    </div>
    <div class="card-body">
      <div v-if="stats && stats.totalAgents > 0" class="row">
        <!-- Statistiques de base -->
        <div class="col-md-3 col-6 mb-3" v-for="stat in statItems" :key="stat.label">
          <div class="text-center p-3 border rounded stat-card">
            <div class="h4 mb-1 stat-value">{{ stat.value }}</div>
            <div class="small stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-4 text-muted">
        <i class="bi bi-graph-down display-4 mb-2"></i>
        <p>Aucune donnée pour afficher les statistiques.</p>
      </div>

      <!-- Répartition des shifts -->
      <div v-if="hasShiftData" class="mt-4">
        <h6 class="mb-3 section-title"><i class="bi bi-pie-chart"></i> Répartition des shifts</h6>
        <div class="row">
          <div class="col-md-2 col-4 mb-2" v-for="(count, shift) in stats?.shiftCounts" :key="shift">
            <div class="text-center p-2 border rounded" :class="getShiftBadgeClass(shift as string)">
              <div class="h6 mb-1 stat-value">{{ count }}</div>
              <div class="small stat-label">{{ formatShiftName(shift as string) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlanningStatsType } from '@/types/Planning';

const props = defineProps<{
  stats: PlanningStatsType;
}>();

const statItems = computed(() => {
  return [
    { label: 'Total Agents', value: props.stats.totalAgents || 0 },
    { label: 'Heures Total', value: `${props.stats.totalHours || 0}h` },
    { label: 'Moyenne/Agent', value: `${props.stats.avgHours?.toFixed(1) || 0}h` },
    { label: 'Présents', value: props.stats.present || 0 },
    { label: 'Absents', value: props.stats.absent || 0 },
    { label: 'Jour', value: props.stats.dayShift || 0 },
    { label: 'Nuit', value: props.stats.nightShift || 0 },
  ];
});

const hasShiftData = computed(() => {
  return props.stats?.shiftCounts && Object.keys(props.stats.shiftCounts).length > 0;
});

const getShiftBadgeClass = (shift: string) => {
  const shiftUpper = shift.toUpperCase();
  if (shiftUpper.includes('MAT5')) return 'bg-mat5';
  if (shiftUpper.includes('MAT8')) return 'bg-mat8';
  if (shiftUpper.includes('MAT9')) return 'bg-mat9';
  if (shiftUpper === 'JOUR') return 'bg-jour';
  if (shiftUpper === 'NUIT') return 'bg-nuit';
  if (shiftUpper === 'OFF') return 'bg-off';
  if (shiftUpper === 'CONGE' || shiftUpper === 'CONGÉ') return 'bg-conge';
  if (shiftUpper === 'FORMATION') return 'bg-formation';
  if (shiftUpper === '-' || shiftUpper === 'ABSENT') return 'bg-absent';
  if (shiftUpper === 'MALADE') return 'bg-malade';
  return 'bg-light';
};

const formatShiftName = (shift: string) => {
  const shiftMap: { [key: string]: string } = {
    'MAT5': 'MAT 5h',
    'MAT8': 'MAT 8h', 
    'MAT9': 'MAT 9h',
    'JOUR': 'Jour',
    'NUIT': 'Nuit',
    'OFF': 'Off',
    'CONGE': 'Congé',
    'FORMATION': 'Formation',
    '-': 'Absent',
    'ABSENT': 'Absent',
    'MALADE': 'Malade'
  };
  return shiftMap[shift] || shift;
};
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
}

.custom-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffc107;
  border-radius: 8px 8px 0 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
}

.stat-value {
  color: #ffc107;
  font-weight: 600;
}

.stat-label {
  color: #f0f0f5;
}

.section-title {
  color: #ffc107;
}

.text-muted {
  color: rgba(240, 240, 245, 0.7) !important;
}

/* Styles des badges de shift */
.bg-mat5 { 
  background-color: rgba(227, 242, 253, 0.2) !important; 
  color: #1976d2; 
  border: 1px solid rgba(25, 118, 210, 0.3) !important;
}
.bg-mat8 { 
  background-color: rgba(225, 245, 254, 0.2) !important; 
  color: #0277bd; 
  border: 1px solid rgba(2, 119, 189, 0.3) !important;
}
.bg-mat9 { 
  background-color: rgba(224, 242, 241, 0.2) !important; 
  color: #00695c; 
  border: 1px solid rgba(0, 105, 92, 0.3) !important;
}
.bg-jour { 
  background-color: rgba(232, 245, 232, 0.2) !important; 
  color: #2e7d32; 
  border: 1px solid rgba(46, 125, 50, 0.3) !important;
}
.bg-nuit { 
  background-color: rgba(243, 229, 245, 0.2) !important; 
  color: #7b1fa2; 
  border: 1px solid rgba(123, 31, 162, 0.3) !important;
}
.bg-off { 
  background-color: rgba(245, 245, 245, 0.2) !important; 
  color: #616161; 
  border: 1px solid rgba(97, 97, 97, 0.3) !important;
}
.bg-conge { 
  background-color: rgba(255, 235, 238, 0.2) !important; 
  color: #d32f2f; 
  border: 1px solid rgba(211, 47, 47, 0.3) !important;
}
.bg-formation { 
  background-color: rgba(255, 248, 225, 0.2) !important; 
  color: #ff8f00; 
  border: 1px solid rgba(255, 143, 0, 0.3) !important;
}
.bg-absent { 
  background-color: rgba(255, 243, 205, 0.2) !important; 
  color: #856404; 
  border: 1px solid rgba(133, 100, 4, 0.3) !important;
}
.bg-malade { 
  background-color: rgba(232, 245, 232, 0.2) !important; 
  color: #155724; 
  border: 1px solid rgba(21, 87, 36, 0.3) !important;
}

.small {
  font-size: 0.875rem;
}

.h4 {
  font-size: 1.5rem;
  font-weight: 500;
}

.h6 {
  font-size: 1.1rem;
  font-weight: 500;
}
</style>