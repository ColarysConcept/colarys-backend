<template>
  <div v-if="visible" class="contained-modal">
    <div class="modal-overlay" @click.self="close">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-Lumiere p-3">
          <div class="modal-header">
            <h1 class="modal-title fs-5">{{ title }}</h1>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <slot>
              Contenu du modal ici.
            </slot>
          </div>
          <div class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: {
    type: String,
    default: 'Modal',
  },
})
const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<style scoped>
.contained-modal {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.modal-dialog {
  width: 100%;
  max-width: 600px;
  max-height: 90vh; /* Limite haute du modal */
  display: flex;
  flex-direction: column;
}

.modal-content {
  width: 100%;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* limite globale */
  overflow: hidden;
}

.modal-header,
.modal-footer {
  flex-shrink: 0;
}

.modal-body {
  overflow-y: auto;
  flex-grow: 1;
  padding: 1rem;
}

@media (max-width: 576px) {
  .modal-dialog {
    max-width: 95%;
  }
}
</style>
