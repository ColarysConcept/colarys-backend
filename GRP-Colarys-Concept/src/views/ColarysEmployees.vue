<template>
  <PageModel>
    <div class="colarys-employees">
      <div v-if="colarysStore.loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p>Chargement des employés...</p>
      </div>

      <div v-else>
        <div class="page-header">
          <h1>Gestion des Employés Colarys</h1>
          <button @click="showCreateModal = true" class="btn btn-primary">
            <i class="fas fa-plus"></i> Nouvel Employé
          </button>
        </div>

        <!-- Message d'erreur global -->
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Erreur :</strong> {{ errorMessage }}
          <button type="button" class="btn-close" @click="errorMessage = ''"></button>
        </div>

        <!-- Message de succès -->
        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
          {{ successMessage }}
          <button type="button" class="btn-close" @click="successMessage = ''"></button>
        </div>

        <!-- Filtres et recherche -->
        <div class="filters-section mb-3">
          <div class="row">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher un employé...">
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="statusFilter" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="1">Actifs</option>
                <option value="0">Inactifs</option>
              </select>
            </div>
            <div class="col-md-3">
              <select v-model="fonctionFilter" class="form-select">
                <option value="">Toutes les fonctions</option>
                <option v-for="fonction in fonctions" :key="fonction" :value="fonction">
                  {{ fonction }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-section mb-4">
          <div class="row">
            <div class="col-md-3">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ totalEmployees }}</div>
                  <div class="stat-label">Total Employés</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <div class="stat-icon active">
                  <i class="fas fa-user-check"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ activeEmployeesCount }}</div>
                  <div class="stat-label">Employés Actifs</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <div class="stat-icon">

                  <i class="fas fa-user-clock"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ inactiveEmployeesCount }}</div>
                  <div class="stat-label">Employés Inactifs</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-calendar-day"></i> <!-- 🔥 NOUVEAU: Icône pour jours OFF -->
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ statsDetails.joursOuvrablesMoisCourant }}</div>
                  <div class="stat-label">Jours Ouvrables</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-briefcase"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ fonctions.length }}</div>
                  <div class="stat-label">Fonctions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Liste des Employés - Tous les Champs</h5>
            <div class="d-flex gap-2 align-items-center">
              <!-- 🔥 CORRECTION: Bouton avec gestion d'état -->
              <button @click="exportToExcel" class="btn btn-outline-success btn-sm" :disabled="exporting">
                <template v-if="exporting">
                  <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Export...</span>
                  </div>
                  Export... {{ progress }}%
                </template>
                <template v-else>
                  <i class="fas fa-file-excel"></i> Excel
                </template>
              </button>

              <button @click="toggleView" class="btn btn-outline-primary btn-sm">
                <i :class="viewMode === 'table' ? 'fas fa-list' : 'fas fa-table'"></i>
                {{ viewMode === 'table' ? 'Vue Carte' : 'Vue Tableau' }}
              </button>
            </div>
          </div>

          <div v-if="viewMode === 'table'" class="table-responsive">
            <table class="table table-hover table-sm">
              <thead class="table-light">
                <tr>
                  <th @click="sortBy('Matricule')" class="sortable">Matricule</th>
                  <th @click="sortBy('Nom')" class="sortable">Nom</th>
                  <th @click="sortBy('Prénom')" class="sortable">Prénom</th>
                  <th>Adresse</th>
                  <th>Téléphone</th>
                  <th @click="sortBy('Fonction')" class="sortable">Fonction</th>
                  <th>Mode Paiement</th>
                  <th>Catégorie</th>
                  <th>Compagne</th>
                  <th>Salaire Base</th>
                  <th>Solde Initial Congé</th>
                  <th>Solde Congé</th>
                  <th>Date Embauche</th>
                  <th>Ancienneté</th>
                  <th>Distance Travail</th>
                  <th>Droit OSTIE</th>
                  <th>Droit Transport</th>
                  <th>Situation Maritale</th>
                  <th>Nb Enfants</th>
                  <th>Contact Urgence</th>
                  <th>Relation</th>
                  <th>Adresse Contact</th>
                  <th>Tél Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="employee in paginatedEmployees" :key="employee.Matricule">
                  <td><strong>{{ employee.Matricule }}</strong></td>
                  <td>{{ employee.Nom }}</td>
                  <td>{{ employee.Prénom }}</td>
                  <td class="small-text">{{ truncateText(employee.Adresse, 20) }}</td>
                  <td>{{ employee['N° Téléphone'] || '-' }}</td>
                  <td><span class="badge bg-secondary">{{ employee.Fonction || '-' }}</span></td>
                  <td>{{ employee['Mode de paiement'] || '-' }}</td>
                  <td>{{ employee.Catégorie || '-' }}</td>
                  <td>{{ employee.Compagne || '-' }}</td>
                  <td class="salary-amount">{{ formatCurrency(employee['Salaire de base']) }}</td>
                  <td>{{ employee['Solde initial congé'] || 0 }}</td>
                  <td>
                    <span class="badge" :class="getCongeBadgeClass(employee['Solde de congé'])">
                      {{ employee['Solde de congé'] || 0 }}j
                    </span>
                  </td>
                  <td class="small-text">{{ formatDate(employee["Date d'embauche"]) }}</td>
                  <td>{{ employee.Ancienneté || '0 ans' }}</td>
                  <td class="small-text">{{ truncateText(employee['distance du lieu de travaille'], 15) }}</td>
                  <td>
                    <span class="badge" :class="employee['droit ostie'] === '1' ? 'bg-success' : 'bg-warning'">
                      {{ employee['droit ostie'] === '1' ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge"
                      :class="employee['droit transport et repas'] === '1' ? 'bg-info' : 'bg-secondary'">
                      {{ employee['droit transport et repas'] === '1' ? 'Oui' : 'Non' }}
                    </span>
                  </td>
                  <td>{{ employee['Situation maritale'] || '-' }}</td>
                  <td>
                    <span class="badge bg-light text-dark">
                      {{ employee["Nombre d'enfants"] || 0 }}
                    </span>
                  </td>
                  <td class="small-text">{{ truncateText(employee["Contact d'urgence - Nom et prénom"], 15) }}</td>
                  <td>{{ employee.Relation || '-' }}</td>
                  <td class="small-text">{{ truncateText(employee["Adresse du contact d'urgence"], 15) }}</td>
                  <td>{{ employee["Téléphone contact urgence"] || '-' }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button @click="viewEmployee(employee)" class="btn btn-info" title="Voir détails">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button @click="editEmployee(employee)" class="btn btn-primary" title="Modifier">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="confirmDelete(employee)" class="btn btn-danger" title="Supprimer">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vue Carte avec informations principales -->
          <div v-else class="card-grid">
            <div v-for="employee in paginatedEmployees" :key="employee.Matricule" class="employee-card">
              <div class="card-header">
                <h6 class="mb-0">{{ employee.Prénom }} {{ employee.Nom }}</h6>
                <small class="text-muted">{{ employee.Matricule }} - {{ employee.Fonction || 'Non spécifié' }}</small>
              </div>
              <div class="card-body">
                <div class="employee-info">
                  <div class="info-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>{{ formatCurrency(employee['Salaire de base']) }}</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>{{ employee.Ancienneté || '0 ans' }}</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-umbrella-beach"></i>
                    <span>{{ employee['Solde de congé'] || 0 }} jours</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>{{ employee['N° Téléphone'] || 'Non renseigné' }}</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="small-text">{{ truncateText(employee.Adresse, 25) }}</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>{{ employee["Nombre d'enfants"] || 0 }} enfants</span>
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <span class="badge" :class="employee['droit ostie'] === '1' ? 'bg-success' : 'bg-warning'">
                  {{ employee['droit ostie'] === '1' ? 'Actif' : 'Inactif' }}
                </span>
                <div class="actions">
                  <button @click="viewEmployee(employee)" class="btn btn-sm btn-info" title="Voir">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="editEmployee(employee)" class="btn btn-sm btn-primary" title="Modifier">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="confirmDelete(employee)" class="btn btn-sm btn-danger" title="Supprimer">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="filteredEmployees.length > itemsPerPage" class="card-footer">
            <nav>
              <ul class="pagination pagination-sm justify-content-center mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link" @click="currentPage--">Précédent</button>
                </li>
                <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: currentPage === page }">
                  <button class="page-link" @click="currentPage = page">{{ page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link" @click="currentPage++">Suivant</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <!-- Modal de visualisation détaillée avec TOUS les champs -->
        <!-- Modal de visualisation détaillée avec TOUS les champs -->
        <div v-if="showViewModal" class="modal-overlay">
          <div class="modal-content x-large">
            <div class="modal-header">
              <h3>Détails Complets de l'Employé</h3>
              <button @click="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div v-if="selectedEmployee" class="employee-details">
                <div class="row">
                  <!-- Colonne 1: Informations de base -->
                  <div class="col-md-4">
                    <h5 class="section-title">Informations Personnelles</h5>
                    <div class="detail-item">
                      <label>Matricule:</label>
                      <span class="value-highlight">{{ selectedEmployee.Matricule }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Nom:</label>
                      <span>{{ selectedEmployee.Nom }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Prénom:</label>
                      <span>{{ selectedEmployee.Prénom }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Adresse:</label>
                      <span>{{ selectedEmployee.Adresse || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Téléphone:</label>
                      <span>{{ selectedEmployee['N° Téléphone'] || 'Non renseigné' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Situation maritale:</label>
                      <span>{{ selectedEmployee['Situation maritale'] || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Nombre d'enfants:</label>
                      <span class="badge bg-light text-dark">{{ selectedEmployee["Nombre d'enfants"] || 0 }}</span>
                    </div>
                  </div>

                  <!-- Colonne 2: Informations professionnelles -->
                  <div class="col-md-4">
                    <h5 class="section-title">Informations Professionnelles</h5>
                    <div class="detail-item">
                      <label>Fonction:</label>
                      <span class="badge bg-primary">{{ selectedEmployee.Fonction || 'Non spécifié' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Mode de paiement:</label>
                      <span>{{ selectedEmployee['Mode de paiement'] || 'Non renseigné' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Catégorie:</label>
                      <span>{{ selectedEmployee.Catégorie || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Compagne:</label>
                      <span>{{ selectedEmployee.Compagne || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Salaire de base:</label>
                      <span class="value-highlight salary">{{ formatCurrency(selectedEmployee['Salaire de base'])
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Solde initial congé:</label>
                      <span>{{ selectedEmployee['Solde initial congé'] || 0 }} jours</span>
                    </div>
                    <div class="detail-item">
                      <label>Solde de congé:</label>
                      <span class="badge" :class="getCongeBadgeClass(selectedEmployee['Solde de congé'])">
                        {{ selectedEmployee['Solde de congé'] || 0 }} jours
                      </span>
                    </div>
                    <div class="detail-item">
                      <label>Date d'embauche:</label>
                      <span>{{ formatDate(selectedEmployee["Date d'embauche"]) || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Ancienneté:</label>
                      <span>{{ selectedEmployee.Ancienneté || '0 ans' }}</span>
                    </div>
                  </div>

                  <!-- Colonne 3: Autres informations -->
                  <div class="col-md-4">
                    <h5 class="section-title">Autres Informations</h5>
                    <div class="detail-item">
                      <label>Distance lieu travail:</label>
                      <span>{{ selectedEmployee['distance du lieu de travaille'] || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Droit OSTIE:</label>
                      <span class="badge"
                        :class="selectedEmployee['droit ostie'] === '1' ? 'bg-success' : 'bg-warning'">
                        {{ selectedEmployee['droit ostie'] === '1' ? 'Actif' : 'Inactif' }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <label>Droit transport/repas:</label>
                      <span class="badge"
                        :class="selectedEmployee['droit transport et repas'] === '1' ? 'bg-info' : 'bg-secondary'">
                        {{ selectedEmployee['droit transport et repas'] === '1' ? 'Oui' : 'Non' }}
                      </span>
                    </div>

                    <h6 class="section-title mt-3">Contact d'Urgence</h6>
                    <div class="detail-item">
                      <label>Nom et prénom:</label>
                      <span>{{ selectedEmployee["Contact d'urgence - Nom et prénom"] || 'Non renseigné' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Relation:</label>
                      <span>{{ selectedEmployee.Relation || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Adresse:</label>
                      <span>{{ selectedEmployee["Adresse du contact d'urgence"] || 'Non renseignée' }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Téléphone:</label>
                      <span>{{ selectedEmployee["Téléphone contact urgence"] || 'Non renseigné' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="closeViewModal" class="btn btn-secondary">Fermer</button>
            </div>
          </div>
        </div>

        <!-- Modals de suppression et édition -->
        <div v-if="showDeleteModal" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Confirmer la suppression</h3>
              <button @click="closeDeleteModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer l'employé :</p>
              <p><strong>{{ employeeToDelete?.Matricule }} - {{ employeeToDelete?.Prénom }} {{ employeeToDelete?.Nom
              }}</strong> ?</p>
              <p class="text-danger">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button @click="executeDelete" class="btn btn-danger" :disabled="deleting">
                <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
                Supprimer
              </button>
              <button @click="closeDeleteModal" class="btn btn-secondary" :disabled="deleting">
                Annuler
              </button>
            </div>
          </div>
        </div>

        <div v-if="showCreateModal || showEditModal" class="modal-overlay">
          <div class="modal-content x-large">
            <div class="modal-header">
              <h3>{{ showEditModal ? 'Modifier' : 'Nouvel' }} Employé</h3>
              <button @click="closeModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div v-if="formError" class="alert alert-warning">
                {{ formError }}
              </div>

              <form @submit.prevent="submitForm">
                <div class="form-grid">
                  <div v-for="field in employeeFields" :key="field.key" class="form-group">
                    <label :for="field.key" class="form-label">
                      {{ field.label }}
                      <span v-if="field.required" class="text-danger">*</span>
                    </label>

                    <template v-if="field.type === 'number'">
                      <input :id="field.key" v-model="formData[field.key]" type="text" class="form-input"
                        :class="{ 'is-invalid': fieldErrors[field.key] }" :readonly="field.readonly"
                        :placeholder="field.placeholder || ''" @input="formatNumberInput(field.key, $event)"
                        @blur="validateNumberField(field.key)" />
                    </template>
                    <template v-else-if="field.type === 'date'">
                      <input :id="field.key" v-model="formData[field.key]" type="date" class="form-input"
                        :class="{ 'is-invalid': fieldErrors[field.key] }" />
                    </template>
                    <template v-else>
                      <input :id="field.key" v-model="formData[field.key]" :type="field.type || 'text'"
                        class="form-input" :class="{ 'is-invalid': fieldErrors[field.key] }" :readonly="field.readonly"
                        :placeholder="field.placeholder || ''" />
                    </template>

                    <div v-if="fieldErrors[field.key]" class="invalid-feedback">
                      {{ fieldErrors[field.key] }}
                    </div>

                    <small v-if="field.type === 'number'" class="form-text text-muted">
                      Saisissez uniquement des chiffres (ex: 150000)
                    </small>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" :disabled="submitting">
                    <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                    {{ showEditModal ? 'Modifier' : 'Créer' }}
                  </button>
                  <button type="button" @click="closeModal" class="btn btn-secondary" :disabled="submitting">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageModel>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useColarysStore } from '@/stores/colarys'
import PageModel from '@/components/organisms/PageModel.vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const colarysStore = useColarysStore()
const { employees } = colarysStore

// 🔥 AJOUT: Déclarer les variables manquantes
const exporting = ref(false)
const progress = ref(0)

// États de l'interface
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showViewModal = ref(false)
const currentEditMatricule = ref(null)
const employeeToDelete = ref(null)
const selectedEmployee = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const formError = ref('')
const submitting = ref(false)
const deleting = ref(false)
const fieldErrors = ref({})

// États pour les filtres et la recherche
const searchQuery = ref('')
const statusFilter = ref('')
const fonctionFilter = ref('')
const viewMode = ref('table')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortField = ref('Matricule')
const sortDirection = ref('asc')


// Ajoutez cette fonction pour gérer les erreurs de chargement
const initializeData = async () => {
  try {
    await colarysStore.loadEmployees()
    console.log('👥 Employés chargés dans le composant:', colarysStore.employees.length)
  } catch (error) {
    console.error('Erreur initialisation:', error)
    // Vous pouvez afficher un message d'erreur à l'utilisateur ici
  }
}


// Dans ColarysEmployees.vue - ajouter dans les computed properties
const statsDetails = computed(() => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // 🔥 CALCUL DES JOURS OUVRABLES COURANTS
  let joursOuvrables = 22;
  try {
    const joursDansMois = new Date(currentYear, currentMonth, 0).getDate();
    let joursCalc = 0;
    for (let jour = 1; jour <= joursDansMois; jour++) {
      const date = new Date(currentYear, currentMonth - 1, jour);
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        joursCalc++;
      }
    }
    joursOuvrables = Math.max(joursCalc, 1);
  } catch (error) {
    console.error('Erreur calcul jours:', error);
  }

  return {
    joursOuvrablesMoisCourant: joursOuvrables,
    moisCourant: currentMonth,
    anneeCourante: currentYear
  };
});


const employeeFields = [
  { key: 'Matricule', label: 'Matricule', required: true, placeholder: 'Ex: EMP001' },
  { key: 'Nom', label: 'Nom', required: true },
  { key: 'Prénom', label: 'Prénom', required: true },
  { key: 'Adresse', label: 'Adresse' },
  { key: 'N° Téléphone', label: 'N° Téléphone', type: 'tel' },
  { key: 'Fonction', label: 'Fonction' },
  { key: 'Mode de paiement', label: 'Mode de paiement' },
  { key: 'Catégorie', label: 'Catégorie' },
  { key: 'Compagne', label: 'Compagne' },
  { key: 'Salaire de base', label: 'Salaire de base', type: 'number', placeholder: '150000' },
  { key: 'Solde initial congé', label: 'Solde initial congé', type: 'number', placeholder: '0' },
  { key: 'Solde de congé', label: 'Solde de congé', type: 'number', placeholder: '0' },
  { key: 'Date d\'embauche', label: 'Date d\'embauche', type: 'date' },
  { key: 'Ancienneté', label: 'Ancienneté', readonly: true },
  { key: 'distance du lieu de travaille', label: 'Distance du lieu de travail' },
  { key: 'droit ostie', label: 'Droit OSTIE', readonly: true },
  { key: 'droit transport et repas', label: 'Droit transport et repas', readonly: true },
  { key: 'Situation maritale', label: 'Situation maritale' },
  { key: 'Nombre d\'enfants', label: 'Nombre d\'enfants', type: 'number', placeholder: '0' },
  { key: 'Contact d\'urgence - Nom et prénom', label: 'Contact d\'urgence - Nom et prénom' },
  { key: 'Relation', label: 'Relation' },
  { key: 'Adresse du contact d\'urgence', label: 'Adresse du contact d\'urgence' },
  { key: 'Téléphone contact urgence', label: 'Téléphone contact urgence', type: 'tel' }
]

const formData = reactive({
  Matricule: '',
  Nom: '',
  Prénom: '',
  Adresse: '',
  "N° Téléphone": '',
  Fonction: '',
  "Mode de paiement": '',
  Catégorie: '',
  Compagne: '',
  "Salaire de base": '',
  "Solde initial congé": '',
  "Solde de congé": '',
  "Date d'embauche": '',
  Ancienneté: '',
  "distance du lieu de travaille": '',
  "droit ostie": '',
  "droit transport et repas": '',
  "Situation maritale": '',
  "Nombre d'enfants": '',
  "Contact d'urgence - Nom et prénom": '',
  Relation: '',
  "Adresse du contact d'urgence": '',
  "Téléphone contact urgence": ''
})


// 🔥 NOUVELLES MÉTHODES UTILITAIRES
const formatNumberInput = (fieldKey, event) => {
  let value = event.target.value
  value = value.replace(/[^\d]/g, '')
  formData[fieldKey] = value
}

const validateNumberField = (fieldKey) => {
  const value = formData[fieldKey]
  if (value && !/^\d+$/.test(value)) {
    fieldErrors.value[fieldKey] = 'Veuillez saisir uniquement des chiffres'
  } else {
    delete fieldErrors.value[fieldKey]
  }
}

const truncateText = (text, maxLength) => {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  } catch {
    return dateString
  }
}

const fonctions = computed(() => {
  const fonctionsSet = new Set()
  employees.forEach(emp => {
    if (emp.Fonction) {
      fonctionsSet.add(emp.Fonction)
    }
  })
  return Array.from(fonctionsSet).sort()
})

const totalEmployees = computed(() => employees.length)
const activeEmployeesCount = computed(() =>
  employees.filter(emp => emp['droit ostie'] === '1').length
)
const inactiveEmployeesCount = computed(() =>
  employees.filter(emp => emp['droit ostie'] !== '1').length
)

const filteredEmployees = computed(() => {
  let filtered = employees

  // Filtre de recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(emp =>
      emp.Matricule.toLowerCase().includes(query) ||
      emp.Nom.toLowerCase().includes(query) ||
      emp.Prénom.toLowerCase().includes(query) ||
      (emp.Fonction && emp.Fonction.toLowerCase().includes(query)) ||
      (emp.Adresse && emp.Adresse.toLowerCase().includes(query)) ||
      (emp['N° Téléphone'] && emp['N° Téléphone'].includes(query))
    )
  }

  // Filtre par statut
  if (statusFilter.value !== '') {
    filtered = filtered.filter(emp => emp['droit ostie'] === statusFilter.value)
  }

  // Filtre par fonction
  if (fonctionFilter.value) {
    filtered = filtered.filter(emp => emp.Fonction === fonctionFilter.value)
  }

  // Tri
  filtered.sort((a, b) => {
    let aValue = a[sortField.value] || ''
    let bValue = b[sortField.value] || ''

    if (typeof aValue === 'string') aValue = aValue.toLowerCase()
    if (typeof bValue === 'string') bValue = bValue.toLowerCase()

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEmployees.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredEmployees.value.length / itemsPerPage.value)
)

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 Ar'
  const num = typeof amount === 'string'
    ? parseFloat(amount.replace(/\s/g, ''))
    : parseFloat(amount)
  if (isNaN(num)) return '0 Ar'
  return new Intl.NumberFormat('fr-FR').format(num) + ' Ar'
}

const getCongeBadgeClass = (solde) => {
  const numSolde = typeof solde === 'string' ? parseInt(solde) : solde
  if (!numSolde && numSolde !== 0) return 'bg-secondary'
  if (numSolde > 15) return 'bg-success'
  if (numSolde > 5) return 'bg-warning'
  return 'bg-danger'
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'table' ? 'card' : 'table'
}
// 🔥 CORRECTION: Fonction exportToExcel corrigée
const exportToExcel = async () => {
  exporting.value = true;
  progress.value = 0;

  try {
    console.log('💾 Début de l\'export Excel...');

    if (!filteredEmployees.value || filteredEmployees.value.length === 0) {
      errorMessage.value = 'Aucune donnée à exporter';
      exporting.value = false;
      return;
    }

    progress.value = 10;

    // Préparer les données pour l'export
    const dataToExport = filteredEmployees.value.map((employee, index) => {
      // Mettre à jour la progression
      if (index % Math.max(1, Math.floor(filteredEmployees.value.length / 10)) === 0) {
        progress.value = 10 + Math.floor((index / filteredEmployees.value.length) * 80);
      }
      return {
        'Matricule': employee.Matricule || '',
        'Nom': employee.Nom || '',
        'Prénom': employee.Prénom || '',
        'Adresse': employee.Adresse || '',
        'Téléphone': employee['N° Téléphone'] || '',
        'Fonction': employee.Fonction || '',
        'Mode de paiement': employee['Mode de paiement'] || '',
        'Catégorie': employee.Catégorie || '',
        'Compagne': employee.Compagne || '',
        'Salaire de base': formatNumberForExport(employee['Salaire de base']),
        'Solde initial congé': employee['Solde initial congé'] || 0,
        'Solde de congé': employee['Solde de congé'] || 0,
        'Date d\'embauche': formatDateForExport(employee["Date d'embauche"]),
        'Ancienneté': employee.Ancienneté || '',
        'Distance travail': employee['distance du lieu de travaille'] || '',
        'Droit OSTIE': employee['droit ostie'] === '1' ? 'Oui' : 'Non',
        'Droit transport/repas': employee['droit transport et repas'] === '1' ? 'Oui' : 'Non',
        'Situation maritale': employee['Situation maritale'] || '',
        'Nombre d\'enfants': employee["Nombre d'enfants"] || 0,
        'Contact urgence': employee["Contact d'urgence - Nom et prénom"] || '',
        'Relation': employee.Relation || '',
        'Adresse contact': employee["Adresse du contact d'urgence"] || '',
        'Téléphone contact': employee["Téléphone contact urgence"] || '',
        'Statut': employee['droit ostie'] === '1' ? 'Actif' : 'Inactif'
      };
    });

    progress.value = 90;

    // Créer un nouveau classeur avec seulement les données principales
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Employés');

    progress.value = 95;

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Créer le blob et télécharger
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Employes_Colarys_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);

    progress.value = 100;

    console.log('✅ Export Excel réussi!');
    successMessage.value = `Export réussi ! ${dataToExport.length} employés exportés`;

  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel:', error);
    errorMessage.value = `Erreur lors de l'export: ${error.message}`;
  } finally {
    exporting.value = false;
    // Réinitialiser la progression après un délai
    setTimeout(() => { progress.value = 0; }, 2000);
  }
};

// 🔥 GARDER UNE SEULE DÉCLARATION de ces fonctions utilitaires
const formatNumberForExport = (value) => {
  if (!value && value !== 0) return 0;
  try {
    const num = typeof value === 'string'
      ? parseFloat(value.replace(/\s/g, '').replace(',', '.'))
      : parseFloat(value);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
};


const formatDateForExport = (dateString) => {
  if (!dateString) return '';
  try {
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateString;
  } catch {
    return dateString;
  }
};


const formatNumberForDisplay = (value, decimals = 0) => {
  if (value === null || value === undefined || value === '') {
    return decimals === 0 ? '0' : '0.00'
  }

  try {
    const num = typeof value === 'string'
      ? parseFloat(value.replace(/\s/g, '').replace(',', '.'))
      : parseFloat(value)

    if (isNaN(num)) {
      return decimals === 0 ? '0' : '0.00'
    }

    if (decimals === 0) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(num))
    } else {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num)
    }
  } catch {
    return decimals === 0 ? '0' : '0.00'
  }
}

const validateForm = () => {
  fieldErrors.value = {}
  let isValid = true

  if (!formData.Matricule?.trim()) {
    fieldErrors.value.Matricule = 'Le matricule est requis'
    isValid = false
  }

  if (!formData.Nom?.trim()) {
    fieldErrors.value.Nom = 'Le nom est requis'
    isValid = false
  }

  if (!formData.Prénom?.trim()) {
    fieldErrors.value.Prénom = 'Le prénom est requis'
    isValid = false
  }

  const numericFields = ['Salaire de base', 'Solde initial congé', 'Solde de congé', "Nombre d'enfants"]
  numericFields.forEach(field => {
    const value = formData[field]
    if (value && !/^\d+$/.test(value.toString())) {
      fieldErrors.value[field] = 'Veuillez saisir uniquement des chiffres'
      isValid = false
    }
  })

  return isValid
}

const viewEmployee = (employee) => {
  selectedEmployee.value = employee
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedEmployee.value = null
}

const editEmployee = (employee) => {
  Object.keys(formData).forEach(key => {
    let value = employee[key] || ''

    if (['Salaire de base', 'Solde initial congé', 'Solde de congé', "Nombre d'enfants"].includes(key)) {
      if (value && typeof value === 'number') {
        value = value.toString()
      }
    }

    formData[key] = value
  })

  currentEditMatricule.value = employee.Matricule
  showEditModal.value = true
  formError.value = ''
  fieldErrors.value = {}
}

const confirmDelete = (employee) => {
  employeeToDelete.value = employee
  showDeleteModal.value = true
  errorMessage.value = ''
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  employeeToDelete.value = null
  deleting.value = false
}

const executeDelete = async () => {
  if (!employeeToDelete.value) return

  deleting.value = true
  errorMessage.value = ''

  try {
    await colarysStore.deleteEmployee(employeeToDelete.value.Matricule)
    successMessage.value = `Employé ${employeeToDelete.value.Matricule} supprimé avec succès`
    closeDeleteModal()
  } catch (error) {
    errorMessage.value = error.message
    console.error('Erreur suppression:', error)
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  currentEditMatricule.value = null
  formError.value = ''
  fieldErrors.value = {}
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  submitting.value = false
}

const submitForm = async () => {
  if (!validateForm()) {
    formError.value = 'Veuillez corriger les erreurs dans le formulaire'
    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const submissionData = { ...formData }

    const numericFields = ['Salaire de base', 'Solde initial congé', 'Solde de congé', "Nombre d'enfants"]
    numericFields.forEach(field => {
      if (submissionData[field]) {
        submissionData[field] = parseFloat(submissionData[field].toString().replace(/\s/g, '')) || 0
      } else {
        submissionData[field] = 0
      }
    })

    if (showEditModal.value) {
      await colarysStore.updateEmployee(currentEditMatricule.value, submissionData)
      successMessage.value = 'Employé modifié avec succès'
    } else {
      await colarysStore.createEmployee(submissionData)
      successMessage.value = 'Employé créé avec succès'
    }
    closeModal()
    errorMessage.value = ''
  } catch (error) {
    formError.value = error.message
    console.error('Erreur sauvegarde employé:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  initializeData()
})

onMounted(async () => {
  try {
    await colarysStore.loadEmployees()
    console.log('👥 Employés chargés dans le composant:', employees.length)
  } catch (error) {
    errorMessage.value = error.message
  }
})
</script>

<style scoped>
.loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: #f0f0f5;
}

.loading-overlay p {
  margin-top: 15px;
  font-size: 1.1rem;
}

.colarys-employees {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding: 20px 0;
}

h1 {
  color: #ffc107 !important;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.filters-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

/* Styles pour les champs de formulaire dans les filtres */
.filters-section .form-control,
.filters-section .form-select {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #ced4da;
  border-radius: 8px;
  color: #333333 !important;
  padding: 10px 12px;
}

.filters-section .form-control:focus,
.filters-section .form-select:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  background: rgba(255, 255, 255, 0.95) !important;
  outline: none;
}

.filters-section .form-control::placeholder {
  color: #6c757d;
}

.stats-section {
  margin: 20px 0;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  backdrop-filter: blur(10px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffc107;
}

.stat-icon.active {
  background: rgba(40, 167, 69, 0.3);
  color: #28a745;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffc107;
}

.stat-label {
  color: #f0f0f5;
  font-size: 0.9rem;
  font-weight: 600;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  backdrop-filter: blur(10px);
}

.card-header {
  background: rgba(255, 255, 255, 0.1) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffc107 !important;
}

.card-header h5 {
  color: #ffc107 !important;
  font-weight: 600;
}

.table-responsive {
  overflow-x: auto;
  font-size: 0.85rem;
}

.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  font-weight: 600;
}

.sortable:hover {
  background: rgba(255, 255, 255, 0.2);
}

.table th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.table td {
  background: rgba(255, 255, 255, 0.05);
  color: #f0f0f5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
}

.salary-amount {
  font-weight: 700;
  color: #ffc107;
  white-space: nowrap;
}

.small-text {
  font-size: 0.8rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f0f0f5;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 15px;
}

.employee-card {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  color: #f0f0f5;
  backdrop-filter: blur(10px);
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.employee-card .card-header {
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffc107 !important;
}

.employee-card .card-body {
  padding: 15px;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #f0f0f5;
  font-weight: 500;
}

.info-item i {
  width: 16px;
  color: #ffc107;
}

.employee-card .card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.actions {
  display: flex;
  gap: 5px;
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-content.large {
  max-width: 800px;
}

.modal-content.x-large {
  max-width: 1200px;
  width: 95%;
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
  border-radius: 12px 12px 0 0;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0 0 12px 12px;
}

/* FORMULAIRES */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 700;
  margin-bottom: 8px;
  color: #f0f0f5;
  font-size: 0.95rem;
}

.form-input {
  padding: 12px 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #333333;
  font-weight: 500;
}

.form-input::placeholder {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  background: rgba(255, 255, 255, 0.95);
  color: #333333;
}

.form-input:read-only {
  background-color: rgba(255, 255, 255, 0.7);
  color: #666666;
  cursor: not-allowed;
  font-weight: 500;
}

.is-invalid {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2) !important;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 6px;
  font-size: 0.8rem;
  color: #dc3545;
  font-weight: 600;
}

.form-text {
  font-size: 0.75rem;
  margin-top: 4px;
  color: #f0f0f5;
  font-weight: 500;
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
  color: #ffc107;
  opacity: 0.8;
  transition: opacity 0.2s;
  font-weight: bold;
}

.btn-close:hover {
  opacity: 1;
}

.text-danger {
  color: #dc3545;
  font-weight: 600;
}

/* BOUTONS AMÉLIORÉS */
.btn {
  padding: 10px 20px;
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
  color: white;
  font-size: 0.95rem;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #3498db);
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background: #7b8a8b;
}

.btn-success {
  background: #28a745;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-info {
  background: #17a2b8;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #000;
  font-weight: 700;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
  color: #000;
}

.btn-danger {
  background: #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.875rem;
  border-radius: 20px;
}

.btn-group-sm .btn {
  padding: 4px 8px;
  font-size: 0.8rem;
  border-radius: 18px;
}

.btn-outline-primary {
  background: transparent;
  border: 2px solid #3498db;
  color: #3498db;
  font-weight: 700;
}

.btn-outline-primary:hover {
  background: #3498db;
  color: white;
}

.btn-outline-success {
  background: transparent;
  border: 2px solid #28a745;
  color: #28a745;
  font-weight: 700;
}

.btn-outline-success:hover {
  background: #28a745;
  color: white;
}

/* DÉTAILS EMPLOYÉ DANS MODALE */
.employee-details {
  padding: 10px 0;
  color: #f0f0f5;
}

.section-title {
  color: #ffc107;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 8px;
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 700;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 10px;
}

.detail-item label {
  font-weight: 600;
  color: #f0f0f5;
  min-width: 180px;
  flex-shrink: 0;
}

.detail-item span {
  color: #f0f0f5;
  text-align: right;
  flex: 1;
  font-weight: 500;
}

.value-highlight {
  font-weight: 700;
  color: #ffc107;
}

.salary {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffc107;
}

/* BADGES */
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.bg-success {
  background: #28a745 !important;
}

.bg-warning {
  background: #ffc107 !important;
  color: #000 !important;
}

.bg-info {
  background: #17a2b8 !important;
}

.bg-secondary {
  background: #6c757d !important;
}

.bg-primary {
  background: #3498db !important;
}

.bg-light {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #f0f0f5 !important;
  font-weight: 600;
}

.bg-danger {
  background: #dc3545 !important;
}

/* ALERTES */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
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

.alert-warning {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #f0f0f5;
}

/* PAGINATION */
.pagination {
  margin-bottom: 0;
}

.page-link {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f0f0f5;
  font-weight: 600;
  border-radius: 6px;
  margin: 0 2px;
}

.page-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #f0f0f5;
}

.page-item.active .page-link {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: #3498db;
  color: white;
  font-weight: 700;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .table-responsive {
    font-size: 0.8rem;
  }

  .modal-content.x-large {
    width: 98%;
    margin: 10px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    padding: 0 15px;
  }

  .card-grid {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .filters-section .row {
    gap: 10px;
  }

  .stats-section .row {
    gap: 10px;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .modal-content.large,
  .modal-content.x-large {
    width: 98%;
    margin: 5px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .detail-item span {
    text-align: left;
  }

  .employee-details .row {
    flex-direction: column;
  }

  .employee-details .col-md-4 {
    margin-bottom: 20px;
  }

  .modal-body {
    padding: 20px 15px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-footer {
    padding: 15px 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .colarys-employees {
    padding: 10px 0;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .form-input {
    padding: 10px 12px;
  }

  .employee-card {
    margin: 0 5px;
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

/* Style pour la table avec beaucoup de colonnes */
.table-sm th,
.table-sm td {
  padding: 6px 8px;
  vertical-align: middle;
}

/* Amélioration de la lisibilité des lignes */
.table-hover tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Scrollbar personnalisée pour les modales */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #2980b9;
}

/* Effet de verre pour les modales */
.modal-content {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Amélioration de la visibilité */
.form-input,
.form-label,
.detail-item label,
.detail-item span,
.section-title,
.modal-header h3 {
  font-weight: 600;
}

/* Amélioration de la lisibilité des textes dans les cartes */
.employee-card,
.card,
.stat-card {
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

/* Style pour les inputs de type file et select dans les filtres */
.filters-section input[type="file"] {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #333333 !important;
}

.filters-section select option {
  background: white;
  color: #333333;
}
</style>