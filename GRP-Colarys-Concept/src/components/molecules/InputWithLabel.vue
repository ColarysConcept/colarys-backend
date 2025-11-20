<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ label }}</label>
    <BaseInput
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :modelValue="modelValue"
      :disabled="disabled"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import BaseInput from '@/components/atoms/BaseInput.vue'

defineProps({
  id: String,
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  modelValue: String,
  disabled: { type: Boolean, default: false } // ✅ ajout du support disabled
})
defineEmits(['update:modelValue'])
</script>
