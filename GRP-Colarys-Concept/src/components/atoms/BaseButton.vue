<template>
  <button :class="`btn btn-primary w-${width}`" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  width: {
    type: Number,
    default: 100,
  },
})
</script>
