<!-- src/components/atoms/BaseInput.vue -->
<template>
  <input
    :type="type"
    class="form-control"
    v-bind="$attrs"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  type: { type: String, default: 'text' },
  placeholder: String,
  modelValue: String
})
defineEmits(['update:modelValue'])
</script>
