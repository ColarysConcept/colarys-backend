<template>
  <PageModel>
    <div class="colarys-payslip">
      <h1>Génération des Fiches de Paie Colarys</h1>

      <div class="controls">
        <div class="control-group">
          <label>Mois:</label>
          <select v-model="selectedMonth" class="form-select">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label>Année:</label>
          <input v-model="selectedYear" type="number" class="form-input" min="2020" :max="currentYear">
        </div>

        <button @click="generatePayslips" class="btn btn-primary" :disabled="loading">
          <i class="fas fa-file-pdf"></i>
          <span v-if="loading">Calcul en cours...</span>
          <span v-else>Générer les Fiches</span>
        </button>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
        <strong>Erreur :</strong> {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <div v-if="successMessage" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''"></button>
      </div>

      <!-- Sélection pour aperçu -->
      <div v-if="calculatedSalaires.length > 0" class="employee-selection mt-3">
        <div class="control-group">
          <label for="employee-select">Sélectionner un employé pour l'aperçu :</label>
          <select id="employee-select" v-model="selectedPreviewEmployee" class="form-select" @change="updatePreview">
            <option value="">-- Sélectionner un employé --</option>
            <option v-for="salaire in calculatedSalaires" :key="salaire.Matricule" :value="salaire.Matricule">
              {{ salaire.Matricule }} - {{ salaire.Prénom }} {{ salaire.Nom }}
            </option>
          </select>
        </div>
      </div>

      <!-- Sélection des employés pour PDF -->
      <div v-if="employees.length > 0" class="selection-section mt-4">
        <h3>Sélection des employés pour l'export PDF</h3>
        <div class="selection-grid">
          <div v-for="employee in employees" :key="employee.Matricule" class="employee-checkbox">
            <input type="checkbox" :id="`emp-${employee.Matricule}`" :value="employee.Matricule"
              v-model="selectedEmployees" class="form-check-input">
            <label :for="`emp-${employee.Matricule}`" class="form-check-label">
              {{ employee.Matricule }} - {{ employee.Prénom }} {{ employee.Nom }}
            </label>
          </div>
        </div>
        <div class="selection-actions mt-2">
          <button @click="selectAll" class="btn btn-sm btn-outline-primary">Tout sélectionner</button>
          <button @click="deselectAll" class="btn btn-sm btn-outline-secondary ms-2">Tout désélectionner</button>
        </div>
      </div>

      <!-- Aperçu format PDF -->
      <div class="preview-section mt-4" v-if="previewData && calculatedSalaires.length > 0">
        <h3>Aperçu Fiche de Paie - {{ previewData.employee?.Prénom }} {{ previewData.employee?.Nom }}</h3>
        <div class="preview-card pdf-format" ref="payslipPreview">
          <div class="pdf-header">
            <h1>COLARYS CONCEPT</h1>
          </div>

          <div class="pdf-employee-info">
            <div class="pdf-info-grid-two-columns">
              <div class="pdf-info-column">
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Nom:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Nom }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Prénom:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Prénom }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Matricule:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Matricule }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Fonction:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Fonction || '' }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Mode de paiement:</strong></span>
                  <span class="pdf-value">{{ previewData.employee['Mode de paiement'] || '' }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Salaire de base:</strong></span>
                  <span class="pdf-value">{{ formatCurrency(previewData.employee['Salaire de base']) }}</span>
                </div>
              </div>

              <div class="pdf-info-column">
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Mois:</strong></span>
                  <span class="pdf-value">{{ getMonthName(selectedMonth) }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Catégorie:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Catégorie || 'HC' }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Congé disponible:</strong></span>
                  <span class="pdf-value">{{ previewData.employee['Solde de congé'] || '0.0' }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Compagne:</strong></span>
                  <span class="pdf-value">{{ previewData.employee.Compagne || 'standard téléphonique' }}</span>
                </div>
                <div class="pdf-info-row">
                  <span class="pdf-label"><strong>Année:</strong></span>
                  <span class="pdf-value">{{ selectedYear }}</span>
                </div>
              </div>
            </div>
          </div>

          <hr class="pdf-separator">

          <div class="pdf-table-container">
            <table class="pdf-salary-table">
              <thead>
                <tr>
                  <th class="text-left">DÉTAIL DES RUBRIQUES</th>
                  <th class="text-center">Présent</th>
                  <th class="text-center">Bases</th>
                  <th class="text-center">TAUX</th>
                  <th class="text-center">BRUT</th>
                  <th class="text-center">BASE</th>
                  <th class="text-center">Retenues</th>
                  <th class="text-center">Reste à payer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in FICHE_ROWS" :key="index">
                  <td class="rubrique text-left">{{ row }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'present') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'bases') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'taux') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'brut') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'base') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'retenues') }}</td>
                  <td class="text-center">{{ getPdfCellValue(row, 'reste') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pdf-signatures">
            <div class="pdf-signature-col">
              <div class="pdf-signature-line"><strong>EMPLOYEUR</strong></div>
              <div class="pdf-signature-name">COLLARD Mialy Rinah</div>
            </div>
            <div class="pdf-signature-col">
              <div class="pdf-signature-line"><strong>SALARIÉ</strong></div>
              <div class="pdf-signature-name">{{ previewData.employee.Nom }} {{ previewData.employee.Prénom }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions de téléchargement -->
      <!-- Actions de téléchargement -->
      <div class="actions mt-4">
        <button @click="downloadSelected" class="btn btn-success"
          :disabled="selectedEmployees.length === 0 || !calculatedSalaires.length || downloading"
          @mouseover="console.log('Bouton sélectionné - disabled:', selectedEmployees.length === 0 || !calculatedSalaires.length || downloading)">
          <i class="fas fa-download"></i>
          <span v-if="downloading">Téléchargement...</span>
          <span v-else>
            Télécharger les Fiches Sélectionnées
            <span v-if="selectedEmployees.length > 0">({{ selectedEmployees.length }})</span>
          </span>
        </button>

        <button @click="downloadAll" class="btn btn-info ms-2" :disabled="!calculatedSalaires.length || downloading"
          @mouseover="console.log('Bouton tous - disabled:', !calculatedSalaires.length || downloading)">
          <i class="fas fa-download"></i>
          <span v-if="downloading">Téléchargement...</span>
          <span v-else>Télécharger Toutes les Fiches</span>
        </button>
      </div>

      <!-- Ajoutez ce panneau de debug en développement -->
      <div v-if="false" class="debug-panel mt-3 p-3 bg-dark text-white">
        <h4>Debug Info</h4>
        <p>calculatedSalaires: {{ calculatedSalaires.length }}</p>
        <p>selectedEmployees: {{ selectedEmployees.length }}</p>
        <p>downloading: {{ downloading }}</p>
        <p>loading: {{ loading }}</p>
      </div>
    </div>
  </PageModel>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useColarysStore } from '@/stores/colarys'
import PageModel from '@/components/organisms/PageModel.vue'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const colarysStore = useColarysStore()
const { employees } = colarysStore

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const selectedEmployees = ref([])
const previewData = ref(null)
const calculatedSalaires = ref([])
const loading = ref(false)
const downloading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const payslipPreview = ref(null)
const selectedPreviewEmployee = ref('')

const FICHE_ROWS = [
  "salaire de base",
  "Prime de responsabilité",
  "Prime assiduité",
  "prime d'ancienneté",
  "Prime production",
  "Avance sur salaire",
  "Prime Elité",
  "indemnité de congé",
  "Indemnité IRSA",
  "cnaps 1%",
  "ostie 1%",
  "IRSA 1ere tranche",
  "IRSA 2eme tranche",
  "IRSA 3eme tranche",
  "IRSA 4eme tranche",
  "IRSA 5eme tranche",
  "IRSA à payer",
  "Majoration de nuit",
  "Majoration férié",
  "Indemnité de rep",
  "Indemnité de trans",
  "Social",
  "B1",
  "S1",
  "Salaire net à payer"
]

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

// Fonctions utilitaires
const getMonthName = (month) => {
  return months.find(m => m.value === month)?.label || ''
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0'
  const num = typeof amount === 'string'
    ? parseFloat(amount.toString().replace(/\s/g, '').replace(',', '.'))
    : parseFloat(amount)
  if (isNaN(num)) return '0'
  return Math.round(num).toString()
}

// Mise à jour de l'aperçu
const updatePreview = () => {
  if (!selectedPreviewEmployee.value || calculatedSalaires.value.length === 0) return

  const employee = calculatedSalaires.value.find(emp => emp.Matricule === selectedPreviewEmployee.value)
  if (employee) {
    const heuresPresence = employee['Heures de présence'] || 0
    const heuresConge = employee['Heures de congé'] || 0
    const heuresNuit = employee['Heures nuit majoré'] || 0
    const heuresFerie = employee['Heures férié majoré'] || 0
    const tauxHoraire = employee['Taux horaire'] || 0
    const joursPresence = Math.round(heuresPresence / 8)

    previewData.value = {
      employee: {
        ...employee,
        'Salaire de base': employee['Salaire de base'] || 0,
        'Solde de congé': employee['Solde de congé'] || 0,
        Fonction: employee.Fonction || '',
        'Mode de paiement': employee['Mode de paiement'] || '',
        Catégorie: employee.Catégorie || 'HC',
        Compagne: employee.Compagne || 'standard téléphonique'
      },
      calculs: {
        heuresPresence: heuresPresence,
        heuresConge: heuresConge,
        heuresNuit: heuresNuit,
        heuresFerie: heuresFerie,
        joursPresence: joursPresence,
        tauxHoraire: tauxHoraire,
        tauxMajNuit: tauxHoraire * 0.3,
        tauxMajFerie: tauxHoraire,
        montantTravaille: employee['Montant travaillé'] || 0,
        majNuit: employee['Majoration de nuit'] || 0,
        majFerie: employee['Majoration férié'] || 0,
        indemniteConge: employee['Indemnité congé'] || 0,
        primeProduction: employee['Prime de production'] || 0,
        primeAssiduite: employee['Prime d\'assiduité'] || 0,
        primeAnciennete: employee['Prime d\'ancienneté'] || 0,
        primeResponsabilite: employee['Prime de responsabilité'] || 0,
        primeElite: employee['Prime élite'] || 0,
        indemniteRepas: employee['Indemnité repas'] || 0,
        indemniteTransport: employee['Indemnité transport'] || 0,
        avance: employee['Avance sur salaire'] || 0,
        ostie: employee['OSTIE'] || 0,
        cnaps: employee['CNaPS'] || 0,
        social: employee['Social'] || 15000,
        igr: employee['IGR'] || 0,
        totalBrut: employee['Salaire brut'] || 0,
        totalRetenues: (employee['Avance sur salaire'] || 0) +
          (employee['OSTIE'] || 0) +
          (employee['CNaPS'] || 0) +
          (employee['Social'] || 0) +
          (employee['IGR'] || 0),
        salaireNet: employee['Reste à payer'] || 0,
        tranche1: employee['1ère tranche (0%)'] || 0,
        tranche2: employee['2ème tranche (5%)'] || 0,
        tranche3: employee['3ème tranche (10%)'] || 0,
        tranche4: employee['4ème tranche (15%)'] || 0,
        tranche5: employee['5ème tranche (20%)'] || 0,
        rep1: employee['Rep1'] || 0,
        rep2: employee['Rep2'] || 0,
        rep3: employee['Rep3'] || 0,
        rep4: employee['Rep4'] || 0,
        rep5: employee['Rep5'] || 0
      }
    }
  }
}

const getPdfCellValue = (rubrique, column) => {
  if (!previewData.value?.employee || !previewData.value?.calculs) return ''

  const calculs = previewData.value.calculs
  const rubriqueNormalisee = rubrique.toLowerCase().trim()

  switch (rubriqueNormalisee) {
    case "salaire de base":
      if (column === 'present') return calculs.heuresPresence?.toString() || '0'
      if (column === 'taux') return formatCurrency(calculs.tauxHoraire || 0)
      if (column === 'brut') return formatCurrency(calculs.montantTravaille || 0)
      return '0'

    case "prime de responsabilité":
      if (column === 'brut') return formatCurrency(calculs.primeResponsabilite || 0)
      return '0'

    case "prime assiduité":
      if (column === 'brut') return formatCurrency(calculs.primeAssiduite || 0)
      return '0'

    case "prime d'ancienneté":
      if (column === 'brut') return formatCurrency(calculs.primeAnciennete || 0)
      return '0'

    case "prime production":
      if (column === 'brut') return formatCurrency(calculs.primeProduction || 0)
      return '0'

    case "avance sur salaire":
      if (column === 'retenues') return formatCurrency(calculs.avance || 0)
      return '0'

    case "prime élite":
      if (column === 'brut') return formatCurrency(calculs.primeElite || 0)
      return '0'

    case "indemnité de congé":
      if (column === 'present') return calculs.heuresConge?.toString() || '0'
      if (column === 'taux') return formatCurrency(calculs.tauxHoraire || 0)
      if (column === 'brut') return formatCurrency(calculs.indemniteConge || 0)
      return '0'

    case "indemnité irsa":
      if (column === 'brut') return formatCurrency(calculs.igr || 0)
      return '0'

    case "cnaps 1%":
      if (column === 'retenues') return formatCurrency(calculs.cnaps || 0)
      return '0'

    case "ostie 1%":
      if (column === 'retenues') return formatCurrency(calculs.ostie || 0)
      return '0'

    case "irsa 1ere tranche":
      if (column === 'bases') return formatCurrency(calculs.tranche1 || 0)
      if (column === 'taux') return '0%'
      if (column === 'retenues') return formatCurrency(calculs.rep1 || 0)
      return '0'

    case "irsa 2eme tranche":
      if (column === 'bases') return formatCurrency(calculs.tranche2 || 0)
      if (column === 'taux') return '5%'
      if (column === 'retenues') return formatCurrency(calculs.rep2 || 0)
      return '0'

    case "irsa 3eme tranche":
      if (column === 'bases') return formatCurrency(calculs.tranche3 || 0)
      if (column === 'taux') return '10%'
      if (column === 'retenues') return formatCurrency(calculs.rep3 || 0)
      return '0'

    case "irsa 4eme tranche":
      if (column === 'bases') return formatCurrency(calculs.tranche4 || 0)
      if (column === 'taux') return '15%'
      if (column === 'retenues') return formatCurrency(calculs.rep4 || 0)
      return '0'

    case "irsa 5eme tranche":
      if (column === 'bases') return formatCurrency(calculs.tranche5 || 0)
      if (column === 'taux') return '20%'
      if (column === 'retenues') return formatCurrency(calculs.rep5 || 0)
      return '0'

    case "irsa à payer":
      if (column === 'retenues') return formatCurrency(calculs.igr || 0)
      return '0'

    case "majoration de nuit":
      if (column === 'present') return calculs.heuresNuit?.toString() || '0'
      if (column === 'bases') return '30%'
      if (column === 'taux') return formatCurrency(calculs.tauxMajNuit || 0)
      if (column === 'brut') return formatCurrency(calculs.majNuit || 0)
      return '0'

    case "majoration férié":
      if (column === 'present') return calculs.heuresFerie?.toString() || '0'
      if (column === 'bases') return '100%'
      if (column === 'taux') return formatCurrency(calculs.tauxMajFerie || 0)
      if (column === 'brut') return formatCurrency(calculs.majFerie || 0)
      return '0'

    case "indemnité de rep":
      if (column === 'present') return calculs.joursPresence?.toString() || '0'
      if (column === 'taux') return '2500'
      if (column === 'brut') return formatCurrency(calculs.indemniteRepas || 0)
      return '0'

    case "indemnité de trans":
      if (column === 'present') return calculs.joursPresence?.toString() || '0'
      if (column === 'taux') return '1200'
      if (column === 'brut') return formatCurrency(calculs.indemniteTransport || 0)
      return '0'

    case "social":
      if (column === 'retenues') return formatCurrency(calculs.social || 0)
      return '0'

    case "b1":
      if (column === 'brut') return formatCurrency(calculs.totalBrut || 0)
      return '0'

    case "s1":
      if (column === 'retenues') return formatCurrency(calculs.totalRetenues || 0)
      return '0'

    case "salaire net à payer":
      if (column === 'reste') return formatCurrency(calculs.salaireNet || 0) + ' Ar'
      return '0'

    default:
      return '0'
  }
}

// Dans ColarysPayslip.vue - améliorer generatePayslips
const generatePayslips = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    console.log(`📊 Génération des fiches de paie pour ${selectedMonth.value}/${selectedYear.value}`);

    // 🔥 CORRECTION : Appel direct à l'API comme dans Salaries
    const response = await fetch(
      `http://localhost:3000/api/colarys/salaires/calculate/${selectedYear.value}/${selectedMonth.value}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      calculatedSalaires.value = data.data || [];
      
      if (calculatedSalaires.value.length > 0) {
        selectedPreviewEmployee.value = calculatedSalaires.value[0].Matricule;
        updatePreview();
        
        // 🔥 CORRECTION : Sélection automatique de tous les employés
        selectedEmployees.value = calculatedSalaires.value.map(emp => emp.Matricule);
        
        successMessage.value = `Génération terminée pour ${calculatedSalaires.value.length} employé(s) - ${data.metadata?.joursUtilises || 'auto'} jours`;
      } else {
        errorMessage.value = 'Aucune fiche générée.';
      }
    } else {
      throw new Error(data.message || 'Erreur API');
    }
  } catch (error) {
    console.error('❌ Erreur génération fiches:', error);
    errorMessage.value = 'Erreur lors de la génération des fiches: ' + (error.message || 'Erreur inconnue');
  } finally {
    loading.value = false;
  }
}

const selectAll = () => {
  selectedEmployees.value = employees.map(emp => emp.Matricule)
}

const deselectAll = () => {
  selectedEmployees.value = []
}

// FONCTION GÉNÉRATEUR DE CONTENU PDF - ESPACEMENT CORRIGÉ
const generatePDFContent = (salaire) => {
  const getCellValue = (rubrique, column) => {
    if (typeof rubrique !== 'string') return '0'
    
    const rubriqueNormalisee = rubrique.toLowerCase().trim()

    switch (rubriqueNormalisee) {
      case "salaire de base":
        if (column === 'present') return (salaire['Heures de présence'] || 0).toString()
        if (column === 'taux') return formatCurrency(salaire['Taux horaire'] || 0)
        if (column === 'brut') return formatCurrency(salaire['Montant travaillé'] || 0)
        return '0'

      case "prime de responsabilité":
        if (column === 'brut') return formatCurrency(salaire['Prime de responsabilité'] || 0)
        return '0'

      case "prime assiduité":
        if (column === 'brut') return formatCurrency(salaire['Prime d\'assiduité'] || 0)
        return '0'

      case "prime d'ancienneté":
        if (column === 'brut') return formatCurrency(salaire['Prime d\'ancienneté'] || 0)
        return '0'

      case "prime production":
        if (column === 'brut') return formatCurrency(salaire['Prime de production'] || 0)
        return '0'

      case "avance sur salaire":
        if (column === 'retenues') return formatCurrency(salaire['Avance sur salaire'] || 0)
        return '0'

      case "prime élite":
        if (column === 'brut') return formatCurrency(salaire['Prime élite'] || 0)
        return '0'

      case "indemnité de congé":
        if (column === 'present') return (salaire['Heures de congé'] || 0).toString()
        if (column === 'taux') return formatCurrency(salaire['Taux horaire'] || 0)
        if (column === 'brut') return formatCurrency(salaire['Indemnité congé'] || 0)
        return '0'

      case "indemnité irsa":
        if (column === 'brut') return formatCurrency(salaire['IGR'] || 0)
        return '0'

      case "cnaps 1%":
        if (column === 'retenues') return formatCurrency(salaire['CNaPS'] || 0)
        return '0'

      case "ostie 1%":
        if (column === 'retenues') return formatCurrency(salaire['OSTIE'] || 0)
        return '0'

      case "irsa 1ere tranche":
        if (column === 'bases') return formatCurrency(salaire['1ère tranche (0%)'] || 0)
        if (column === 'taux') return '0%'
        if (column === 'retenues') return formatCurrency(salaire['Rep1'] || 0)
        return '0'

      case "irsa 2eme tranche":
        if (column === 'bases') return formatCurrency(salaire['2ème tranche (5%)'] || 0)
        if (column === 'taux') return '5%'
        if (column === 'retenues') return formatCurrency(salaire['Rep2'] || 0)
        return '0'

      case "irsa 3eme tranche":
        if (column === 'bases') return formatCurrency(salaire['3ème tranche (10%)'] || 0)
        if (column === 'taux') return '10%'
        if (column === 'retenues') return formatCurrency(salaire['Rep3'] || 0)
        return '0'

      case "irsa 4eme tranche":
        if (column === 'bases') return formatCurrency(salaire['4ème tranche (15%)'] || 0)
        if (column === 'taux') return '15%'
        if (column === 'retenues') return formatCurrency(salaire['Rep4'] || 0)
        return '0'

      case "irsa 5eme tranche":
        if (column === 'bases') return formatCurrency(salaire['5ème tranche (20%)'] || 0)
        if (column === 'taux') return '20%'
        if (column === 'retenues') return formatCurrency(salaire['Rep5'] || 0)
        return '0'

      case "irsa à payer":
        if (column === 'retenues') return formatCurrency(salaire['IGR'] || 0)
        return '0'

      case "majoration de nuit":
        if (column === 'present') return (salaire['Heures nuit majoré'] || 0).toString()
        if (column === 'bases') return '30%'
        if (column === 'taux') return formatCurrency((salaire['Taux horaire'] || 0) * 0.3)
        if (column === 'brut') return formatCurrency(salaire['Majoration de nuit'] || 0)
        return '0'

      case "majoration férié":
        if (column === 'present') return (salaire['Heures férié majoré'] || 0).toString()
        if (column === 'bases') return '100%'
        if (column === 'taux') return formatCurrency(salaire['Taux horaire'] || 0)
        if (column === 'brut') return formatCurrency(salaire['Majoration férié'] || 0)
        return '0'

      case "indemnité de rep":
        if (column === 'present') return Math.round((salaire['Heures de présence'] || 0) / 8).toString()
        if (column === 'taux') return '2500'
        if (column === 'brut') return formatCurrency(salaire['Indemnité repas'] || 0)
        return '0'

      case "indemnité de trans":
        if (column === 'present') return Math.round((salaire['Heures de présence'] || 0) / 8).toString()
        if (column === 'taux') return '1200'
        if (column === 'brut') return formatCurrency(salaire['Indemnité transport'] || 0)
        return '0'

      case "social":
        if (column === 'retenues') return formatCurrency(salaire['Social'] || 15000)
        return '0'

      case "b1":
        if (column === 'brut') return formatCurrency(salaire['Salaire brut'] || 0)
        return '0'

      case "s1":
        if (column === 'retenues') {
          const total = (salaire['Avance sur salaire'] || 0) +
            (salaire['OSTIE'] || 0) +
            (salaire['CNaPS'] || 0) +
            (salaire['Social'] || 0) +
            (salaire['IGR'] || 0)
          return formatCurrency(total)
        }
        return '0'

      case "salaire net à payer":
        if (column === 'reste') {
          const salaireNet = salaire['Reste à payer'] || 0
          return formatCurrency(salaireNet) + ' Ar'
        }
        return '0'

      default:
        return '0'
    }
  }

  return `
    <div style="
      font-family: Arial, sans-serif; 
      padding: 10mm 15mm;
      background: white; 
      color: black; 
      width: 210mm; 
      min-height: 297mm; 
      box-sizing: border-box;
      margin: 0;
      position: relative;
    ">
      <!-- En-tête -->
      <div style="text-align: center; margin-bottom: 4mm; border-bottom: 2px solid #000; padding-bottom: 2mm;">
        <h1 style="margin: 0; font-size: 16pt; font-weight: bold;">COLARYS CONCEPT</h1>
      </div>

      <!-- Informations employé - ESPACE RÉDUIT -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 4mm; font-size: 9pt;">
        <div style="width: 48%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Nom:</strong> <span>${salaire.Nom || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Prénom:</strong> <span>${salaire.Prénom || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Matricule:</strong> <span>${salaire.Matricule || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Fonction:</strong> <span>${salaire.Fonction || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Mode de paiement:</strong> <span>${salaire['Mode de paiement'] || ''}</span>
          </div>
        </div>
        
        <div style="width: 48%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Mois:</strong> <span>${getMonthName(selectedMonth.value)} ${selectedYear.value}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Catégorie:</strong> <span>${salaire.Catégorie || 'HC'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Congé disponible:</strong> <span>${salaire['Solde de congé'] || '0.0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Compagne:</strong> <span>${salaire.Compagne || 'standard téléphonique'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
            <strong>Année:</strong> <span>${selectedYear.value}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 9pt;">
        <strong>Salaire de base:</strong> <span>${formatCurrency(salaire['Salaire de base'] || 0)} Ar</span>
      </div>

      <hr style="border: 1px solid #000; margin: 2mm 0 3mm 0;">

      <!-- Tableau des rubriques - COMPACT -->
      <div style="margin-bottom: 2mm;"> <!-- RÉDUIT de 8mm à 2mm -->
        <table style="width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: left; background: #f0f0f0; font-weight: bold; width: 35mm;">DÉTAIL DES RUBRIQUES</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 10mm;">Présent</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 8mm;">Bases</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 10mm;">TAUX</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 12mm;">BRUT</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 10mm;">BASE</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 12mm;">Retenues</th>
              <th style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right; background: #f0f0f0; font-weight: bold; width: 15mm;">Reste à payer</th>
            </tr>
          </thead>
          <tbody>
            ${FICHE_ROWS.map(row => {
              const rowString = String(row || '')
              const present = getCellValue(rowString, 'present')
              const bases = getCellValue(rowString, 'bases')
              const taux = getCellValue(rowString, 'taux')
              const brut = getCellValue(rowString, 'brut')
              const base = getCellValue(rowString, 'base')
              const retenues = getCellValue(rowString, 'retenues')
              const reste = getCellValue(rowString, 'reste')

              return `
                <tr>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: left; font-weight: bold;">${rowString}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${present}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${bases}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${taux}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${brut}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${base}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${retenues}</td>
                  <td style="border: 1px solid #000; padding: 1mm 0.5mm; text-align: right;">${reste}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
      <br>
      <br>

      <!-- Signatures - RAPPROCHÉES DU TABLEAU -->
      <div style="
        display: flex; 
        justify-content: space-between; 
        margin-top: 5mm;  <!-- RÉDUIT de 15mm à 5mm -->
        position: absolute;
        bottom: 15mm;
        left: 15mm;
        right: 15mm;
        font-size: 9pt;
      ">
          

        <div style="text-align: center; width: 45%;">
          <div style="margin-bottom: 6mm; font-weight: bold; text-decoration: underline;">EMPLOYEUR</div>
          <br>
          <br>
          <div style="border-top: 1px solid #000; padding-top: 1mm;">COLLARD Mialy Rinah</div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="margin-bottom: 6mm; font-weight: bold; text-decoration: underline;">SALARIÉ</div>
            <br>
            <br>
          <div style="border-top: 1px solid #000; padding-top: 1mm;">${salaire.Nom} ${salaire.Prénom}</div>
        </div>
      </div>
    </div>
  `
}
// CORRECTION COMPLÈTE DU TÉLÉCHARGEMENT
// CORRECTION COMPLÈTE DU TÉLÉCHARGEMENT
const downloadPDF = async (salairesToDownload, filename) => {
  downloading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('🚀 Début du téléchargement PDF...', salairesToDownload.length, 'employés')

    // Vérifier que jsPDF est disponible
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF n\'est pas chargé correctement')
    }

    const pdf = new jsPDF('p', 'mm', 'a4')

    for (let i = 0; i < salairesToDownload.length; i++) {
      const salaire = salairesToDownload[i]
      console.log(`📝 Génération fiche ${i + 1}/${salairesToDownload.length}: ${salaire.Nom} ${salaire.Prénom}`)

      try {
        // Générer le contenu HTML
        const htmlContent = generatePDFContent(salaire)

        if (!htmlContent || htmlContent.trim() === '') {
          console.error('❌ Contenu HTML vide pour', salaire.Matricule)
          continue
        }

        // Créer l'élément temporaire
        const tempElement = document.createElement('div')
        tempElement.style.width = '210mm'
        tempElement.style.minHeight = '297mm'
        tempElement.style.background = 'white'
        tempElement.style.color = 'black'
        tempElement.style.fontFamily = 'Arial, sans-serif'
        tempElement.style.position = 'fixed'
        tempElement.style.left = '0'
        tempElement.style.top = '0'
        tempElement.style.zIndex = '9999'
        tempElement.style.visibility = 'visible'
        tempElement.style.opacity = '1'
        tempElement.innerHTML = htmlContent

        document.body.appendChild(tempElement)
        console.log('✅ Élément temporaire ajouté au DOM')

        // Attendre le rendu
        await new Promise(resolve => {
          setTimeout(resolve, 500)
          // Forcer le rendu
          requestAnimationFrame(() => {
            tempElement.offsetHeight // Force reflow
            resolve()
          })
        })

        console.log('🔄 Conversion en canvas...')

        // Conversion avec paramètres optimisés
        const canvas = await html2canvas(tempElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: true,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc) => {
            console.log('📋 Clonage du document...')
            const div = clonedDoc.querySelector('div')
            if (div) {
              div.style.visibility = 'visible'
              div.style.opacity = '1'
            }
          }
        })

        console.log('✅ Canvas généré, dimensions:', canvas.width, 'x', canvas.height)

        // Nettoyer l'élément temporaire
        if (tempElement.parentNode) {
          document.body.removeChild(tempElement)
          console.log('🗑️ Élément temporaire supprimé')
        }

        const imgData = canvas.toDataURL('image/png')
        console.log('🖼️ Image data URL générée')

        const imgWidth = 210
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Ajouter une page si nécessaire
        if (i > 0) {
          pdf.addPage()
          console.log('📄 Nouvelle page ajoutée')
        }

        // Ajouter l'image au PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST')
        console.log(`✅ Page ${i + 1} ajoutée au PDF`)

      } catch (employeeError) {
        console.error(`❌ Erreur avec l'employé ${salaire.Matricule}:`, employeeError)
        // Continuer avec l'employé suivant
        continue
      }
    }

    // Vérifier si des pages ont été ajoutées
    const pageCount = pdf.internal.getNumberOfPages()
    console.log(`📊 Nombre total de pages: ${pageCount}`)

    if (pageCount === 0) {
      throw new Error('Aucune page n\'a été générée dans le PDF')
    }

    // Télécharger le PDF
    console.log('💾 Sauvegarde du PDF...')
    pdf.save(`${filename}.pdf`)

    successMessage.value = `✅ PDF généré avec succès! ${salairesToDownload.length} fiche(s) de paie téléchargée(s)`
    console.log('🎉 Téléchargement terminé avec succès!')

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE lors du téléchargement:', error)
    errorMessage.value = `Erreur lors du téléchargement: ${error.message}`

    // Fallback vers une méthode alternative
    await downloadSimplePDF(salairesToDownload, filename)
  } finally {
    downloading.value = false
    console.log('🏁 Processus de téléchargement terminé')
  }
}

// FONCTION DE FALLBACK SIMPLE
const downloadSimplePDF = async (salairesToDownload, filename) => {
  try {
    console.log('🔄 Utilisation du fallback simple...')

    const pdf = new jsPDF('p', 'mm', 'a4')

    // Ajouter un contenu simple
    pdf.setFontSize(16)
    pdf.text('FICHES DE PAIE - COLARYS CONCEPT', 20, 20)
    pdf.setFontSize(12)
    pdf.text(`Période: ${getMonthName(selectedMonth.value)} ${selectedYear.value}`, 20, 35)
    pdf.text(`Nombre d'employés: ${salairesToDownload.length}`, 20, 45)

    let yPosition = 60
    salairesToDownload.forEach((salaire, index) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.text(`${index + 1}. ${salaire.Matricule} - ${salaire.Prénom} ${salaire.Nom}`, 20, yPosition)
      pdf.text(`   Salaire net: ${formatCurrency(salaire['Reste à payer'] || 0)} Ar`, 25, yPosition + 7)
      yPosition += 20
    })

    pdf.save(`${filename}_simple.pdf`)
    successMessage.value = `PDF simple généré: ${salairesToDownload.length} employé(s)`

  } catch (fallbackError) {
    console.error('❌ Erreur même avec le fallback:', fallbackError)
    errorMessage.value = 'Échec complet du téléchargement. Veuillez réessayer.'
  }
}

// VÉRIFICATION DES FONCTIONS DE TÉLÉCHARGEMENT
const downloadSelected = () => {
  console.log('🖱️ Clic sur "Télécharger les Fiches Sélectionnées"')

  if (calculatedSalaires.value.length === 0) {
    errorMessage.value = 'Veuillez d\'abord générer les fiches de paie'
    console.log('❌ Aucune fiche générée')
    return
  }

  const salairesToDownload = calculatedSalaires.value.filter(s =>
    selectedEmployees.value.includes(s.Matricule)
  )

  if (salairesToDownload.length === 0) {
    errorMessage.value = 'Aucun employé sélectionné'
    console.log('❌ Aucun employé sélectionné')
    return
  }

  console.log(`📥 Début du téléchargement de ${salairesToDownload.length} employé(s) sélectionné(s)`)
  const filename = `fiches_paie_${selectedMonth.value}_${selectedYear.value}_selection`
  downloadPDF(salairesToDownload, filename)
}

const downloadAll = () => {
  console.log('🖱️ Clic sur "Télécharger Toutes les Fiches"')

  if (calculatedSalaires.value.length === 0) {
    errorMessage.value = 'Veuillez d\'abord générer les fiches de paie'
    console.log('❌ Aucune fiche générée')
    return
  }

  console.log(`📥 Début du téléchargement de ${calculatedSalaires.value.length} employé(s)`)
  const filename = `fiches_paie_${selectedMonth.value}_${selectedYear.value}_complet`
  downloadPDF(calculatedSalaires.value, filename)
}
// VÉRIFICATION DES FONCTIONS DE TÉLÉCHARGEMENT



// VÉRIFICATION DES IMPORTS
console.log('🔍 Vérification des imports:')
console.log('jsPDF:', typeof jsPDF)
console.log('html2canvas:', typeof html2canvas)

// Vérifier que les bibliothèques sont chargées
if (typeof jsPDF === 'undefined') {
  console.error('❌ jsPDF non chargé')
  errorMessage.value = 'Erreur: La bibliothèque PDF n\'est pas chargée'
}

if (typeof html2canvas === 'undefined') {
  console.error('❌ html2canvas non chargé')
  errorMessage.value = 'Erreur: La bibliothèque de conversion n\'est pas chargée'
}
// Watchers
watch([selectedMonth, selectedYear], () => {
  calculatedSalaires.value = []
  previewData.value = null
  selectedEmployees.value = []
  successMessage.value = ''
})

onMounted(async () => {
  try {
    await colarysStore.loadEmployees()
    console.log('👥 Employés chargés:', employees.length)
  } catch (error) {
    errorMessage.value = 'Erreur chargement employés: ' + error.message
  }
})
</script>

<style scoped>
.colarys-payslip {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding: 20px;
  color: #f0f0f5;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 20px;
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
  padding: 10px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  min-width: 140px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.btn-primary {
  background: #3498db;
}

.btn-success {
  background: #28a745;
}

.btn-info {
  background: #17a2b8;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
}

.alert-danger {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.alert-success {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #f0f0f5;
  opacity: 0.8;
}

.preview-section {
  margin-top: 30px;
}

.preview-section h3 {
  color: #ffc107;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
}

.pdf-format {
  border: 2px solid #000;
  padding: 20px;
  background: #fff;
  color: #000;
  max-width: 1000px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: 297mm;
  overflow-y: auto;
}

.pdf-header {
  text-align: center;
  margin-bottom: 15px;
}

.pdf-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #000;
}

.pdf-employee-info {
  margin-bottom: 15px;
}

.pdf-info-grid-two-columns {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.pdf-info-column {
  width: 48%;
}

.pdf-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.pdf-label {
  font-weight: bold;
  min-width: 120px;
}

.pdf-value {
  text-align: right;
  flex: 1;
}

.pdf-separator {
  border: 1px solid #000;
  margin: 15px 0;
}

.pdf-table-container {
  width: 100%;
  margin-bottom: 20px;
  overflow-x: auto;
}

.pdf-salary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.pdf-salary-table th,
.pdf-salary-table td {
  border: 1px solid #000;
  padding: 5px 8px;
  text-align: center;
  color: #000;
}

.pdf-salary-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.pdf-salary-table .rubrique {
  text-align: left;
  font-weight: bold;
}

.pdf-signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  font-size: 11px;
}

.pdf-signature-col {
  text-align: center;
  width: 45%;
}

.pdf-signature-line {
  margin-bottom: 10px;
  font-weight: bold;
  text-decoration: underline;
}

.pdf-signature-name {
  border-top: 1px solid #000;
  padding-top: 4px;
}

.actions {
  text-align: center;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.employee-selection {
  max-width: 1200px;
  margin: 0 auto 20px auto;
  padding: 0 20px;
}

.employee-selection .control-group {
  margin-bottom: 0;
}

.employee-selection label {
  color: #f0f0f5;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.selection-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
}

.selection-section h3 {
  color: #ffc107;
  margin-bottom: 15px;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}

.employee-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.form-check-input {
  margin: 0;
}

.form-check-label {
  color: #f0f0f5;
  cursor: pointer;
}

.selection-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    width: 100%;
  }

  .pdf-info-grid-two-columns {
    flex-direction: column;
  }

  .pdf-info-column {
    width: 100%;
  }

  .pdf-salary-table {
    font-size: 8px;
  }

  .actions {
    flex-direction: column;
  }

  .pdf-format {
    height: auto;
    max-height: 80vh;
  }
}

/* Styles pour les selects et leurs options */
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
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

/* Style des options dans la liste déroulante */
.form-select option {
  background: rgba(30, 60, 114, 0.98) !important;
  color: #f0f0f5 !important;
  padding: 12px 15px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  font-size: 14px !important;
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
  font-weight: bold !important;
}

/* Style pour l'option placeholder */
.form-select option[value=""] {
  color: #ccc !important;
  font-style: italic !important;
}

/* Pour Firefox */
@-moz-document url-prefix() {
  .form-select {
    color: #f0f0f5 !important;
    text-shadow: 0 0 0 #f0f0f5 !important;
    background-color: rgba(30, 60, 114, 0.95) !important;
  }
  
  .form-select option {
    background: rgba(30, 60, 114, 0.98) !important;
    color: #f0f0f5 !important;
  }
}

/* Pour Webkit (Chrome, Safari, Edge) */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .form-select {
    color: #f0f0f5 !important;
  }
  
  .form-select option {
    background: rgba(30, 60, 114, 0.98) !important;
    color: #f0f0f5 !important;
  }
}

/* Style quand le select est ouvert */
.form-select:focus {
  background: rgba(30, 60, 114, 0.98) !important;
  color: #f0f0f5 !important;
  border-color: #ffc107 !important;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2) !important;
}

/* Style spécifique pour le select d'employés */
#employee-select {
  background: rgba(30, 60, 114, 0.95) !important;
  color: #f0f0f5 !important;
}

#employee-select option {
  background: rgba(30, 60, 114, 0.98) !important;
  color: #f0f0f5 !important;
}

/* Amélioration du contraste pour la lisibilité */
.control-group label {
  font-weight: 700;
  font-size: 14px;
  color: #ffc107 !important; /* Changé en jaune pour mieux contraster */
  margin-bottom: 8px;
}

/* Style pour les groupes de contrôles */
.controls {
  display: flex;
  gap: 15px;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Responsive pour les selects */
@media (max-width: 768px) {
  .form-select {
    font-size: 14px !important;
    padding: 12px 15px !important;
  }
  
  .form-select option {
    font-size: 13px !important;
    padding: 10px 12px !important;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    padding: 15px;
  }
  
  .control-group {
    width: 100%;
  }
}
</style>