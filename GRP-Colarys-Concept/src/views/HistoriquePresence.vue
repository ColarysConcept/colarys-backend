<template>
  <PageModel>
    <div class="historique-container mobile-optimized">
      <h1>Historique des Présences</h1>

      <!-- Section Filtres Avancés - Version Mobile -->
      <div class="filter-section mobile-filter">
        <div class="filter-header" @click="toggleFilters">
          <h3>Filtres de recherche</h3>
          <span class="toggle-icon">{{ showFilters ? '▲' : '▼' }}</span>
        </div>

        <div v-if="showFilters" class="filter-content">
          <div class="filter-group-mobile">
            <label>Période :</label>
            <select v-model="periodeType" @change="onPeriodeChange" class="mobile-select">
              <option value="dates">Dates spécifiques</option>
              <option value="mois">Mois/Année</option>
            </select>
          </div>

          <div v-if="periodeType === 'dates'" class="filter-group-mobile">
            <label>Date début:</label>
            <input type="date" v-model="dateDebut" class="mobile-input" />
          </div>

          <div v-if="periodeType === 'dates'" class="filter-group-mobile">
            <label>Date fin:</label>
            <input type="date" v-model="dateFin" class="mobile-input" />
          </div>

          <div v-if="periodeType === 'mois'" class="filter-group-mobile">
            <label>Année:</label>
            <select v-model="annee" class="mobile-select">
              <option value="">Sélectionner</option>
              <option v-for="y in anneesDisponibles" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <div v-if="periodeType === 'mois' && annee" class="filter-group-mobile">
            <label>Mois:</label>
            <select v-model="mois" class="mobile-select">
              <option value="">Tous les mois</option>
              <option v-for="(m, index) in moisDisponibles" :key="index" :value="m.value">{{ m.label }}</option>
            </select>
          </div>

          <div class="filter-group-mobile">
            <label>Matricule:</label>
            <input type="text" v-model="matricule" class="mobile-input" />
          </div>

          <div class="filter-group-mobile">
            <label>Nom:</label>
            <input type="text" v-model="nom" class="mobile-input" />
          </div>

          <div class="filter-group-mobile">
            <label>Prénom:</label>
            <input type="text" v-model="prenom" class="mobile-input" />
          </div>

          <div class="filter-group-mobile">
            <label>Campagne:</label>
            <select v-model="campagne" class="mobile-select">
              <option value="">Toutes</option>
              <option value="Standard">Standard</option>
              <option value="Klekoon">Klekoon</option>
              <option value="Medadom">Medadom</option>
              <option value="Stagiaire">Stagiaire</option>
              <option value="Commercial">Commerciale</option>
            </select>
          </div>

          <div class="filter-group-mobile">
            <label>Shift:</label>
            <select v-model="shift" class="mobile-select">
              <option value="">Tous</option>
              <option value="JOUR">Jour</option>
              <option value="NUIT">Nuit</option>
              <option value="Stagiaire">Stagiaire</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div class="mobile-actions">
            <button @click="fetchHistorique" :disabled="loading" class="btn-search mobile-btn">
              {{ loading ? '⏳' : '🔍' }} Rechercher
            </button>
            <button @click="exporterPDF" :disabled="presences.length === 0 || loading" class="btn-export mobile-btn">
              📄 Exporter
            </button>
            <button @click="reinitialiserFiltres" class="btn-reset mobile-btn">
              🗑️ Réinitialiser
            </button>
          </div>
        </div>
      </div>



      <!-- Résultats -->
      <div v-if="loading" class="loading-mobile">
        <div class="spinner"></div>
        <span>Chargement en cours...</span>
      </div>

      <div v-if="error" class="error-mobile">{{ error }}</div>

      <div v-else class="results-section">

      

        <!-- STATISTIQUES MOBILE -->
        <div v-if="presences.length > 0" class="stats-section-mobile">
          <div class="stat-card-mobile">
            <div class="stat-value">{{ totalPresences }}</div>
            <div class="stat-label">Comptage des personnes présentes</div>
          </div>
          <div class="stat-card-mobile">
            <div class="stat-value">{{ formatHeures(totalHeures) }}h</div>
            <div class="stat-label">Total des heures travaillées</div>
          </div>
          <div class="stat-card-mobile">
            <div class="stat-value">{{ joursTravailles }}</div>
            <div class="stat-label">Nombre des jours</div>
          </div>
        </div>

        <div class="results-info-mobile">
          <p>{{ presences.length }} présence(s) trouvée(s)</p>
          <p v-if="filtresActifs" class="filtres-actifs-mobile">
            Filtres actifs
          </p>
        </div>

          <div v-if="presences.length > 0" class="info-banner-mobile">
          <div class="info-icon">💡</div>
          <div class="info-text">
            <strong>Temps de présence fixe :</strong> Chaque agent compte 8 heures de présence quel que soit le shift.
          </div>
        </div>

        <!-- TABLEAU AVEC DÉFILEMENT HORIZONTAL -->
        <div class="table-container-mobile">
          <div class="table-scroll-wrapper">
            <table class="presence-table-mobile">
              <thead>
                <tr>
                  <th @click="triColonne('date')" class="sortable-mobile">
                    Date {{ getSortIcon('date') }}
                  </th>
                  <th @click="triColonne('matricule')" class="sortable-mobile">
                    Matricule {{ getSortIcon('matricule') }}
                  </th>
                  <th @click="triColonne('nom')" class="sortable-mobile">
                    Nom {{ getSortIcon('nom') }}
                  </th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Heures</th>
                  <th>Shift</th>
                  <th>Campagne</th>
                  <!-- Colonnes signatures optionnelles -->
                  <th v-if="showSignatures">Sig. Entrée</th>
                  <th v-if="showSignatures">Sig. Sortie</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="presence in presencesTriees" :key="presence.id">
                  <td class="mobile-cell">{{ formatDate(presence.date) }}</td>
                  <td class="mobile-cell matricule-cell">{{ presence.agent.matricule || 'N/D' }}</td>
                  <td class="mobile-cell nom-cell-mobile">
                    <div class="nom-complet-mobile">
                      <div class="nom-mobile">{{ presence.agent.nom }}</div>
                      <div class="prenom-mobile">{{ presence.agent.prenom }}</div>
                    </div>
                  </td>
                  <td class="mobile-cell heure-cell">{{ presence.heureEntree }}</td>
                  <td class="mobile-cell heure-cell">{{ presence.heureSortie || '-' }}</td>
                  <td class="mobile-cell heures-cell">{{ presence.heuresTravaillees ?
                    `${formatHeures(presence.heuresTravaillees)}h` : '-' }}</td>
                  <td class="mobile-cell shift-cell">{{ presence.shift }}</td>
                  <td class="mobile-cell campagne-cell">{{ presence.agent.campagne }}</td>

                  <!-- Signatures conditionnelles -->
                  <td v-if="showSignatures" class="mobile-cell signature-cell-mobile">
                    <div v-if="presence.details?.signatureEntree" class="signature-container-mobile">
                      <img :src="presence.details.signatureEntree" alt="Signature entrée" class="signature-image-mobile"
                        @click="agrandirSignature(presence.details.signatureEntree, 'Entrée - ' + presence.agent.nom + ' ' + presence.agent.prenom)" />
                    </div>
                    <span v-else class="no-signature-mobile">-</span>
                  </td>

                  <td v-if="showSignatures" class="mobile-cell signature-cell-mobile">
                    <div v-if="presence.details?.signatureSortie" class="signature-container-mobile">
                      <img :src="presence.details.signatureSortie" alt="Signature sortie" class="signature-image-mobile"
                        @click="agrandirSignature(presence.details.signatureSortie, 'Sortie - ' + presence.agent.nom + ' ' + presence.agent.prenom)" />
                    </div>
                    <span v-else class="no-signature-mobile">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Indicateur de défilement -->
          <div class="scroll-indicator">
            <span>← Défilez horizontalement →</span>
          </div>
        </div>

        <!-- VUE CARTES POUR MOBILE (Alternative au tableau) -->
        <div class="cards-view-mobile" v-if="presences.length > 0">
          <div class="view-toggle">
            <button @click="viewMode = 'table'" :class="{ active: viewMode === 'table' }" class="view-btn">
              📊 Tableau
            </button>
            <button @click="viewMode = 'cards'" :class="{ active: viewMode === 'cards' }" class="view-btn">
              🗂️ Cartes
            </button>
            <button @click="toggleSignatures" class="view-btn signature-toggle">
              {{ showSignatures ? '🙈' : '👁️' }} Signatures
            </button>
          </div>

          <div v-if="viewMode === 'cards'" class="cards-container">
            <div v-for="presence in presencesTriees" :key="presence.id" class="presence-card-mobile">
              <div class="card-header">
                <div class="card-title">
                  <strong>{{ presence.agent.nom }} {{ presence.agent.prenom }}</strong>
                  <span class="matricule-badge">{{ presence.agent.matricule || 'N/D' }}</span>
                </div>
                <div class="card-date">{{ formatDate(presence.date) }}</div>
              </div>

              <div class="card-content">
                <div class="card-row">
                  <span class="label">Entrée:</span>
                  <span class="value">{{ presence.heureEntree }}</span>
                </div>
                <div class="card-row">
                  <span class="label">Sortie:</span>
                  <span class="value">{{ presence.heureSortie || '-' }}</span>
                </div>
                <div class="card-row">
                  <span class="label">Heures:</span>
                  <span class="value heures-value">{{ presence.heuresTravaillees ?
                    `${formatHeures(presence.heuresTravaillees)}h` : '-' }}</span>
                </div>
                <div class="card-row">
                  <span class="label">Shift:</span>
                  <span class="value shift-badge">{{ presence.shift }}</span>
                </div>
                <div class="card-row">
                  <span class="label">Campagne:</span>
                  <span class="value campagne-badge">{{ presence.agent.campagne }}</span>
                </div>

                <!-- Signatures dans les cartes -->
                <div v-if="showSignatures" class="signatures-section">
                  <div class="signature-row">
                    <span class="label">Signature entrée:</span>
                    <div class="signature-preview">
                      <img v-if="presence.details?.signatureEntree" :src="presence.details.signatureEntree"
                        alt="Signature entrée"
                        @click="agrandirSignature(presence.details.signatureEntree, 'Entrée - ' + presence.agent.nom + ' ' + presence.agent.prenom)"
                        class="signature-image-card" />
                      <span v-else class="no-signature">-</span>
                    </div>
                  </div>
                  <div class="signature-row">
                    <span class="label">Signature sortie:</span>
                    <div class="signature-preview">
                      <img v-if="presence.details?.signatureSortie" :src="presence.details.signatureSortie"
                        alt="Signature sortie"
                        @click="agrandirSignature(presence.details.signatureSortie, 'Sortie - ' + presence.agent.nom + ' ' + presence.agent.prenom)"
                        class="signature-image-card" />
                      <span v-else class="no-signature">-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="presences.length === 0 && !loading" class="no-data-mobile">
          Aucune présence trouvée pour les critères sélectionnés.
        </p>
      </div>

      <!-- MODAL POUR AGRANDIR LES SIGNATURES -->
      <div v-if="showSignatureModal" class="signature-modal-mobile" @click="fermerModal">
        <div class="modal-content-mobile" @click.stop>
          <div class="modal-header-mobile">
            <h3>{{ modalTitle }}</h3>
            <button @click="fermerModal" class="btn-close-mobile">×</button>
          </div>
          <div class="modal-body-mobile">
            <img :src="currentSignature" alt="Signature agrandie" class="signature-agrandie-mobile" />
          </div>
          <div class="modal-footer-mobile">
            <button @click="fermerModal" class="btn-primary-mobile">Fermer</button>
          </div>
        </div>
      </div>



    </div>
  </PageModel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { presenceService } from '@/services/presenceApi';
import PageModel from '@/components/organisms/PageModel.vue';
import type { Presence, HistoriqueFilters } from '@/types/index';

// États des filtres
const periodeType = ref<'dates' | 'mois'>('dates');
const dateDebut = ref<string>('');
const dateFin = ref<string>('');
const annee = ref<string>('');
const mois = ref<string>('');
const matricule = ref<string>('');
const nom = ref<string>('');
const prenom = ref<string>('');
const campagne = ref<string>('');
const shift = ref<string>('');

// États de l'application
const presences = ref<Presence[]>([]);
const totalHeures = ref<number>(0);
const totalPresences = ref<number>(0);
const loading = ref<boolean>(false);
const error = ref<string>('');
const showFilters = ref<boolean>(false);
const viewMode = ref<'table' | 'cards'>('table');
const showSignatures = ref<boolean>(false);
const showFab = ref<boolean>(false);

// États pour le modal des signatures
const showSignatureModal = ref<boolean>(false);
const currentSignature = ref<string>('');
const modalTitle = ref<string>('');

// Tri
const colonneTri = ref<string>('date');
const ordreTri = ref<'asc' | 'desc'>('desc');

// Méthodes pour mobile
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const toggleSignatures = () => {
  showSignatures.value = !showSignatures.value;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Gestion du scroll pour le FAB
const handleScroll = () => {
  showFab.value = window.scrollY > 300;
};

// Méthode pour agrandir une signature
const agrandirSignature = (signatureData: string, title: string) => {
  currentSignature.value = signatureData;
  modalTitle.value = title;
  showSignatureModal.value = true;
};

// Méthode pour fermer le modal
const fermerModal = () => {
  showSignatureModal.value = false;
  currentSignature.value = '';
  modalTitle.value = '';
};

// Computed pour vérifier les filtres actifs
const filtresActifs = computed(() => {
  return !!matricule.value || !!nom.value || !!prenom.value || !!campagne.value || !!shift.value;
});

// Données pour les sélecteurs
const anneesDisponibles = computed(() => {
  const annees = new Set<string>();
  const currentYear = new Date().getFullYear();
  for (let year = 2020; year <= currentYear; year++) {
    annees.add(year.toString());
  }
  return Array.from(annees).sort((a, b) => parseInt(b) - parseInt(a));
});

const moisDisponibles = ref([
  { label: 'Janvier', value: '01' },
  { label: 'Février', value: '02' },
  { label: 'Mars', value: '03' },
  { label: 'Avril', value: '04' },
  { label: 'Mai', value: '05' },
  { label: 'Juin', value: '06' },
  { label: 'Juillet', value: '07' },
  { label: 'Août', value: '08' },
  { label: 'Septembre', value: '09' },
  { label: 'Octobre', value: '10' },
  { label: 'Novembre', value: '11' },
  { label: 'Décembre', value: '12' }
]);

// Computed pour les statistiques
const joursTravailles = computed(() => {
  const datesUniques = new Set(presences.value.map(p => p.date));
  return datesUniques.size;
});

const moyenneHeures = computed(() => {
  if (joursTravailles.value === 0) return 0;
  return parseFloat((totalHeures.value / joursTravailles.value).toFixed(2));
})

// Computed pour le tri
const presencesTriees = computed(() => {
  return [...presences.value].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (colonneTri.value) {
      case 'matricule':
        aValue = a.agent.matricule || 'zzzz';
        bValue = b.agent.matricule || 'zzzz';
        break;
      case 'nom':
        aValue = `${a.agent.nom} ${a.agent.prenom}`;
        bValue = `${b.agent.nom} ${b.agent.prenom}`;
        break;
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      default:
        return 0;
    }

    if (ordreTri.value === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
});

// Méthodes
const onPeriodeChange = () => {
  dateDebut.value = '';
  dateFin.value = '';
  annee.value = '';
  mois.value = '';
};

const fetchHistorique = async () => {
  if (periodeType.value === 'dates' && (!dateDebut.value || !dateFin.value)) {
    error.value = 'Veuillez sélectionner une période avec dates début et fin';
    return;
  }

  if (periodeType.value === 'mois' && !annee.value) {
    error.value = 'Veuillez sélectionner une année';
    return;
  }

  try {
    loading.value = true;
    error.value = '';

    const filters: HistoriqueFilters = {
      matricule: matricule.value || undefined,
      nom: nom.value || undefined,
      prenom: prenom.value || undefined,
      campagne: campagne.value || undefined,
      shift: shift.value || undefined
    };

    if (periodeType.value === 'dates') {
      filters.dateDebut = dateDebut.value;
      filters.dateFin = dateFin.value;
    } else {
      filters.annee = annee.value;
      filters.mois = mois.value || undefined;
    }

    console.log('Envoi des filtres au backend:', filters);

    const response = await presenceService.getHistorique(filters);

    if (response.data && response.data.success) {
      presences.value = response.data.data.map((presence: Presence) => ({
        ...presence,
        heuresTravaillees: presence.heuresTravaillees ?
          parseFloat(Number(presence.heuresTravaillees).toFixed(2)) :
          undefined,
        agent: {
          ...presence.agent,
          matricule: presence.agent.matricule || 'Non défini'
        }
      }))

      totalHeures.value = parseFloat(Number(response.data.totalHeures || 0).toFixed(2));
      totalPresences.value = Number(response.data.totalPresences) || 0;

      console.log(`✅ ${presences.value.length} présence(s) trouvée(s)`);
    } else {
      presences.value = [];
      totalHeures.value = 0;
      totalPresences.value = 0;
      error.value = 'Aucune donnée reçue du serveur';
    }

  } catch (err: any) {
    console.error('Erreur:', err);
    error.value = err.response?.data?.error || err.message || 'Erreur lors de la récupération des données';
    presences.value = [];
    totalHeures.value = 0;
    totalPresences.value = 0;
  } finally {
    loading.value = false;
    // Fermer les filtres après recherche sur mobile
    if (window.innerWidth < 768) {
      showFilters.value = false;
    }
  }
};

const exporterPDF = async () => {
  try {
    loading.value = true;
    error.value = '';

    const filters: HistoriqueFilters = {
      matricule: matricule.value || undefined,
      nom: nom.value || undefined,
      prenom: prenom.value || undefined,
      campagne: campagne.value || undefined,
      shift: shift.value || undefined
    };

    if (periodeType.value === 'dates') {
      filters.dateDebut = dateDebut.value;
      filters.dateFin = dateFin.value;
    } else {
      filters.annee = annee.value;
      filters.mois = mois.value || undefined;
    }

    console.log('Export PDF avec filtres:', filters);

    const response = await presenceService.exportHistorique(filters, 'pdf');

    if (!response.data) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique-presences-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (err: any) {
    console.error('Erreur export PDF:', err);
    error.value = err.response?.data?.error || err.message || 'Erreur lors de l\'export PDF';
  } finally {
    loading.value = false;
  }
};

const triColonne = (colonne: string) => {
  if (colonneTri.value === colonne) {
    ordreTri.value = ordreTri.value === 'asc' ? 'desc' : 'asc';
  } else {
    colonneTri.value = colonne;
    ordreTri.value = 'asc';
  }
};

const getSortIcon = (colonne: string) => {
  if (colonneTri.value !== colonne) return '↕️';
  return ordreTri.value === 'asc' ? '↑' : '↓';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatHeures = (heures: number): string => {
  if (!heures && heures !== 0) return '0.00';
  return parseFloat(heures.toString()).toFixed(2);
};

const reinitialiserFiltres = () => {
  dateDebut.value = '';
  dateFin.value = '';
  annee.value = '';
  mois.value = '';
  matricule.value = '';
  nom.value = '';
  prenom.value = '';
  campagne.value = '';
  shift.value = '';
  presences.value = [];
  totalHeures.value = 0;
  totalPresences.value = 0;
  error.value = '';
};

let refreshInterval: number;

// Initialisation
onMounted(() => {
  const now = new Date();
  annee.value = now.getFullYear().toString();
  mois.value = (now.getMonth() + 1).toString().padStart(2, '0');
  periodeType.value = 'mois';

  // Détection automatique du mode mobile
  if (window.innerWidth < 768) {
    viewMode.value = 'cards';
    showFilters.value = false;
  }

  // Écouteur de scroll pour le FAB
  window.addEventListener('scroll', handleScroll);

  refreshInterval = window.setInterval(() => {
    if (presences.value.length > 0 && !loading.value) {
      fetchHistorique();
    }
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* STYLES MOBILE FIRST AVEC NOUVELLE CHARTE GRAPHIQUE */
.mobile-optimized {
  max-width: 100%;
  margin: 0;
  padding: 1rem;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
}

h1 {
  color: #ffc107;
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1.5rem;
}

/* FILTRES MOBILE */
.mobile-filter {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f0f0f5;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #f0f0f5;
}

.toggle-icon {
  font-size: 1.2rem;
  color: #ffc107;
}

.filter-content {
  margin-top: 1rem;
}

.filter-group-mobile {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.filter-group-mobile label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #f0f0f5;
  font-size: 0.9rem;
}





.mobile-input,
.mobile-select {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #000007;
  width: 100%;
}



.mobile-input::placeholder {
  color: rgba(240, 240, 245, 0.7);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.mobile-btn {
  padding: 1rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  color: white;
}

.btn-search {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-export {
  background: #28a745;
}

.btn-reset {
  background: #95a5a6;
}

.mobile-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mobile-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* CHARGEMENT MOBILE */
.loading-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #f0f0f5;
  gap: 1rem;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* ERREUR MOBILE */
.error-mobile {
  background: rgba(220, 53, 69, 0.2);
  color: #f8d7da;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(220, 53, 69, 0.3);
  text-align: center;
}

/* STATISTIQUES MOBILE */
.stats-section-mobile {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card-mobile {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #ffc107;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
  color: #f0f0f5;
}

/* RÉSULTATS MOBILE */
.results-info-mobile {
  margin-bottom: 1rem;
  font-weight: 600;
  color: #f0f0f5;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
}

.filtres-actifs-mobile {
  font-size: 0.8rem;
  color: #ffc107;
  margin-top: 0.5rem;
}

/* TABLEAU AVEC DÉFILEMENT */
.table-container-mobile {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
}

.table-scroll-wrapper {
  min-width: 800px;
}

.presence-table-mobile {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.presence-table-mobile th,
.presence-table-mobile td {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  white-space: nowrap;
  color: #f0f0f5;
}

.presence-table-mobile th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  font-weight: 600;
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px);
}

.sortable-mobile {
  cursor: pointer;
}

.sortable-mobile:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-cell {
  padding: 0.5rem;
}

.nom-cell-mobile {
  text-align: left;
}

.nom-complet-mobile {
  display: flex;
  flex-direction: column;
}

.nom-mobile {
  font-weight: 600;
  color: #f0f0f5;
  font-size: 0.8rem;
}

.prenom-mobile {
  color: rgba(240, 240, 245, 0.8);
  font-size: 0.75rem;
}

.heures-cell {
  font-weight: 600;
  color: #ffc107;
  font-family: 'Courier New', monospace;
}

.signature-cell-mobile {
  text-align: center;
}

.signature-container-mobile {
  display: flex;
  justify-content: center;
}

.signature-image-mobile {
  max-width: 40px;
  max-height: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
}

.no-signature-mobile {
  color: rgba(240, 240, 245, 0.6);
  font-style: italic;
}

.scroll-indicator {
  text-align: center;
  padding: 0.5rem;
  color: rgba(240, 240, 245, 0.7);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 0.5rem;
}

/* VUE CARTES */
.cards-view-mobile {
  margin-top: 1.5rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.view-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #3498db;
  background: transparent;
  color: #f0f0f5;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  min-width: 100px;
}

.view-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #3498db;
}

.signature-toggle {
  border-color: #28a745;
  color: #28a745;
}

.signature-toggle.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.presence-card-mobile {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3498db;
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-title strong {
  color: #f0f0f5;
  font-size: 1.1rem;
}

.matricule-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffc107;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
}

.card-date {
  color: #ffc107;
  font-size: 0.9rem;
  font-weight: 600;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.card-row .label {
  color: rgba(240, 240, 245, 0.8);
  font-size: 0.9rem;
}

.card-row .value {
  color: #f0f0f5;
  font-weight: 600;
  font-size: 0.9rem;
}

.heures-value {
  color: #ffc107;
  font-family: 'Courier New', monospace;
}

.shift-badge,
.campagne-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #f0f0f5;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

/* SIGNATURES DANS LES CARTES */
.signatures-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.signature-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.signature-preview {
  display: flex;
  align-items: center;
}

.signature-image-card {
  max-width: 60px;
  max-height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
}

/* MODAL MOBILE */
.signature-modal-mobile {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content-mobile {
  background: rgba(30, 60, 114, 0.95);
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.modal-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  border-radius: 8px 8px 0 0;
}

.modal-header-mobile h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #ffc107;
}

.btn-close-mobile {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #f0f0f5;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close-mobile:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body-mobile {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.signature-agrandie-mobile {
  max-width: 100%;
  max-height: 50vh;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.modal-footer-mobile {
  padding: 1rem;
  text-align: center;
}

.btn-primary-mobile {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary-mobile:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* FLOATING ACTION BUTTON */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 1rem;
  z-index: 100;
}

.fab-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.fab-button:hover {
  transform: scale(1.1);
}

/* MESSAGE AUCUNE DONNÉE */
.no-data-mobile {
  text-align: center;
  padding: 3rem;
  color: #f0f0f5;
  font-style: italic;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin: 2rem 0;
  backdrop-filter: blur(10px);
}

/* MEDIA QUERIES POUR TABLETTE ET DESKTOP */
@media (min-width: 768px) {
  .mobile-optimized {
    padding: 2rem;
    max-width: 1400px;
  }

  h1 {
    font-size: 2rem;
  }

  .mobile-filter {
    padding: 1.5rem;
  }

  .filter-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .filter-group-mobile {
    margin-bottom: 0;
  }

  .mobile-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: flex-end;
  }

  .mobile-btn {
    flex: 1;
    max-width: 200px;
  }

  .stats-section-mobile {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .stat-card-mobile {
    padding: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .table-container-mobile {
    padding: 1rem;
  }

  .presence-table-mobile {
    font-size: 0.9rem;
  }

  .presence-table-mobile th,
  .presence-table-mobile td {
    padding: 0.75rem;
  }

  .view-toggle {
    justify-content: center;
  }

  .view-btn {
    flex: none;
    min-width: 150px;
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .filter-content {
    grid-template-columns: repeat(4, 1fr);
  }

  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

/* Améliorations pour très petits écrans */
@media (max-width: 360px) {
  .mobile-optimized {
    padding: 0.5rem;
  }

  h1 {
    font-size: 1.3rem;
  }

  .stat-card-mobile {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .mobile-btn {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .presence-card-mobile {
    padding: 0.75rem;
  }

  .card-header {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Dans HistoriquePresence.vue - Ajouter ces styles */
.info-banner-mobile {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffc107;
  backdrop-filter: blur(10px);
}

.info-icon {
  font-size: 1.2rem;
}

.info-text {
  flex: 1;
  font-size: 0.9rem;
}
</style>