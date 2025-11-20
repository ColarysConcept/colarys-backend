<template>
  <div class="col">
    <label :for="id">{{ label }}</label>
    <select 
      :id="id" 
      v-model="internalValue" 
      :required="required" 
      class="form-control"
      @change="$emit('update:modelValue', internalValue)"
    >
      <!-- <option disabled value="">{{ placeholder }}</option> -->
      <option 
        v-for="(opt, index) in options" 
        :key="index" 
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '-- Sélectionner --' },
  options: { 
    type: Array as () => { label: string; value: number }[], 
    default: () => [] 
  }
})

const emit = defineEmits(['update:modelValue'])

// ✅ on utilise une valeur locale qui suit modelValue
const internalValue = ref(props.modelValue)

// ✅ synchroniser lorsque le parent change la valeur
watch(() => props.modelValue, (val) => {
  internalValue.value = val
})
</script>
