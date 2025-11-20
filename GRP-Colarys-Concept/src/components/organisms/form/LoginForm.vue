<template>
  <div class="container-fluid vh-100 d-flex align-items-center justify-content-center position-relative">
    <div :class="{ 'blurred': loadingStore.isLoading }" class="row rounded shadow col-12 col-md-6 p-4 d-flex justify-content-center align-items-center" style="height: 70vh; min-height: 40vh;">
      <div class="col d-none d-lg-block">
        <h1 class="col-8 row-col-sm-disabled">Connectez-Vous</h1>
      </div>
      <div class="col">
        <form @submit.prevent="handleLogin" style="max-width: 800px;">
          <h1 class="col-8 d-lg-none">Connectez-Vous</h1>
          <InputWithLabel
            id="email"
            label="Adresse email"
            type="email"
            placeholder="utilisateur@email.com"
            v-model="email"
            required
          />
          <InputWithLabel
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            v-model="password"
            required
          />
          <p v-if="hasError" class="text-danger">{{ errorText }}</p>
          <BaseButton type="submit" :disabled="loadingStore.isLoading">
            {{ loadingStore.isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </BaseButton>
        </form>
      </div>
    </div>

    <div v-if="loadingStore.isLoading" class="loader-overlay d-flex justify-content-center align-items-center">
      <Chargement />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputWithLabel from '@/components/molecules/InputWithLabel.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { postData } from '@/util/api'  // Utiliser la fonction corrigée
import Chargement from '@/components/ui/Chargement.vue'
import { useLoadingStore } from '@/stores/loading'

const email = ref('')
const password = ref('')
const errorText = ref('')
const hasError = ref(false)

const router = useRouter()
const loadingStore = useLoadingStore()

const handleLogin = async () => {
  try {
    loadingStore.setLoading(true)
    hasError.value = false
    
    // CORRECTION : Utiliser 'auth/login' (sans 'api/')
    const data = await postData('auth/login', {
      email: email.value.trim(),
      password: password.value.trim()
    })

    if (!data?.token) {
      throw new Error(data?.message || 'Email ou mot de passe incorrect')
    }

    localStorage.setItem('token', data.token)
    sessionStorage.setItem('userData', JSON.stringify(data))
    await router.push({ name: 'Dashboard' })
    
  } catch (error) {
    console.error('Erreur connexion:', error)
    errorText.value = getErrorMessage(error)
    hasError.value = true
  } finally {
    loadingStore.setLoading(false)
  }
}

// Fonction utilitaire pour les messages d'erreur
const getErrorMessage = (error) => {
  const message = error.message || 'Erreur de connexion';
  
  if (message.includes('ECONNREFUSED') || message.includes('ERR_NETWORK')) {
    return "Le serveur n'est pas disponible. Vérifiez votre connexion.";
  } else if (message.includes('404')) {
    return "Service d'authentification indisponible";
  } else if (message.includes('401')) {
    return "Email ou mot de passe incorrect";
  } else if (message.includes('CORS')) {
    return "Erreur de sécurité CORS. Contactez l'administrateur.";
  } else {
    return message;
  }
}
</script>

<style scoped>
.blurred {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.5);
  z-index: 10;
}
</style>