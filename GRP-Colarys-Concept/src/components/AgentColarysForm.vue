<template>
  <form @submit.prevent="handleSubmit" class="agent-form">
    <h2>{{ isEditing ? 'Modifier' : 'Ajouter' }} un agent Colarys</h2>

    <!-- Section Upload d'Image -->
    <div class="image-upload-section">
      <div class="image-preview" @click="triggerFileInput">
        <img v-if="imagePreview" :src="imagePreview" alt="Aperçu de l'image" class="preview-image" />
        <div v-else class="upload-placeholder">
          <i class="upload-icon">📷</i>
          <span>Cliquer pour uploader une image</span>
        </div>
        <input ref="fileInput" type="file" @change="handleFileUpload" accept="image/*" class="file-input"
          style="display: none;" />
      </div>
      <div class="image-actions" v-if="imagePreview">
        <button type="button" @click="removeImage" class="btn-remove">
          Supprimer l'image
        </button>
      </div>
    </div>

    <div class="form-group">
      <label>Matricule *</label>
      <input v-model="formData.matricule" type="text" required :disabled="isEditing" />
      <small class="form-help">Le matricule doit être unique et ne peut pas être modifié après création</small>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Nom *</label>
        <input v-model="formData.nom" type="text" required />
      </div>
      <div class="form-group">
        <label>Prénom *</label>
        <input v-model="formData.prenom" type="text" required />
      </div>
    </div>

    <div class="form-group">
      <label>Rôle *</label>
      <select v-model="formData.role" required>
        <option value="">Sélectionner un rôle</option>
        <option value="Admin">Admin</option>
        <option value="Medadom">Medadom</option>
        <option value="Klekoon">Klekoon</option>
        <option value="StandardT">StandardT</option>
        <option value="Commerciale">Commerciale</option>
        <option value="Stagiaire">Stagiaire</option>
        <option value="Autre">Autre</option>
      </select>
    </div>

    <div class="form-group">
      <label>Email *</label>
      <input v-model="formData.mail" type="email" required />
      <small class="form-help">L'email doit être unique pour chaque agent</small>
    </div>

    <div class="form-group">
      <label>Contact</label>
      <input v-model="formData.contact" type="tel" placeholder="+33 1 23 45 67 89" />
    </div>

    <div class="form-group" v-if="!isEditing">
      <label>Entreprise</label>
      <input v-model="formData.entreprise" type="text" disabled />
      <small class="form-help">L'entreprise est définie par défaut sur "Colarys Concept"</small>
    </div>

    <div class="form-actions">
      <button type="button" @click="$emit('cancel')" class="btn-cancel">
        Annuler
      </button>
      <button type="submit" class="btn-submit" :disabled="loading || !isFormValid">
        {{ loading ? 'En cours...' : (isEditing ? 'Modifier' : 'Ajouter') }}
      </button>
    </div>

    <!-- Progress Bar pour l'upload -->
    <div v-if="uploadProgress > 0" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <span>{{ uploadProgress }}%</span>
    </div>

    <!-- Validation errors -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <h4>Veuillez corriger les erreurs suivantes :</h4>
      <ul>
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { AgentColarys, CreateAgentColarysRequest } from '@/types/AgentColarys';

const props = defineProps<{
  agent?: AgentColarys;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: FormData | CreateAgentColarysRequest];
  cancel: [];
}>();

const fileInput = ref<HTMLInputElement>();
const isEditing = ref(!!props.agent);
const selectedFile = ref<File | null>(null);
const imagePreview = ref<string>('');
const uploadProgress = ref(0);
const validationErrors = ref<string[]>([]);

interface FormDataInterface {
  matricule: string;
  nom: string;
  prenom: string;
  role: string;
  mail: string;
  contact: string;
  entreprise: string;
  image?: string;
}

const formData = reactive<FormDataInterface>({
  matricule: '',
  nom: '',
  prenom: '',
  role: '',
  mail: '',
  contact: '',
  entreprise: 'Colarys Concept'
});

// Validation du formulaire
const isFormValid = computed(() => {
  validationErrors.value = [];

  if (!formData.matricule.trim()) {
    validationErrors.value.push('Le matricule est obligatoire');
  }

  if (!formData.nom.trim()) {
    validationErrors.value.push('Le nom est obligatoire');
  }

  if (!formData.prenom.trim()) {
    validationErrors.value.push('Le prénom est obligatoire');
  }

  if (!formData.role.trim()) {
    validationErrors.value.push('Le rôle est obligatoire');
  }

  if (!formData.mail.trim()) {
    validationErrors.value.push('L\'email est obligatoire');
  } else if (!isValidEmail(formData.mail)) {
    validationErrors.value.push('L\'email n\'est pas valide');
  }

  if (formData.contact && !isValidPhone(formData.contact)) {
    validationErrors.value.push('Le format du contact n\'est pas valide');
  }

  return validationErrors.value.length === 0;
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

watch(() => props.agent, (newAgent) => {
  if (newAgent) {
    Object.assign(formData, {
      matricule: newAgent.matricule,
      nom: newAgent.nom,
      prenom: newAgent.prenom,
      role: newAgent.role,
      mail: newAgent.mail,
      contact: newAgent.contact || '',
      entreprise: newAgent.entreprise,
      image: newAgent.image || ''
    });

    // Afficher l'image existante
    if (newAgent.image) {
      imagePreview.value = newAgent.image.startsWith('http')
        ? newAgent.image
        : `http://localhost:3000${newAgent.image}`;
    }

    isEditing.value = true;
  } else {
    resetForm();
    isEditing.value = false;
  }
}, { immediate: true });

function resetForm() {
  Object.assign(formData, {
    matricule: '',
    nom: '',
    prenom: '',
    role: '',
    mail: '',
    contact: '',
    entreprise: 'Colarys Concept'
  });
  if ('image' in formData) {
    delete (formData as any).image;
  }
  selectedFile.value = null;
  imagePreview.value = '';
  uploadProgress.value = 0;
  validationErrors.value = [];
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    selectedFile.value = file;

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Simuler la progression de l'upload
    simulateUploadProgress();
  }
}

function simulateUploadProgress() {
  uploadProgress.value = 0;
  const interval = setInterval(() => {
    uploadProgress.value += 10;
    if (uploadProgress.value >= 100) {
      clearInterval(interval);
    }
  }, 100);
}

function removeImage() {
  selectedFile.value = null;
  imagePreview.value = '';
  if ('image' in formData) {
    delete (formData as any).image;
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  uploadProgress.value = 0;
}

function handleSubmit() {
  if (!isFormValid.value) {
    return;
  }

  if (selectedFile.value) {
    // Utiliser FormData pour l'upload de fichier
    const formDataObj = new FormData();
    formDataObj.append('matricule', formData.matricule);
    formDataObj.append('nom', formData.nom);
    formDataObj.append('prenom', formData.prenom);
    formDataObj.append('role', formData.role);
    formDataObj.append('mail', formData.mail);
    formDataObj.append('contact', formData.contact);
    formDataObj.append('entreprise', formData.entreprise);
    formDataObj.append('image', selectedFile.value);

    emit('submit', formDataObj);
  } else {
    // Créer un objet sans la propriété image si c'est une data URL
    const submitData: CreateAgentColarysRequest = {
      matricule: formData.matricule,
      nom: formData.nom,
      prenom: formData.prenom,
      role: formData.role,
      mail: formData.mail,
      contact: formData.contact,
      entreprise: formData.entreprise
    };

    // Ajouter l'image seulement si elle existe et n'est pas une data URL
    if (formData.image && !imagePreview.value.startsWith('data:')) {
      submitData.image = formData.image;
    }

    emit('submit', submitData);
  }
}
</script>

<style scoped>
.agent-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.agent-form h2 {
  color: #ffc107;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
  font-weight: 700;
}

/* Section Upload d'Image */
.image-upload-section {
  text-align: center;
  margin-bottom: 30px;
}

.image-preview {
  width: 180px;
  height: 180px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  margin: 0 auto 15px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.image-preview:hover {
  border-color: #3498db;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.upload-placeholder {
  text-align: center;
  color: #f0f0f5;
  padding: 20px;
}

.upload-icon {
  font-size: 2.5em;
  display: block;
  margin-bottom: 10px;
  opacity: 0.7;
}

.image-actions {
  margin-top: 12px;
}

.btn-remove {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

/* Formulaire */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #f0f0f5;
  font-size: 1.05rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.form-group input:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.form-help {
  display: block;
  margin-top: 5px;
  color: #f0f0f5;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.8;
}

/* Options du select */
.form-group select option {
  background: #2a5298;
  color: white;
  padding: 10px;
}

/* Actions du formulaire */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  padding: 14px 28px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-cancel:hover {
  background: #95a5a6;
  color: white;
  transform: translateY(-2px);
}

.btn-submit {
  padding: 14px 28px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #1f618d);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-submit:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

/* Barre de progression */
.upload-progress {
  margin-top: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #28a745, #20c997);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.upload-progress span {
  color: #ffc107;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Validation errors */
.validation-errors {
  margin-top: 20px;
  padding: 15px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  color: #ffc107;
}

.validation-errors h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #ffc107;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
}

.validation-errors li {
  margin-bottom: 5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .agent-form {
    padding: 20px;
  }
  
  .agent-form h2 {
    font-size: 1.5rem;
    margin-bottom: 25px;
  }
  
  .image-preview {
    width: 150px;
    height: 150px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-submit {
    width: 100%;
    max-width: 250px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .agent-form {
    padding: 15px;
  }
  
  .agent-form h2 {
    font-size: 1.3rem;
  }
  
  .image-preview {
    width: 130px;
    height: 130px;
  }
  
  .form-group input,
  .form-group select {
    padding: 12px 14px;
  }
  
  .btn-cancel, .btn-submit {
    padding: 12px 24px;
    font-size: 0.95rem;
  }
}
</style>