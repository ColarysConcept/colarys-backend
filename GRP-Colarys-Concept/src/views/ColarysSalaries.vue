<template>
  <PageModel>
    <div class="colarys-salaries">
      <h1>Calcul des Salaires Colarys</h1>

      <!-- Messages -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>Erreur :</strong> {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''"></button>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>Mois:</label>
          <select v-model="selectedMonth" class="form-select" @change="calculAutoOnChange">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label>Année:</label>
          <input v-model="selectedYear" type="number" class="form-input" min="2020" :max="currentYear"
            @change="calculAutoOnChange">
        </div>

        <div class="control-group">
          <label>Jours théoriques:<small class="hint">Laissez vide pour le calcul automatique</small></label>
          <div class="jours-input-group">
            <input v-model="joursTheoriques" type="number" class="form-input" min="1" max="31" step="1">
            <button @click="calculerJoursAuto" class="btn btn-outline"
              title="Calculer automatiquement les jours ouvrables">
              <i class="fas fa-calculator"></i> Auto
            </button>
          </div>
          
        </div>

        <button @click="calculateSalaries" class="btn btn-primary" :disabled="loading">
          <i class="fas fa-calculator"></i>
          {{ loading ? 'Calcul en cours...' : 'Calculer' }}
        </button>
      </div>

      <!-- Affichage des jours utilisés -->
      <div v-if="joursUtilises" class="info-badge">
        <i class="fas fa-info-circle"></i>
        Calcul effectué avec <strong>{{ joursUtilises }}</strong> jours théoriques
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="loading-indicator">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Calcul en cours...</span>
        </div>
        <span class="ms-2">Calcul des salaires...</span>
      </div>

      <!-- Tableau des salaires avec TOUTES les colonnes -->
      <div v-else-if="salairesCalcules.length > 0" class="card mt-4">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th class="sticky-col sticky-col-first">N°</th>
                <th class="sticky-col sticky-col-second">Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Compagne</th>
                <th>Salaire Base</th>
                <th>Taux Horaire</th>
                <th>Solde Congé</th>
                <th>Heures Présence</th>
                <th>Heures Congé</th>
                <th>Heures Férié</th>
                <th>Heures Nuit</th>
                <th>Jours Absence</th>
                <th>Montant Absence Déduit</th>
                <th>Montant Travaillé</th>
                <th>Majoration Nuit</th>
                <th>Majoration Férié</th>
                <th>Indemnité Congé</th>
                <th>Indemnité Formation</th>
                <th>Prime Production</th>
                <th>Prime Assiduité</th>
                <th>Prime Ancienneté</th>
                <th>Prime Élite</th>
                <th>Prime Responsabilité</th>
                <th>Indemnité Repas</th>
                <th>Indemnité Transport</th>
                <th>Salaire Brut</th>
                <th>Avance</th>
                <th>OSTIE</th>
                <th>CNaPS</th>
                <th>Social</th>
                <th>IGR</th>
                <th>Reste à Payer</th>
                <th class="sticky-col-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(salaire, index) in salairesCalcules" :key="salaire.Matricule">
                <td class="sticky-col sticky-col-first">{{ index + 1 }}</td>
                <td class="sticky-col sticky-col-second">{{ salaire.Matricule }}</td>
                <td>{{ salaire.Nom }}</td>
                <td>{{ salaire.Prénom }}</td>
                <td>{{ salaire.Compagne }}</td>
                <td class="base-salary">{{ formatCurrency(salaire['Salaire de base']) }}</td>
                <td>{{ formatCurrency(salaire['Taux horaire']) }}</td>
                <td>{{ salaire['Solde de congé'] }}</td>
                <td>{{ salaire['Heures de présence'] }}</td>
                <td>{{ salaire['Heures de congé'] }}</td>
                <td>{{ salaire['Heures férié majoré'] }}</td>
                <td>{{ salaire['Heures nuit majoré'] }}</td>
                <td class="absence-days">{{ salaire['Jours absence'] || 0 }}</td>
                <td class="deduction">{{ formatCurrency(salaire['Montant absence déduit'] || 0) }}</td>
                <td>{{ formatCurrency(salaire['Montant travaillé']) }}</td>
                <td>{{ formatCurrency(salaire['Majoration de nuit']) }}</td>
                <td>{{ formatCurrency(salaire['Majoration férié']) }}</td>
                <td>{{ formatCurrency(salaire['Indemnité congé']) }}</td>
                <td>{{ formatCurrency(salaire['Indemnité formation']) }}</td>
                <td>{{ formatCurrency(salaire['Prime de production']) }}</td>
                <td>{{ formatCurrency(salaire['Prime d\'assiduité']) }}</td>
                <td>{{ formatCurrency(salaire['Prime d\'ancienneté']) }}</td>
                <td>{{ formatCurrency(salaire['Prime élite']) }}</td>
                <td>{{ formatCurrency(salaire['Prime de responsabilité']) }}</td>
                <td>{{ formatCurrency(salaire['Indemnité repas']) }}</td>
                <td>{{ formatCurrency(salaire['Indemnité transport']) }}</td>
                <td class="brut-salary">{{ formatCurrency(salaire['Salaire brut']) }}</td>
                <td>{{ formatCurrency(salaire['Avance sur salaire']) }}</td>
                <td>{{ formatCurrency(salaire['OSTIE']) }}</td>
                <td>{{ formatCurrency(salaire['CNaPS']) }}</td>
                <td>{{ formatCurrency(salaire['Social']) }}</td>
                <td>{{ formatCurrency(salaire['IGR']) }}</td>
                <td class="net-salary">{{ formatCurrency(salaire['Reste à payer']) }}</td>
                <td class="sticky-col-action">
                  <button @click="editSalaire(salaire)" class="btn btn-sm btn-primary" title="Modifier les primes">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Message si pas de données -->
      <div v-else-if="!loading" class="card mt-4">
        <div class="card-body text-center">
          <p>Aucune donnée de salaire disponible.</p>
          <button @click="calculateSalaries" class="btn btn-primary">
            Calculer les salaires
          </button>
        </div>
      </div>

      <!-- Modal d'édition des primes -->
      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>Modifier les primes - {{ currentEditSalaire?.Nom }} {{ currentEditSalaire?.Prénom }}</h3>
            <button @click="closeModal" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveSalaire">
              <div class="form-grid">
                <div class="form-group">
                  <label>Prime de production:</label>
                  <input v-model="editForm.primeProduction" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Prime d'assiduité:</label>
                  <input v-model="editForm.primeAssiduite" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Prime d'ancienneté:</label>
                  <input v-model="editForm.primeAnciennete" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Prime élite:</label>
                  <input v-model="editForm.primeElite" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Prime de responsabilité:</label>
                  <input v-model="editForm.primeResponsabilite" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Avance sur salaire:</label>
                  <input v-model="editForm.avanceSalaire" type="number" class="form-input">
                </div>
                <div class="form-group">
                  <label>Social:</label>
                  <input v-model="editForm.social" type="number" class="form-input" value="15000">
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
                <button type="button" @click="closeModal" class="btn btn-secondary" :disabled="saving">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </PageModel>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useColarysStore } from '@/stores/colarys'
import PageModel from '@/components/organisms/PageModel.vue'

const colarysStore = useColarysStore()

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const joursTheoriques = ref('')
const joursUtilises = ref('')
const salairesCalcules = ref([])
const showEditModal = ref(false)
const currentEditSalaire = ref(null)
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const currentYear = new Date().getFullYear()

const months = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
]

const editForm = reactive({
  primeProduction: 0,
  primeAssiduite: 0,
  primeAnciennete: 0,
  primeElite: 0,
  primeResponsabilite: 0,
  avanceSalaire: 0,
  social: 15000
})

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 Ar'
  const num = typeof amount === 'string'
    ? parseFloat(amount.toString().replace(/\s/g, ''))
    : parseFloat(amount)
  if (isNaN(num)) return '0 Ar'
  return new Intl.NumberFormat('fr-FR').format(Math.round(num)) + ' Ar'
}

const calculerJoursAuto = () => {
  const year = selectedYear.value;
  const month = selectedMonth.value;

  try {
    const joursDansMois = new Date(year, month, 0).getDate();
    let joursOuvrables = 0;

    for (let jour = 1; jour <= joursDansMois; jour++) {
      const date = new Date(year, month - 1, jour);
      const jourSemaine = date.getDay();

      if (jourSemaine >= 1 && jourSemaine <= 5) {
        joursOuvrables++;
      }
    }

    joursTheoriques.value = Math.max(joursOuvrables, 1);
    console.log(`📅 Jours ouvrables calculés: ${joursTheoriques.value} jours`);

  } catch (error) {
    console.error('Erreur calcul jours auto:', error);
    const joursParDefaut = {
      1: 22, 2: 20, 3: 23, 4: 21, 5: 22, 6: 22,
      7: 21, 8: 23, 9: 21, 10: 22, 11: 22, 12: 20
    };
    joursTheoriques.value = joursParDefaut[month] || 22;
  }
}

const calculateSalaries = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  joursUtilises.value = ''

  try {
    console.log(`📊 Calcul salaires: ${selectedYear.value}/${selectedMonth.value}, jours: ${joursTheoriques.value || 'auto'}`)

    const jours = joursTheoriques.value ? parseInt(joursTheoriques.value) : undefined;

    const queryParams = jours ? `?joursTheoriques=${jours}` : ''
    const response = await fetch(
      `http://localhost:3000/api/colarys/salaires/calculate/${selectedYear.value}/${selectedMonth.value}${queryParams}`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      salairesCalcules.value = data.data || []
      if (data.metadata && data.metadata.joursUtilises) {
        joursUtilises.value = data.metadata.joursUtilises
      }
      successMessage.value = `Calcul réussi: ${salairesCalcules.value.length} salaires (${joursUtilises.value || 'auto'} jours)`
    } else {
      throw new Error(data.message || 'Erreur API')
    }

  } catch (error) {
    console.error('❌ Erreur calcul salaires:', error)
    errorMessage.value = `Erreur lors du calcul: ${error.message}`

    // Données simulées en secours avec la nouvelle logique
    salairesCalcules.value = getDonneesSimulees()
    successMessage.value = 'Affichage des données simulées (mode débogage)'
  } finally {
    loading.value = false
  }
}

const getDonneesSimulees = () => {
  const joursTravail = joursTheoriques.value || 22;
  const tauxHoraire = 300000 / (joursTravail * 8); // 1,704 Ar/h

  return [
    {
      Matricule: 'EMP001',
      Nom: 'DUPONT',
      Prénom: 'Jean',
      Compagne: 'Standard Téléphonique',
      'Salaire de base': 600000,
      'Taux horaire': Math.round(tauxHoraire),
      'Solde de congé': 15,
      'Heures de présence': 176,
      'Heures de congé': 0,
      'Heures férié majoré': 0,
      'Heures nuit majoré': 0,
      'Jours absence': 2,
      'Montant absence déduit': Math.round(2 * 8 * tauxHoraire),
      'Montant travaillé': 600000, // Salaire base fixe (pas affecté par les heures de présence)
      'Majoration de nuit': 0,
      'Majoration férié': 0,
      'Indemnité congé': 0,
      'Indemnité formation': 0,
      'Prime de production': 50000,
      'Prime d\'assiduité': 30000,
      'Prime d\'ancienneté': 15000,
      'Prime élite': 0,
      'Prime de responsabilité': 0,
      'Indemnité repas': 55000,
      'Indemnité transport': 26400,
      'Salaire brut': 476400,
      'Avance sur salaire': 0,
      'OSTIE': 4764,
      'CNaPS': 4764,
      'Social': 15000,
      'IGR': 2000,
      'Reste à payer': 449872,
      'Jours théoriques': joursTravail
    }
  ]
}

const calculAutoOnChange = () => {
  if (!joursTheoriques.value) {
    calculerJoursAuto()
  }
}

const editSalaire = (salaire) => {
  currentEditSalaire.value = salaire
  editForm.primeProduction = salaire['Prime de production'] || 0
  editForm.primeAssiduite = salaire['Prime d\'assiduité'] || 0
  editForm.primeAnciennete = salaire['Prime d\'ancienneté'] || 0
  editForm.primeElite = salaire['Prime élite'] || 0
  editForm.primeResponsabilite = salaire['Prime de responsabilité'] || 0
  editForm.avanceSalaire = salaire['Avance sur salaire'] || 0
  editForm.social = salaire['Social'] || 15000
  showEditModal.value = true
}

const saveSalaire = async () => {
  saving.value = true
  try {
    const salaireData = {
      "Prime de production": editForm.primeProduction,
      "Prime d'assiduité": editForm.primeAssiduite,
      "Prime d'ancienneté": editForm.primeAnciennete,
      "Prime élite": editForm.primeElite,
      "Prime de responsabilité": editForm.primeResponsabilite,
      "Avance sur salaire": editForm.avanceSalaire,
      "Social": editForm.social
    }

    const response = await fetch(
      `http://localhost:3000/api/colarys/salaires/${currentEditSalaire.value.Matricule}/${selectedYear.value}/${selectedMonth.value}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaireData)
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      successMessage.value = 'Salaire mis à jour avec succès'
    } else {
      throw new Error(data.message || 'Erreur lors de la mise à jour')
    }

    closeModal()
    await calculateSalaries()
  } catch (error) {
    console.error('Erreur sauvegarde salaire:', error)
    errorMessage.value = `Erreur lors de la sauvegarde: ${error.message}`
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showEditModal.value = false
  currentEditSalaire.value = null
  Object.keys(editForm).forEach(key => {
    if (key !== 'social') {
      editForm[key] = 0
    }
  })
  editForm.social = 15000
}

onMounted(() => {
  calculAutoOnChange()
})
</script>

<style scoped>
/* Styles pour le select et ses options */
.form-select {
  background: rgba(30, 60, 114, 0.95) !important;
  color: #f0f0f5 !important;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23ffc107' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>") !important;
  background-repeat: no-repeat !important;
  background-position: right 15px center !important;
  background-size: 12px !important;
}

/* Style des options dans la liste déroulante */
.form-select option {
  background: rgba(30, 60, 114, 0.98) !important;
  color: #f0f0f5 !important;
  padding: 12px 15px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Style au survol des options */
.form-select option:hover {
  background: rgba(255, 193, 7, 0.3) !important;
  color: #ffc107 !important;
}

/* Style de l'option sélectionnée */
.form-select option:checked {
  background: rgba(255, 193, 7, 0.2) !important;
  color: #ffc107 !important;
}

/* Pour Firefox */
@-moz-document url-prefix() {
  .form-select {
    color: #f0f0f5 !important;
    text-shadow: 0 0 0 #f0f0f5 !important;
  }

  .form-select option {
    background: rgba(30, 60, 114, 0.98) !important;
    color: #f0f0f5 !important;
  }
}

/* Pour Webkit (Chrome, Safari) */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .form-select option {
    background: rgba(30, 60, 114, 0.98) !important;
    color: #f0f0f5 !important;
  }
}

/* Style quand le select est ouvert */
.form-select:focus {
  background: rgba(30, 60, 114, 0.98) !important;
  color: #f0f0f5 !important;
}

.colarys-salaries {
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

.controls {
  display: flex;
  gap: 15px;
  align-items: end;
  flex-wrap: wrap;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 700;
  font-size: 14px;
  color: #f0f0f5;
}

.form-select,
.form-input {
  padding: 12px 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  font-weight: 500;
  min-width: 140px;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #ffc107;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
  background: rgba(2, 0, 15, 0.15);
}

.jours-input-group {
  display: flex;
  gap: 8px;
}

.jours-input-group .form-input {
  flex: 1;
}

.jours-input-group .btn {
  padding: 8px 12px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #f0f0f5;
}

.jours-input-group .btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.hint {
  color: #ccc;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

.info-badge {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  padding: 10px 15px;
  border-radius: 6px;
  margin: 10px auto;
  text-align: center;
  font-weight: 600;
  max-width: 1200px;
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

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-1px);
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
}

.table {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  color: #f0f0f5;
  margin-bottom: 0;
}

.table th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 700;
  text-align: center;
  padding: 15px 10px;
  white-space: nowrap;
}

.table td {
  background: rgba(255, 255, 255, 0.05);
  color: #f0f0f5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
  text-align: center;
  padding: 12px 8px;
  vertical-align: middle;
}

.net-salary {
  font-weight: 700;
  color: #ffc107;
  background: rgba(40, 167, 69, 0.2) !important;
}

/* MODALES */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(30, 60, 114, 0.3);
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #ffc107;
  font-weight: 700;
  font-size: 1.3rem;
}

.modal-body {
  padding: 25px;
  background: transparent;
  color: #f0f0f5;
}

/* FORMULAIRES DANS MODALES */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #f0f0f5;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  font-weight: 500;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #ffc107;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 25px;
  margin-top: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #f0f0f5;
  opacity: 0.8;
  transition: opacity 0.2s;
  font-weight: bold;
}

.btn-close:hover {
  opacity: 1;
  color: #ffc107;
}

/* Style pour les lignes de tableau au survol */
.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    padding: 15px;
  }

  .control-group {
    width: 100%;
  }

  .form-select,
  .form-input {
    min-width: auto;
    width: 100%;
  }

  .table {
    font-size: 0.75rem;
  }

  .table th,
  .table td {
    padding: 8px 4px;
  }

  .modal-content {
    width: 95%;
    margin: 5px;
  }

  .modal-body {
    padding: 20px 15px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

/* Styles pour les colonnes fixes lors du scroll */
.table-responsive {
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 70vh;
  position: relative;
}

/* Colonnes fixes */
.sticky-col {
  position: sticky;
  background: inherit;
  z-index: 10;
}

.sticky-col-first {
  left: 0;
  background: rgba(255, 255, 255, 0.12) !important;
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  min-width: 60px;
  font-weight: 700;
  color: #ffc107 !important;
}

.sticky-col-second {
  left: 60px; /* Largeur de la première colonne */
  background: rgba(255, 255, 255, 0.1) !important;
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  min-width: 100px;
}

.sticky-col-action {
  position: sticky;
  right: 0;
  background: rgba(255, 255, 255, 0.12) !important;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  min-width: 80px;
  z-index: 10;
}

/* Assurer que les en-têtes fixes ont le bon fond */
.table th.sticky-col-first,
.table th.sticky-col-second,
.table th.sticky-col-action {
  background: rgba(255, 255, 255, 0.15) !important;
  z-index: 20; /* Plus élevé que les cellules */
}

/* Style pour la numérotation */
.sticky-col-first {
  text-align: center;
  font-weight: bold;
}

/* Amélioration du style du tableau */
.table th {
  position: sticky;
  top: 0;
  z-index: 15;
  white-space: nowrap;
  min-width: 120px;
}

.table td {
  white-space: nowrap;
  min-width: 120px;
}

/* Styles spécifiques pour certaines colonnes */
.base-salary, .brut-salary, .net-salary {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05) !important;
}

.absence-days, .deduction {
  color: #ff6b6b;
  font-weight: 500;
}

/* Effet de survol avec prise en compte des colonnes fixes */
.table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.08) !important;
}

.table tbody tr:hover .sticky-col-first {
  background: rgba(255, 193, 7, 0.3) !important;
}

.table tbody tr:hover .sticky-col-second {
  background: rgba(255, 255, 255, 0.15) !important;
}

.table tbody tr:hover .sticky-col-action {
  background: rgba(255, 255, 255, 0.15) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .sticky-col-first {
    left: 0;
    min-width: 50px;
  }
  
  .sticky-col-second {
    left: 50px;
    min-width: 80px;
  }
  
  .sticky-col-action {
    min-width: 60px;
  }
  
  .table th,
  .table td {
    min-width: 100px;
    font-size: 0.75rem;
    padding: 8px 6px;
  }
}

/* Amélioration de la visibilité lors du scroll */
.table-responsive::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}

.table-responsive::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: rgba(255, 193, 7, 0.5);
  border-radius: 6px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 193, 7, 0.7);
}
</style>