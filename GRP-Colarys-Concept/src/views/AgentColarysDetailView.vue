<template>
  <div class="agent-detail-view">
    <div v-if="loading" class="loading">Chargement...</div>
    
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="$router.back()" class="btn-back">Retour</button>
    </div>

    <div v-else-if="agent" class="agent-detail">
      <h1>Détails de l'agent</h1>

      <div class="agent-content">
        <div class="agent-image">
          <img 
            :src="getImageUrl(agent.image)" 
            :alt="`${agent.nom} ${agent.prenom}`"
            @error="handleImageError"
          />
        </div>
        
        <div class="agent-info">
          <div class="agent-header">
            <h2>{{ agent.nom }} {{ agent.prenom }}</h2>
            <p class="entreprise">{{ agent.entreprise }}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Matricule:</div>
              <div class="info-value">{{ agent.matricule }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Rôle:</div>
              <div class="info-value">{{ agent.role }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Email:</div>
              <div class="info-value">{{ agent.mail }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Contact:</div>
              <div class="info-value">{{ agent.contact || 'Non renseigné' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-container">
        <button @click="$router.back()" class="btn-back">
          <span class="btn-icon">←</span>
          Retour
        </button>
        <div class="action-buttons">
          <button @click="openEditForm" class="btn-edit">
            <span class="btn-icon">✏️</span>
            Modifier
          </button>
          <button @click="confirmDelete" class="btn-delete">
            <span class="btn-icon">🗑️</span>
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <div v-if="showForm && agent" class="modal">
      <div class="modal-content">
        <AgentColarysForm
          :agent="agent"
          :loading="formLoading"
          @submit="handleUpdate"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AgentColarysForm from '@/components/AgentColarysForm.vue';
import { AgentColarysService } from '@/services/AgentColarysService';
import type { AgentColarys, CreateAgentColarysRequest } from '@/types/AgentColarys';

const route = useRoute();
const router = useRouter();

const agentService = new AgentColarysService();
const agent = ref<AgentColarys | null>(null);
const loading = ref(false);
const error = ref('');
const showForm = ref(false);
const formLoading = ref(false);

// Fonction pour obtenir un ID valide
function getValidAgentId(): number | null {
  const idParam = route.params.id;
  const idString = Array.isArray(idParam) ? idParam[0] : idParam;
  
  if (typeof idString !== 'string') {
    return null;
  }
  
  const id = parseInt(idString, 10);
  return isNaN(id) ? null : id;
}

// Observer les changements de route
watch(
  () => route.params.id,
  () => {
    loadAgent();
  }
);

onMounted(() => {
  loadAgent();
});

async function loadAgent() {
  try {
    const agentId = getValidAgentId();
    if (!agentId) {
      error.value = 'ID d\'agent invalide';
      return;
    }

    loading.value = true;
    error.value = '';
    
    agent.value = await agentService.getAgentById(agentId);
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Erreur lors du chargement des détails de l\'agent';
    }
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    return '/default-avatar.png';
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `http://localhost:3000${imagePath}`;
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = '/default-avatar.png';
}

function openEditForm() {
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
}

async function handleUpdate(agentData: FormData | CreateAgentColarysRequest) {
  try {
    formLoading.value = true;
    
    const agentId = getValidAgentId();
    if (!agentId || !agent.value) {
      throw new Error('Aucun agent valide à modifier');
    }
    
    await agentService.updateAgent(agentId, agentData);
    await loadAgent();
    closeForm();
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Erreur inconnue lors de la modification';
    }
  } finally {
    formLoading.value = false;
  }
}

async function confirmDelete() {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
    try {
      const agentId = getValidAgentId();
      if (!agentId || !agent.value) {
        throw new Error('Aucun agent valide à supprimer');
      }
      
      await agentService.deleteAgent(agentId);
      router.push('/agents');
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Erreur inconnue lors de la suppression';
      }
    }
  }
}
</script>

<style scoped>
.agent-detail-view {
  padding: 30px 20px;
  max-width: 900px;
  margin: 0 auto;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.agent-detail {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeIn 0.6s ease-out;
}

h1 {
  color: #ffc107;
  margin-bottom: 35px;
  text-align: center;
  font-size: 2.2rem;
  font-weight: 700;
}

.agent-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
  align-items: start;
  margin-bottom: 35px;
}

.agent-image {
  display: flex;
  justify-content: center;
}

.agent-image img {
  width: 100%;
  max-width: 250px;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.agent-info {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.agent-header {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.agent-header h2 {
  color: #ffc107;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.entreprise {
  color: #f0f0f5;
  font-size: 1.3rem;
  font-weight: 500;
  margin: 0;
}

.info-grid {
  display: grid;
  gap: 18px;
}

.info-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 15px;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(5px);
  border-color: rgba(52, 152, 219, 0.3);
}

.info-label {
  font-weight: 600;
  color: #f0f0f5;
  font-size: 1.05rem;
}

.info-value {
  color: #ffc107;
  font-size: 1.05rem;
  word-break: break-word;
}

.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.btn-back, .btn-edit, .btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 130px;
  justify-content: center;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-back:hover {
  background: #95a5a6;
  color: white;
  transform: translateY(-2px);
}

.btn-edit {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #2980b9, #1f618d);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-delete {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

.modal {
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

.loading, .error {
  text-align: center;
  padding: 50px 20px;
  font-size: 1.1rem;
  color: #ffc107;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error {
  border-color: rgba(231, 76, 60, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .agent-detail-view {
    padding: 20px 15px;
    justify-content: flex-start;
  }
  
  .agent-detail {
    padding: 30px 20px;
  }
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 25px;
  }
  
  .agent-content {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-bottom: 25px;
  }
  
  .agent-image img {
    max-width: 200px;
  }
  
  .agent-header h2 {
    font-size: 1.5rem;
  }
  
  .entreprise {
    font-size: 1.1rem;
  }
  
  .info-item {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
    padding: 14px;
  }
  
  .actions-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .btn-back, .btn-edit, .btn-delete {
    width: 100%;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .agent-detail {
    padding: 25px 15px;
  }
  
  h1 {
    font-size: 1.6rem;
  }
  
  .agent-header h2 {
    font-size: 1.3rem;
  }
  
  .agent-image img {
    max-width: 180px;
  }
  
  .btn-back, .btn-edit, .btn-delete {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
}
</style>