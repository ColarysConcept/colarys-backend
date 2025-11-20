<template>
  <div class="agent-card">
    <div class="agent-image">
      <img 
        :src="getImageUrl(agent.image)" 
        :alt="`${agent.nom} ${agent.prenom}`"
        @error="handleImageError"
      />
    </div>
    <div class="agent-info">
      <h3>{{ agent.nom }} {{ agent.prenom }}</h3>
      <p class="role">{{ agent.role }}</p>
      <p class="entreprise">{{ agent.entreprise }}</p>
    </div>
    <div class="agent-actions">
      <button @click="$emit('view-details', agent.id)" class="btn-details">
        Détails
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentColarys } from '@/types/AgentColarys';

defineProps<{
  agent: AgentColarys;
}>();

defineEmits<{
  'view-details': [id: number];
  'edit-agent': [agent: AgentColarys];
}>();

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
</script>

<style scoped>
.agent-card {
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.agent-image img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.agent-info {
  flex: 1;
}

.agent-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1em;
  color: #ffc107;
}

.role {
  color: #f0f0f5;
  margin: 0 0 4px 0;
  font-size: 0.9em;
}

.entreprise {
  color: #f0f0f5;
  margin: 0;
  font-size: 0.8em;
  font-weight: bold;
}

.agent-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-details {
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  transition: all 0.3s ease;
}

.btn-details:hover {
  background: linear-gradient(135deg, #2980b9, #1f618d);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}
</style>