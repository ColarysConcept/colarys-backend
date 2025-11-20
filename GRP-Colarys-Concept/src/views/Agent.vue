<template>
  <PageModel title="Gestion des Agents">
    <!-- Filtres -->
    <div class="filters">
      <InputWithLabel 
        v-model="filtre.nom" 
        label="Recherche par nom" 
        placeholder="Nom ou prénom"
      />
      <SelectWithLabel
        v-model="filtre.role"
        label="Filtrer par rôle"
        :options="roleOptions"
      />
      <SelectWithLabel
        v-model="filtre.plateforme"
        label="Filtrer par plateforme"
        :options="plateformeOptions"
      />
    </div>

    <!-- Tableau -->
    <DataTable
      :columns="donneAgent.columns"
      :data="filteredAgents"
      :defaultImg="defaultImg"
      @row-click="showAgentDetails"
    />

    <!-- Modals -->
    <BaseModal v-model="showAjouter" title="Ajouter un agent">
      <AgentForm @submit="handleAddAgent" />
    </BaseModal>
  </PageModel>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getData } from '@/util/api'
import PageModel from '@/components/organisms/PageModel.vue'
import DataTable from '@/components/molecules/DataTable.vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import AgentForm from '@/components/organisms/form/AgentForm.vue'
import InputWithLabel from '@/components/molecules/InputWithLabel.vue'
import SelectWithLabel from '@/components/molecules/SelectWithLabel.vue'

const defaultImg = "https://res.cloudinary.com/dmqcvee8v/image/upload/v1753979861/default_wacsi6.jpg"

// États
const showAjouter = ref(false)
const filtre = ref({
  nom: '',
  role: '',
  plateforme: ''
})

// Données
const donneRole = {
  roles: ref([])
}

const donnePlateforme = {
  plateforme: ref([])
}

const donneAgent = {
  columns: [
    { label: 'Profil', field: 'imgurl', type: 'image' },
    { label: 'Nom', field: 'nom' },
    { label: 'Prénom', field: 'prenom' },
    { label: 'Email', field: 'email' },
    { label: 'Téléphone', field: 'tel1' },
    { label: 'Rôle', field: 'roleName' },
    { label: 'Plateforme', field: 'platformName' },
    { label: 'Date début', field: 'datedebut', type: 'date' },
    { label: 'Date fin', field: 'datefin', type: 'date' }
  ],
  agent: ref([])
}

// Options des selects
const roleOptions = computed(() => [
  { label: '-- Tous les rôles --', value: '' },
  ...donneRole.roles.value.map(r => ({ label: r.role, value: r.id }))
])

const plateformeOptions = computed(() => [
  { label: '-- Toutes les plateformes --', value: '' },
  ...donnePlateforme.plateforme.value.map(p => ({ label: p.plateforme, value: p.id }))
])

// Filtrage
const filteredAgents = computed(() => {
  return donneAgent.agent.value.filter(a => {
    const matchNom = (`${a.nom} ${a.prenom}`).toLowerCase()
      .includes(filtre.value.nom.toLowerCase())
    const matchRole = !filtre.value.role || (a.roleId == filtre.value.role)
    const matchPlateforme = !filtre.value.plateforme || (a.plateformeId == filtre.value.plateforme)
    return matchNom && matchRole && matchPlateforme
  })
})

// Méthodes
const loadRoles = async () => {
  try {
    const response = await getData('/api/roles')
    donneRole.roles.value = response.data
  } catch (error) {
    console.error("Erreur chargement rôles:", error)
    donneRole.roles.value = []
  }
}

const loadPlateformes = async () => {
  try {
    const response = await getData('/api/platforms')
    donnePlateforme.plateforme.value = response.data
  } catch (error) {
    console.error("Erreur chargement plateformes:", error)
    donnePlateforme.plateforme.value = []
  }
}

const loadAgents = async () => {
  try {
    const response = await getData('/api/agents/with-details')
    donneAgent.agent.value = response.data.map(a => ({
      ...a,
      imgurl: a.imgurl || defaultImg,
      roleName: a.role?.role || 'Non défini',
      platformName: a.plateforme?.plateforme || 'Non défini'
    }))
  } catch (error) {
    console.error("Erreur chargement agents:", error)
    donneAgent.agent.value = []
  }
}

const handleAddAgent = async (newAgent) => {
  try {
    await loadAgents() // Recharger les données
    showAjouter.value = false
  } catch (error) {
    console.error("Erreur ajout agent:", error)
  }
}

const showAgentDetails = (agent) => {
  console.log("Agent sélectionné:", agent)
  // Implémentez la logique d'affichage des détails
}

// Initialisation
onMounted(async () => {
  await Promise.all([loadRoles(), loadPlateformes(), loadAgents()])
})
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>