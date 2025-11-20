<!-- PlanningDetails.vue -->
<template>
  <div v-if="agent && day" class="card">
    <div class="card-header custom-header">
      <h5>Détails pour {{ agent }} - {{ formatDate(day.date) }}</h5>
    </div>
    <div class="card-body">
      <p><strong class="important-text">Jour:</strong> {{ day.name }}</p>
      <p><strong class="important-text">Date:</strong> {{ formatDate(day.date) }}</p>
      <p><strong class="important-text">Shift:</strong> {{ day.shift ? day.shift.toUpperCase() : 'N/A' }}</p>
      <p><strong class="important-text">Heures:</strong> {{ day.hours ?? 'N/A' }}h</p>
      <p v-if="day.remarques"><strong class="important-text">Remarques:</strong> {{ day.remarques }}</p>
    </div>
  </div>
  <div v-else class="alert alert-warning">
    <i class="bi bi-exclamation-triangle"></i> Données manquantes pour afficher les détails.
  </div>
</template>


<script setup lang="ts">
import type { DaySchedule } from '@/types/Planning';

const props = withDefaults(
  defineProps<{
    agent?: string;
    day?: DaySchedule | null; // Modifié pour accepter null
  }>(),
  {
    agent: '',
    day: null, // Valeur par défaut null
  }
);

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  // Si la date est déjà au format JJ/MM, ajouter l'année courante
  if (dateString.includes('/') && dateString.length === 5) {
    const currentYear = new Date().getFullYear();
    return `${dateString}/${currentYear}`;
  }
  
  return dateString;
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.custom-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffc107;
  border-radius: 8px 8px 0 0;
}

.card-body p {
  margin-bottom: 0.5rem;
  color: #f0f0f5;
}

.important-text {
  color: #ffc107;
}

.alert-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  border-radius: 8px;
}
</style>
