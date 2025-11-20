<template>
  <PageModel>
    <div class="agents-view">
      <div class="container">
        <div class="header-section">
          <div class="header-content">
            <h1>Gestion des Agents - Colarys Concept</h1>
            <br>
            <p class="subtitle">Liste complète des agents de l'entreprise</p>
          </div>
          <br>
          <button @click="openCreateForm" class="btn-add">
            <span class="btn-icon">+</span>
            Ajouter un agent
          </button>
        </div>

        <!-- Statistiques rapides -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ agents.length }}</div>
            <div class="stat-label">Agents au total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getAdminCount }}</div>
            <div class="stat-label">Admin</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getMedadomCount }}</div>
            <div class="stat-label">Medadom</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getKlekoonCount }}</div>
            <div class="stat-label">Klekoon</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStandardTCount }}</div>
            <div class="stat-label">StandardT</div>
          </div>
            <div class="stat-card">
            <div class="stat-number">{{ getStagiaireCount }}</div>
            <div class="stat-label">Stagiaire</div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des agents...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <p>{{ error }}</p>
          <button @click="loadAgents" class="btn-retry">Réessayer</button>
        </div>

        <div v-else class="agents-content">
          <div class="agents-header">
            <div class="search-section">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input v-model="searchQuery" type="text" placeholder="Rechercher un agent..." class="search-input" />
              </div>
              <div class="filter-section">
                <select v-model="roleFilter" class="filter-select">
                  <option value="">Tous les rôles</option>
                  <option value="Admin">Admin</option>
                  <option value="Medadom">Medadom</option>
                  <option value="Klekoon">Klekoon</option>
                  <option value="StandardT">StandardT</option>
                  <option value="Commerciale">Commerciale</option>
                  <option value="Stagiaire">Stagiaire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div class="results-info">
              {{ filteredAgents.length }} agent(s) trouvé(s)
            </div>
          </div>

          <div v-if="filteredAgents.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Aucun agent trouvé</h3>
            <p>Aucun agent ne correspond à votre recherche.</p>
            <button @click="clearFilters" class="btn-clear">Effacer les filtres</button>
          </div>

          <div v-else class="agents-grid">
            <AgentColarysCard v-for="agent in filteredAgents" :key="agent.id" :agent="agent"
              @view-details="viewAgentDetails" @edit-agent="openEditForm" />
          </div>
        </div>

        <!-- Modal pour création -->
        <div v-if="showCreateForm" class="modal-overlay">
          <div class="modal-content">
            <AgentColarysForm :loading="formLoading" @submit="handleCreateSubmit" @cancel="closeCreateForm" />
          </div>
        </div>

        <!-- Modal pour modification -->
        <div v-if="showEditForm && editingAgent" class="modal-overlay">
          <div class="modal-content">
            <AgentColarysForm :agent="editingAgent" :loading="formLoading" @submit="handleEditSubmit"
              @cancel="closeEditForm" />
          </div>
        </div>
      </div>
    </div>
  </PageModel>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageModel from '@/components/organisms/PageModel.vue';
import AgentColarysCard from '@/components/AgentColarysCard.vue';
import AgentColarysForm from '@/components/AgentColarysForm.vue';
import { AgentColarysService } from '@/services/AgentColarysService';
import type { AgentColarys, CreateAgentColarysRequest } from '@/types/AgentColarys';

const router = useRouter();
const agentService = new AgentColarysService();

const agents = ref<AgentColarys[]>([]);
const loading = ref(false);
const error = ref('');
const showCreateForm = ref(false);
const showEditForm = ref(false);
const formLoading = ref(false);
const editingAgent = ref<AgentColarys | null>(null);
const searchQuery = ref('');
const roleFilter = ref('');

// Chargement des agents - CORRIGÉ
const loadAgents = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // ✅ CORRECTION : Appel sur l'instance, pas sur la classe
    const data = await agentService.getAllAgents();
    
    // S'assurer que agents est toujours un tableau
    agents.value = Array.isArray(data) ? data : [];
    
    console.log(`📊 ${agents.value.length} agents chargés dans le composant`);
  } catch (err) {
    console.error('❌ Erreur loadAgents:', err);
    error.value = 'Erreur lors du chargement des agents';
    agents.value = []; // S'assurer que c'est un tableau même en cas d'erreur
  } finally {
    loading.value = false;
  }
};

// Computed property avec sécurité
const filteredAgents = computed(() => {
  if (!Array.isArray(agents.value)) {
    console.warn('⚠️ agents.value is not an array:', agents.value);
    return [];
  }
  
  const query = searchQuery.value.toLowerCase();
  const role = roleFilter.value;
  
  return agents.value.filter(agent => {
    const matchesSearch = !query || 
      agent.nom?.toLowerCase().includes(query) ||
      agent.prenom?.toLowerCase().includes(query) ||
      agent.matricule?.toLowerCase().includes(query) ||
      agent.mail?.toLowerCase().includes(query);

    const matchesRole = !role || agent.role === role;

    return matchesSearch && matchesRole;
  });
});

onMounted(() => {
  loadAgents();
});

const getAdminCount = computed(() => {
  return agents.value.filter(agent => agent.role === 'Admin').length;
});

const getMedadomCount = computed(() => {
  return agents.value.filter(agent => agent.role === 'Medadom').length;
});

const getKlekoonCount = computed(() => {
  return agents.value.filter(agent => agent.role === 'Klekoon').length;
});

const getStandardTCount = computed(() => {
  return agents.value.filter(agent => agent.role === 'StandardT').length;
});

const getStagiaireCount = computed(() => {
  return agents.value.filter(agent => agent.role === 'Stagiaire').length;
});

function viewAgentDetails(agentId: number) {
  if (!agentId || isNaN(agentId)) {
    error.value = 'ID d\'agent invalide';
    return;
  }
  router.push(`/agent/${agentId}`);
}

function openCreateForm() {
  showCreateForm.value = true;
}

function closeCreateForm() {
  showCreateForm.value = false;
}

function openEditForm(agent: AgentColarys) {
  editingAgent.value = agent;
  showEditForm.value = true;
}

function closeEditForm() {
  showEditForm.value = false;
  editingAgent.value = null;
}

function clearFilters() {
  searchQuery.value = '';
  roleFilter.value = '';
}

async function handleCreateSubmit(agentData: FormData | CreateAgentColarysRequest) {
  try {
    formLoading.value = true;
    await agentService.createAgent(agentData);
    closeCreateForm();
    await loadAgents();
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création';
  } finally {
    formLoading.value = false;
  }
}

async function handleEditSubmit(agentData: FormData | CreateAgentColarysRequest) {
  try {
    formLoading.value = true;

    if (!editingAgent.value) {
      throw new Error('Aucun agent à modifier');
    }

    const id = editingAgent.value.id;
    await agentService.updateAgent(id, agentData);

    closeEditForm();
    await loadAgents();
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la modification';
  } finally {
    formLoading.value = false;
  }
}
</script>

<style scoped>
.agents-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 30px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.header-content h1 {
  color: #ffc107;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #f0f0f5;
  font-size: 1.1rem;
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 25px 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.3);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffc107;
  margin-bottom: 8px;
}

.stat-label {
  color: #f0f0f5;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid #ffc107;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 50px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #ffc107;
}

.error-state p {
  color: #ffc107;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.btn-retry {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: linear-gradient(135deg, #2980b9, #1f618d);
  transform: translateY(-2px);
}

/* Agents Content */
.agents-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.agents-header {
  margin-bottom: 30px;
}

.search-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #f0f0f5;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.filter-select {
  padding: 12px 15px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

.filter-select option {
  background: #2a5298;
  color: white;
}

.results-info {
  color: #ffc107;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #f0f0f5;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #ffc107;
}

.empty-state h3 {
  color: #ffc107;
  margin-bottom: 10px;
}

.btn-clear {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

/* Agents Grid */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .agents-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .agents-content {
    padding: 20px;
  }

  .agents-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.7rem;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }
}
</style>