<template>
  <div class="card">
    <div class="card-header custom-header">
      <h5><i class="bi bi-file-excel"></i> Importation Excel Multi-Mois</h5>
    </div>
    <div class="card-body">
      <div class="drop-zone p-4 border-2 border-dashed rounded-3 text-center" :class="{
        'border-primary': isDragging,
        'border-success': selectedFile,
        'border-light': !isDragging && !selectedFile
       }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop="handleDrop"
        @click="focusFileInput">
        <i class="bi bi-file-earmark-excel display-4 text-success mb-2"></i>
        <p class="mb-2">Glissez-déposez votre fichier Excel ici</p>
        <p class="text-muted small mb-3">ou</p>

        <input type="file" ref="fileInputRef" @change="handleFileSelect" accept=".xlsx, .xls" class="d-none"
          id="fileInput">

        <label for="fileInput" class="btn btn-outline-primary mb-2 primary-btn">
          <i class="bi bi-folder2-open"></i> Parcourir les fichiers
        </label>

        <div v-if="selectedFile" class="mt-3">
          <div class="alert alert-success py-2 mb-0 d-flex align-items-center">
            <i class="bi bi-check-circle me-2"></i>
            <div>
              <strong class="important-text">{{ selectedFile.name }}</strong>
              <small class="d-block">({{ formatFileSize(selectedFile.size) }})</small>
            </div>
            <button type="button" class="btn-close ms-auto" @click.stop="removeFile"
              aria-label="Supprimer le fichier"></button>
          </div>
        </div>
      </div>

      <button v-if="selectedFile && !uploading" @click="uploadFile" class="btn btn-success w-100 mt-3 primary-btn">
        <i class="bi bi-upload"></i> Importer le Planning
      </button>

      <div v-if="uploading" class="mt-3 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Import en cours...</span>
        </div>
        <p class="mt-2">Importation en cours...</p>
      </div>

      <div v-if="uploadSuccess" class="alert alert-success mt-3">
        <i class="bi bi-check-circle"></i> {{ uploadSuccessMessage || `Import réussi ! ${uploadSuccessCount} agents
        ajoutés pour ${uploadSuccessWeeks.length} semaines.` }}
      </div>

      <div v-if="errorMessage" class="alert alert-danger mt-3">
        <i class="bi bi-exclamation-triangle"></i> {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UploadResponse } from '@/types/Planning';
import { PlanningService } from '@/services/PlanningService';

const emit = defineEmits<{
  (e: 'upload', result: UploadResponse): void;
  (e: 'error', message: string): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadSuccess = ref(false);
const uploadSuccessCount = ref(0);
const uploadSuccessWeeks = ref<string[]>([]);
const uploadSuccessMessage = ref('');
const errorMessage = ref('');

const focusFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    isDragging.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file;
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  errorMessage.value = '';
  uploadSuccess.value = false;

  try {
    const result: UploadResponse = await PlanningService.uploadPlanning(selectedFile.value);

    uploadSuccess.value = true;
    uploadSuccessCount.value = result.count || 0;
    uploadSuccessWeeks.value = result.weeks || [];
    uploadSuccessMessage.value = result.message || '';

    emit('upload', result);
  } catch (error: any) {
    console.error('Erreur upload:', error);
    errorMessage.value = error.message || 'Erreur lors de l\'upload du fichier';
    emit('error', errorMessage.value);
  } finally {
    uploading.value = false;
  }
};

const removeFile = () => {
  selectedFile.value = null;
  uploadSuccess.value = false;
  errorMessage.value = '';
  uploadSuccessMessage.value = '';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.card {
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.custom-header {
  background: rgba(255, 255, 255, 0.1);
  color: #ffc107;
  border: none;
  border-radius: 8px 8px 0 0;
}

.card-body {
  background: rgba(255, 255, 255, 0.1);
}

.drop-zone {
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
}

.primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: transparent;
  color: white;
  border-radius: 25px;
  font-weight: 600;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-2px);
}

.btn {
  border-radius: 25px;
}

.drop-zone:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #4361ee !important;
}

.border-dashed {
  border-style: dashed !important;
}

.alert-success {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  color: #f0f0f5;
  border-radius: 8px;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #f0f0f5;
  border-radius: 8px;
}

.important-text {
  color: #ffc107;
}

.text-muted {
  color: rgba(240, 240, 245, 0.7) !important;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>