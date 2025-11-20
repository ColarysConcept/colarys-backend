<template>
  <div class="planning-table">
    <table v-if="data.length > 0 && days.length > 0" class="table table-bordered table-hover">
      <thead>
        <tr>
          <th>Agent</th>
          <th v-for="day in days" :key="day.day">{{ day.name }} ({{ day.date }})</th>
          <th>Total Heures</th>
          <th>Remarques</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="planning in data" :key="planning.id || planning.agent_name + planning.semaine">
          <td class="agent-name">{{ planning.agent_name }}</td>
          <td v-for="day in days" :key="day.day" @click="showDetails(planning.agent_name, getDaySchedule(planning, day))">
            {{ getDaySchedule(planning, day)?.shift || 'OFF' }}
          </td>
          <td class="important-text">{{ planning.total_heures }}h</td>
          <td>{{ planning.remarques || '-' }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="alert alert-warning">
      <i class="bi bi-exclamation-triangle"></i> Aucune donnée ou jour disponible pour afficher le tableau.
    </div>
    
    <div class="export-buttons mt-3">
      <button class="btn export-excel-btn me-2" @click="exportToExcel">
        <i class="bi bi-file-excel"></i> Exporter Excel
      </button>
      <button class="btn export-pdf-btn" @click="exportToPDF">
        <i class="bi bi-file-pdf"></i> Exporter PDF
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { Planning, DaySchedule } from '../../types/Planning';
import { PlanningService } from '../../services/PlanningService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const props = defineProps<{
  data: Planning[];
  days: DaySchedule[];
  weekTitle: string;
}>();

const emit = defineEmits<{
  (e: 'show-details', agent: string, day: DaySchedule): void;
}>();

onMounted(() => {
  console.log('PlanningTable mounted, data[0]:', props.data[0]);
  console.log('Days props:', props.days);
});

const getDaySchedule = (planning: Planning, day: DaySchedule): DaySchedule | undefined => {
  console.log('getDaySchedule called for:', { agent: planning.agent_name, targetDay: day.day });

  if (planning.days && planning.days.length > 0) {
    const matchingDay = planning.days.find(d => d.day.toUpperCase() === day.day.toUpperCase());
    if (matchingDay) {
      console.log('Found matching day from array:', matchingDay);
      return {
        ...matchingDay,
        hours: PlanningService.getShiftHours(matchingDay.shift),
        remarques: matchingDay.remarques || planning.remarques || '',
      };
    } else {
      console.warn(`No matching day in array for ${day.day} in ${planning.agent_name}`);
    }
  }

  console.warn('Fallback to legacy fields for', planning.agent_name);
  let shift = 'OFF';
  let hours = 0;

  const dayUpper = day.day.toUpperCase();
  switch (dayUpper) {
    case 'LUNDI': shift = planning.lundi || 'OFF'; break;
    case 'MARDI': shift = planning.mardi || 'OFF'; break;
    case 'MERCREDI': shift = planning.mercredi || 'OFF'; break;
    case 'JEUDI': shift = planning.jeudi || 'OFF'; break;
    case 'VENDREDI': shift = planning.vendredi || 'OFF'; break;
    case 'SAMEDI': shift = planning.samedi || 'OFF'; break;
    case 'DIMANCHE': shift = planning.dimanche || 'OFF'; break;
  }

  hours = PlanningService.getShiftHours(shift);

  return {
    fullDate: day.fullDate,
    name: day.name,
    date: day.date,
    shift,
    hours,
    day: day.day,
    remarques: planning.remarques || '',
  };
};

const showDetails = (agent: string, day: DaySchedule | undefined) => {
  if (!day) {
    console.error('No day for details');
    return;
  }
  console.log('showDetails:', { agent, day });
  emit('show-details', agent, day);
};

const exportToExcel = () => {
  try {
    // Préparer les données pour Excel
    const excelData = props.data.map(planning => {
      const row: any = {
        'Agent': planning.agent_name,
        'Total Heures': planning.total_heures,
        'Remarques': planning.remarques || '-'
      };

      // Ajouter les colonnes pour chaque jour
      props.days.forEach(day => {
        const daySchedule = getDaySchedule(planning, day);
        row[`${day.name} (${day.date})`] = daySchedule?.shift || 'OFF';
      });

      return row;
    });

    // Créer le classeur Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning');

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planning-${props.weekTitle}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
};

const exportToPDF = () => {
  try {
    // Créer un nouveau document PDF
    const doc = new jsPDF();
    
    // Ajouter un titre
    doc.setFontSize(16);
    doc.text(`Planning - ${props.weekTitle}`, 14, 15);
    
    // Préparer les données pour le tableau
    const tableData = props.data.map(planning => {
      const row = [
        planning.agent_name,
        ...props.days.map(day => {
          const daySchedule = getDaySchedule(planning, day);
          return daySchedule?.shift || 'OFF';
        }),
        `${planning.total_heures}h`,
        planning.remarques || '-'
      ];
      return row;
    });

    // Préparer les en-têtes du tableau
    const headers = [
      'Agent',
      ...props.days.map(day => `${day.name} (${day.date})`),
      'Total Heures',
      'Remarques'
    ];

    // Générer le tableau
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] } // Couleur bleue pour l'en-tête
    });

    // Sauvegarder le PDF
    doc.save(`planning-${props.weekTitle}.pdf`);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    alert('Erreur lors de l\'export PDF');
  }
};
</script>

<style scoped>
.planning-table {
  margin-bottom: 1rem;
}

.table {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.table th,
.table td {
  vertical-align: middle;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
}

.table th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  font-weight: 600;
}

.table-hover tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.agent-name {
  color: #ffc107;
  font-weight: 600;
}

.important-text {
  color: #ffc107;
  font-weight: 600;
}

.export-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

.alert-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  border-radius: 8px;
}
</style>