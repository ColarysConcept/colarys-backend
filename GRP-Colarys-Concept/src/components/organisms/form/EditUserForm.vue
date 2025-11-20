<!-- src/components/organisms/LoginForm.vue -->
<template>
  <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div class="row rounded shadow col-12 col-md-6 p-4 d-flex justify-content-center align-items-center" style="height: 70vh; min-height: 40vh;">
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
                  <BaseButton type="submit">Se connecter</BaseButton>
              </form>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputWithLabel from '@/components/molecules/InputWithLabel.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const email = ref('')
const password = ref('')

const router = useRouter()

const handleLogin = () => {
  console.log('Tentative de connexion avec :', email.value, password.value)
  router.push({ name: "Dashboard" })
}
</script>
