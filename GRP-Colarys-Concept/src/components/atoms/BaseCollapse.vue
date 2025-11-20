<template>
  <div class="container-fluid rounded d-flex justify-content-between align-items-center py-2">
    <span class="text-center flex-grow-1">{{ title }}</span>
    <BaseButton
      v-if="afficheBtn"
      :width="10"
      type="button"
      data-bs-toggle="collapse"
      :data-bs-target="'#' + collapseId"
      :aria-controls="collapseId"
      :aria-expanded="isOpen"
      @click="toggleIcon"
    >
      {{ isOpen ? '-' : '+' }}
    </BaseButton>
  </div>

  <div class="collapse p-2" :id="collapseId" ref="collapseTarget">
    <slot name="contenu" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseButton from "@/components/atoms/BaseButton.vue"

// ✅ Props
const props = defineProps({
  title: { type: String, default: 'Aucun titre' },
  status: { type: String, default: 'fermer' },
  afficheBtn: {type: Boolean, default: true}
})

// ✅ Générer un ID unique pour chaque instance
const collapseId = 'collapse-' + Math.random().toString(36).substr(2, 9)

const isOpen = ref(false)
const collapseTarget = ref(null)

function toggleIcon() {
  setTimeout(() => {
    isOpen.value = collapseTarget.value?.classList.contains('show')
  }, 300)
}

onMounted(() => {
  if (props.status === 'ouvert') {
    collapseTarget.value?.classList.add('show')
    isOpen.value = true
  } else {
    collapseTarget.value?.classList.remove('show')
    isOpen.value = false
  }
})
</script>

<style scoped>
.container-fluid {
  background-color: rgb(245, 245, 245);
}
</style>
