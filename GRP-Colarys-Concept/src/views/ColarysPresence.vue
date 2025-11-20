<template>
  <PageModel>
    <div class="colarys-presence">
      <h1>Gestion des Présences Colarys</h1>

      <!-- Messages -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>Erreur :</strong> {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''"></button>
      </div>

      <div class="calendar-controls">
        <button @click="prevMonth" class="btn btn-secondary" :disabled="loading">
          <i class="fas fa-chevron-left"></i> Mois précédent
        </button>
        <h2>{{ monthLabel }}</h2>
        <button @click="nextMonth" class="btn btn-secondary" :disabled="loading">
          Mois suivant <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="loading-indicator">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <span class="ms-2">Chargement des présences...</span>
      </div>

      <div v-else class="card">
        <div class="table-responsive">
          <table class="table presence-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th v-for="day in daysInMonth" :key="day" class="day-header">
                  {{ getDayLabel(day) }}
                </th>
                <th>Présence (p)</th>
                <th>Nuit (n)</th>
                <th>Absence (a)</th>
                <th>Congés (c)</th>
                <th>Férié (m)</th>
                <th>Formation (f)</th>
                <th>OFF (o)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="employee in employees" :key="employee.Matricule">
                <td class="employee-name">
                  {{ employee.Matricule }} - {{ employee.Prénom }} {{ employee.Nom }}
                </td>
                <td v-for="day in daysInMonth" :key="day">
                  <select 
                    v-model="presences[getPresenceKey(employee.Matricule, day)]"
                    @change="updatePresence(employee.Matricule, day, $event.target.value)"
                    class="presence-select"
                    :class="getPresenceClass(presences[getPresenceKey(employee.Matricule, day)])"
                    :disabled="loading">
                    <option value="">-</option>
                    <option value="p">P</option>
                    <option value="n">N</option>
                    <option value="a">A</option>
                    <option value="c">C</option>
                    <option value="m">M</option>
                    <option value="f">F</option>
                    <option value="o">O</option>
                  </select>
                </td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'p') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'n') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'a') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'c') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'm') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'f') }}</td>
                <td class="total-cell">{{ calculateTotal(employee.Matricule, 'o') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="actions mt-3">
        <button @click="saveAllPresences" class="btn btn-primary" :disabled="loading">
          <i class="fas fa-save"></i> Enregistrer toutes les présences
        </button>

        <button @click="testConnection" class="btn btn-info ms-2" :disabled="loading">
          <i class="fas fa-bug"></i> Test Connexion
        </button>
      </div>

      <div class="legend mt-3">
        <h4>Légende :</h4>
        <div class="legend-items">
          <div class="legend-item"><span class="color-present"></span> Présence (p)</div>
          <div class="legend-item"><span class="color-night"></span> Nuit (n)</div>
          <div class="legend-item"><span class="color-absent"></span> Absence (a)</div>
          <div class="legend-item"><span class="color-conge"></span> Congés (c)</div>
          <div class="legend-item"><span class="color-ferie"></span> Férié (m)</div>
          <div class="legend-item"><span class="color-formation"></span> Formation (f)</div>
          <div class="legend-item"><span class="color-off"></span> OFF (o)</div>
        </div>
      </div>
    </div>
  </PageModel>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useColarysStore } from '@/stores/colarys'
import PageModel from '@/components/organisms/PageModel.vue'

const colarysStore = useColarysStore()
const employees = computed(() => colarysStore.employees)

// États locaux
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const loading = ref(false)
const presences = reactive({})

// Messages
const errorMessage = ref('')
const successMessage = ref('')

const monthLabel = computed(() => {
  return new Date(currentYear.value, currentMonth.value - 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  })
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

const getDayLabel = (day) => {
  const date = new Date(currentYear.value, currentMonth.value - 1, day)
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  return `${dayNames[date.getDay()]}\n${day}`
}

const getPresenceKey = (matricule, day) => {
  return `${matricule}_${currentYear.value}_${currentMonth.value}_${day}`
}

const getPresenceClass = (value) => {
  const classes = {
    'p': 'presence-present',
    'n': 'presence-night',
    'a': 'presence-absent',
    'c': 'presence-conge',
    'm': 'presence-ferie',
    'f': 'presence-formation',
    'o': 'presence-off'
  }
  return classes[value] || ''
}

const calculateTotal = (matricule, type) => {
  let total = 0;
  for (let day = 1; day <= daysInMonth.value; day++) {
    const key = getPresenceKey(matricule, day);
    if (presences[key] === type) {
      // Pour OFF, on compte le nombre de jours (pas d'heures)
      if (type === 'o') {
        total += 1;
      } else {
        // Pour les autres types, on compte en heures (8h par jour)
        total += 8;
      }
    }
  }
  return type === 'o' ? total : total;
}

const updatePresence = async (matricule, day, value) => {
  const key = getPresenceKey(matricule, day)
  
  try {
    // Mettre à jour localement d'abord
    if (value === '') {
      delete presences[key]
    } else {
      presences[key] = value
    }
    
    // Appel API
    const response = await fetch(
      `http://localhost:3000/api/colarys/presences/${matricule}/${currentYear.value}/${currentMonth.value}/${day}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: value })
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Erreur lors de la mise à jour')
    }
    
    // Si c'est un congé, mettre à jour le solde
    if (value === 'c') {
      await updateSoldeConge(matricule)
    }
    
  } catch (error) {
    console.error('Erreur mise à jour présence:', error)
    errorMessage.value = `Erreur lors de la mise à jour: ${error.message}`
    
    // Recharger les présences en cas d'erreur
    await loadPresences()
  }
}

const updateSoldeConge = async (matricule) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/colarys/employes/${matricule}`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        // Recharger les employés pour avoir les soldes à jour
        await colarysStore.loadEmployees()
      }
    }
  } catch (error) {
    console.error('Erreur mise à jour solde congé:', error)
  }
}

const saveAllPresences = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    console.log('💾 Sauvegarde de toutes les présences...')
    
    let successCount = 0
    let errorCount = 0
    
    for (const employee of employees.value) {
      for (let day = 1; day <= daysInMonth.value; day++) {
        const key = getPresenceKey(employee.Matricule, day)
        if (presences[key]) {
          try {
            const response = await fetch(
              `http://localhost:3000/api/colarys/presences/${employee.Matricule}/${currentYear.value}/${currentMonth.value}/${day}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: presences[key] })
              }
            )
            
            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            console.error(`❌ Erreur pour ${employee.Matricule} jour ${day}:`, error)
            errorCount++
          }
        }
      }
    }
    
    if (errorCount === 0) {
      successMessage.value = `Toutes les présences (${successCount}) ont été enregistrées avec succès!`
    } else {
      successMessage.value = `${successCount} présences sauvegardées, ${errorCount} erreurs`
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde présences:', error)
    errorMessage.value = `Erreur lors de la sauvegarde: ${error.message}`
  } finally {
    loading.value = false
  }
}

const prevMonth = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value--
    } else {
      currentMonth.value--
    }

    await loadPresences()
  } catch (error) {
    console.error('Erreur navigation mois précédent:', error)
    errorMessage.value = `Erreur navigation: ${error.message}`
  } finally {
    loading.value = false
  }
}

const nextMonth = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value++
    } else {
      currentMonth.value++
    }

    await loadPresences()
  } catch (error) {
    console.error('Erreur navigation mois suivant:', error)
    errorMessage.value = `Erreur navigation: ${error.message}`
  } finally {
    loading.value = false
  }
}

const loadPresences = async () => {
  loading.value = true
  try {
    console.log(`📅 Chargement des présences pour ${currentMonth.value}/${currentYear.value}`)

    // Vider les présences actuelles
    Object.keys(presences).forEach(key => {
      delete presences[key]
    })

    // Charger les employés si nécessaire
    if (employees.value.length === 0) {
      console.log('👥 Chargement des employés...')
      await colarysStore.loadEmployees()
    }

    // Charger les présences via API
    const response = await fetch(
      `http://localhost:3000/api/colarys/presences/${currentYear.value}/${currentMonth.value}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.success && data.data && data.data.presences) {
      // Remplir avec les données de l'API
      Object.entries(data.data.presences).forEach(([key, value]) => {
        presences[key] = value
      })

      console.log(`✅ ${Object.keys(data.data.presences).length} présences chargées`)
    } else {
      console.log('ℹ️ Aucune donnée de présence trouvée pour ce mois')
    }

  } catch (error) {
    console.error('❌ Erreur chargement présences:', error)
    errorMessage.value = `Erreur chargement: ${error.message}`
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/colarys/health')
    const data = await response.json()
    console.log('🔌 Test connexion:', data)
    
    if (data.success) {
      successMessage.value = '✅ Connexion API réussie'
    } else {
      errorMessage.value = '❌ Problème de connexion API'
    }
    
    return { success: data.success, message: data.message }
  } catch (error) {
    console.error('❌ Test connexion échoué:', error)
    errorMessage.value = `❌ Erreur connexion: ${error.message}`
    return { success: false, message: error.message }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // Test de connexion d'abord
    const connection = await testConnection()
    if (!connection.success) {
      errorMessage.value = `Connexion API échouée: ${connection.message}`
      return
    }

    await loadPresences()
  } catch (error) {
    console.error('❌ Erreur initialisation:', error)
    errorMessage.value = `Erreur initialisation: ${error.message}`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Les styles restent exactement les mêmes */
.presence-off {
  background-color: rgba(189, 189, 189, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.color-off {
  background-color: rgba(189, 189, 189, 0.8);
}

.actions {
  text-align: center;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}


.presence-off {
  background-color: rgba(189, 189, 189, 0.8) !important; /* Gris */
  color: #000 !important;
  font-weight: 700;
}

.color-off {
  background-color: rgba(189, 189, 189, 0.8);
}


.actions {
  text-align: center;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}


.colarys-presence {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding: 20px 0;
  color: #f0f0f5;
}

h1 {
  color: #ffc107;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.2rem;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.calendar-controls h2 {
  color: #ffc107;
  font-weight: 700;
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 0.95rem;
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(149, 165, 166, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin: 20px auto;
  max-width: 1200px;
  color: #f0f0f5;
  font-weight: 600;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #f0f0f5;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  font-size: 0.85rem;
   max-height: 80vh;
}

/* Style pour les en-têtes de jours fixes */
.presence-table thead {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

/* Première colonne (noms employés) fixe */
.presence-table th:first-child,
.presence-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 50;
  background: rgba(30, 60, 114, 0.95);
  backdrop-filter: blur(10px);
}

/* En-tête de la première colonne */
.presence-table th:first-child {
  z-index: 150; /* Plus élevé pour être au-dessus des autres en-têtes */
  background: rgba(30, 60, 114, 0.95);
}

/* Colonnes des totaux fixes à droite */
.presence-table th:last-child,
.presence-table td:last-child {
  position: sticky;
  right: 0;
  z-index: 50;
  background: rgba(30, 60, 114, 0.95);
  backdrop-filter: blur(10px);
}

.presence-table th:last-child {
  z-index: 150;
  background: rgba(30, 60, 114, 0.95);
}

.presence-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  color: #f0f0f5;
}

.presence-table th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 700;
  text-align: center;
  padding: 12px 8px;
}

/* Effet d'ombre pour mieux distinguer les éléments fixes */
.presence-table th:first-child,
.presence-table td:first-child {
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);
}

.presence-table th:last-child,
.presence-table td:last-child {
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
}

.presence-table thead {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.presence-table td {
  background: rgba(255, 255, 255, 0.05);
  color: #f0f0f5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
  text-align: center;
  padding: 8px 4px;
}

.day-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.15) !important;
  z-index: 100;
  text-align: center;
  white-space: pre-line;
  padding: 8px 4px;
  font-weight: bold;
  color: #ffc107;
  font-size: 0.8rem;
  min-width: 50px; /* Largeur minimale pour les colonnes jours */
}

/* Assurer que les cellules des jours ont une largeur cohérente */
.presence-table td:not(:first-child):not(:last-child) {
  min-width: 50px;
  max-width: 50px;
}



.employee-name {
  font-weight: 600;
  white-space: nowrap;
  min-width: 150px;
  color: #f0f0f5;
  text-align: left !important; /* 🔥 FORCER l'alignement à gauche */
  padding-left: 15px;
  vertical-align: middle; /* 🔥 Assurer l'alignement vertical */
}

.presence-table td:first-child {
  text-align: left !important;
  padding-left: 15px;
}

.presence-table tbody tr td:first-child {
  text-align: left !important;
  padding-left: 15px;
}

.employee-column {
  text-align: left !important;
  justify-content: flex-start;
  padding-left: 15px;
}

/* Empêcher le texte de déborder dans les cellules jours */
.presence-select {
  width: 100%;
  padding: 8px 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  font-weight: 600;
  cursor: pointer;
  max-width: 45px; /* Limiter la largeur maximale */
}

.presence-select:focus {
  outline: none;
  border-color: #ffc107;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.presence-select:disabled {
  background-color: rgba(255, 255, 255, 0.05);
  opacity: 0.6;
  cursor: not-allowed;
}

/* Styles de présence avec fonds colorés */
.presence-present {
  background-color: rgba(165, 214, 167, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.presence-night {
  background-color: rgba(128, 222, 234, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.presence-absent {
  background-color: rgba(239, 154, 154, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.presence-conge {
  background-color: rgba(255, 245, 157, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.presence-ferie {
  background-color: rgba(206, 147, 216, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.presence-formation {
  background-color: rgba(224, 224, 224, 0.8) !important;
  color: #000 !important;
  font-weight: 700;
}

.total-cell {
  text-align: center;
  font-weight: 700;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  padding: 10px 8px;
}

.actions {
  text-align: center;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.legend {
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.legend h4 {
  color: #ffc107;
  font-weight: 700;
  margin-bottom: 15px;
  text-align: center;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 10px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f0f0f5;
  font-weight: 600;
  font-size: 0.9rem;
}

.legend-item span {
  display: inline-block;
  width: 25px;
  height: 25px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-present {
  background-color: rgba(165, 214, 167, 0.8);
}

.color-night {
  background-color: rgba(128, 222, 234, 0.8);
}

.color-absent {
  background-color: rgba(239, 154, 154, 0.8);
}

.color-conge {
  background-color: rgba(255, 245, 157, 0.8);
}

.color-ferie {
  background-color: rgba(206, 147, 216, 0.8);
}

.color-formation {
  background-color: rgba(224, 224, 224, 0.8);
}

/* Styles pour la table avec beaucoup de colonnes */
.presence-table th,
.presence-table td {
  padding: 10px 6px;
  vertical-align: middle;
}

/* Amélioration de la lisibilité des lignes */
.presence-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Style pour les en-têtes de jours */
.day-header {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.15);
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .presence-table {
    font-size: 0.8rem;
  }

  .presence-select {
    font-size: 0.8rem;
    padding: 6px 3px;
  }
}

@media (max-width: 768px) {
  .calendar-controls {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }

  .presence-table {
    font-size: 0.7rem;
  }

  .presence-select {
    padding: 4px 2px;
    font-size: 0.7rem;
  }

  .employee-name {
    min-width: 120px;
    font-size: 0.75rem;
    padding-left: 10px;
  }

  .legend-items {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .day-header {
    font-size: 0.65rem;
    padding: 6px 2px;
  }

  .presence-table th,
  .presence-table td {
    padding: 6px 3px;
  }

  .total-cell {
    padding: 8px 4px;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .colarys-presence {
    padding: 10px 0;
  }

  h1 {
    font-size: 1.8rem;
    padding: 0 15px;
  }

  .presence-table {
    font-size: 0.65rem;
  }

  .presence-select {
    padding: 3px 1px;
    font-size: 0.65rem;
  }

  .employee-name {
    min-width: 100px;
    font-size: 0.7rem;
    padding-left: 5px;
  }

  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    width: 100%;
  }

  .calendar-controls {
    gap: 10px;
  }

  .legend {
    padding: 15px;
  }

  .legend-item {
    font-size: 0.8rem;
  }
}

/* Animation pour les boutons */
@keyframes buttonPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.btn:active {
  animation: buttonPulse 0.2s ease;
}

/* Scrollbar personnalisée pour le tableau */
.table-responsive::-webkit-scrollbar {
  height: 8px;
}

.table-responsive::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #2980b9;
}

/* Amélioration du contraste pour la sélection */
.presence-select option {
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  font-weight: 600;
}

/* Effet de survol sur les cellules */
.presence-table td:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

/* Style pour les totaux */
.total-cell {
  border-left: 2px solid rgba(255, 255, 255, 0.3);
  border-right: 2px solid rgba(255, 255, 255, 0.3);
}

/* Styles pour le spinner de chargement */
.spinner-border.text-primary {
  color: #3498db !important;
}

/* Amélioration de la visibilité */
.presence-table td {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.presence-table th {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Effet de verre pour les conteneurs */
.calendar-controls,
.card,
.actions,
.legend,
.loading-indicator {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 🔥 NOUVEAU : Styles pour les alertes */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px auto;
  max-width: 1200px;
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #f0f0f5;
}

.alert-success {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  color: #f0f0f5;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ffc107;
  opacity: 0.8;
  transition: opacity 0.2s;
  font-weight: bold;
}

.btn-close:hover {
  opacity: 1;
}

.btn-info {
  background: #17a2b8;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

/* Ajustements pour mobile */
@media (max-width: 768px) {
  .day-header {
    min-width: 40px;
    font-size: 0.7rem;
    padding: 6px 2px;
  }
  
  .presence-table td:not(:first-child):not(:last-child) {
    min-width: 40px;
    max-width: 40px;
  }
  
  .presence-select {
    max-width: 35px;
    font-size: 0.7rem;
    padding: 6px 2px;
  }
}

@media (max-width: 480px) {
  .day-header {
    min-width: 35px;
    font-size: 0.65rem;
    padding: 4px 1px;
  }
  
  .presence-table td:not(:first-child):not(:last-child) {
    min-width: 35px;
    max-width: 35px;
  }
  
  .presence-select {
    max-width: 30px;
    font-size: 0.65rem;
    padding: 4px 1px;
  }
}
</style>