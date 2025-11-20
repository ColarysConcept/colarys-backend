<template>
  <form @submit.prevent="handleSubmit" class="container my-4" style="max-width: 800px;">
    
    <!-- Image -->
    <div class="row mb-3">
      <div class="col-md-4 text-center">
        <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="img-thumbnail mt-2" style="width: 4cm; height: 4cm; object-fit: cover;" />
        <input type="file" accept="image/*" @change="handleImageUpload" class="form-control" />
      </div>
    </div>

    <!-- Nom / Prénom -->
    <div class="row mb-3">
      <div class="col-md-6">
        <InputWithLabel id="nom" type="text" placeholder="Jhon" v-model="nom" required />
      </div>
      <div class="col-md-6">
        <InputWithLabel id="prenom" type="text" placeholder="Doe" v-model="prenom" required />
      </div>
    </div>

    <!-- Email / Tel1 / Tel2 -->
    <div class="row mb-3">
      <div class="col-md-6">
        <InputWithLabel id="email" type="email" placeholder="Email" v-model="email" />
      </div>
      <div class="col-md-3">
        <InputWithLabel id="tel1" type="text" placeholder="Téléphone 1" v-model="tel1" required />
      </div>
      <div class="col-md-3">
        <InputWithLabel id="tel2" type="text" placeholder="Téléphone 2" v-model="tel2" />
      </div>
    </div>

    <!-- Rôle -->
    <div class="row mb-3">
      <SelectWithLabel
        id="role"
        label="Rôle"
        v-model="role"
        :required="true"
        placeholder="-- Sélectionner un rôle --"
        :options="roleOptions"
      />
    </div>

    <!-- Plateforme -->
    <div class="row mb-3">
      <SelectWithLabel
        id="plateforme"
        label="Plateforme"
        v-model="plateforme"
        :required="true"
        placeholder="-- Sélectionner une Plateforme --"
        :options="plateformeOptions"
      />
    </div>

    <!-- Dates -->
    <div class="row mb-3">
      <div class="col-md-6">
        <InputWithLabel id="dateDebut" type="date" v-model="dateDebut" required />
      </div>
      <div class="col-md-6">
        <label>
          <input type="checkbox" v-model="activerDateFin" />
          Activer date de fin
        </label>
        <input class="form-control mt-1" type="date" v-model="dateFin" :disabled="!activerDateFin" />
      </div>
    </div>

    <!-- Conditions -->
    <div class="row mb-3">
      <div class="col">
        <label>
          <input type="checkbox" v-model="conditionsAcceptees" required />
          J'accepte les termes et conditions d'utilisation
        </label>
      </div>
    </div>

    <!-- Bouton -->
    <div class="row">
      <div class="col text-end">
        <BaseButton type="submit" :disabled="!conditionsAcceptees">Valider</BaseButton>
      </div>
    </div>

  </form>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import InputWithLabel from '@/components/molecules/InputWithLabel.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { postData } from '@/util/api'
import SelectWithLabel from "@/components/molecules/SelectWithLabel.vue";

const props = defineProps<{
  roleOptions: { label: string; value: number }[]
  plateformeOptions: { label: string; value: number }[]
}>()

// Champs du formulaire
const nom = ref('')
const prenom = ref('')
const email = ref('')
const tel1 = ref('')
const tel2 = ref('')
const role = ref('')
const plateforme = ref('')
const dateDebut = ref('')
const dateFin = ref('')
const activerDateFin = ref(false)
const conditionsAcceptees = ref(false)

// Image
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

function resetForm() {
  nom.value = ''
  prenom.value = ''
  email.value = ''
  tel1.value = ''
  tel2.value = ''
  role.value = ''
  plateforme.value = ''
  dateDebut.value = ''
  dateFin.value = ''
  activerDateFin.value = false
  conditionsAcceptees.value = false
  imageFile.value = null
  imagePreview.value = null
}

async function handleSubmit() {
  try {
    const formData = new FormData()
    formData.append('nom', nom.value)
    formData.append('prenom', prenom.value)
    formData.append('email', email.value)
    formData.append('tel1', tel1.value)
    formData.append('tel2', tel2.value)
    formData.append('idrole', role.value)
    formData.append('idPlateforme', plateforme.value)
    formData.append('datedebut', dateDebut.value)

    if (activerDateFin.value && dateFin.value) {
      formData.append('datefin', dateFin.value)
    }
    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    const response = await postData('/agent/createWithImage', formData)
    console.log('✅ Agent créé :', response)

    alert(response.message)

    // ✅ Réinitialise le formulaire après succès
    resetForm()

  } catch (err: any) {
    console.error('❌ Erreur lors de l\'envoi :', err.message)
    alert(err.message)
  }
}
</script>



<style scoped>
input[type="checkbox"] {
  margin-right: 0.5rem;
}
</style>
