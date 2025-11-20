<!-- frontend/src/components/organisms/SignaturePad.vue -->
<template>
  <div class="signature-pad">
    <div class="signature-header">
      <h5>Signature</h5>
      <button @click="effacerSignature" class="btn btn-outline-danger btn-sm">
        Effacer
      </button>
    </div>
    
    <canvas
      ref="canvasRef"
      @mousedown="commencerDessin"
      @mousemove="dessiner"
      @mouseup="arreterDessin"
      @mouseleave="arreterDessin"
      @touchstart="commencerDessinTouch"
      @touchmove="dessinerTouch"
      @touchend="arreterDessin"
      class="signature-canvas"
      :width="width"
      :height="height"
    ></canvas>
    
    <div v-if="!signatureValide" class="alert alert-warning mt-2">
      Signature requise
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  modelValue?: string;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 150
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const isDrawing = ref(false);
const signatureValide = ref(true);

let ctx: CanvasRenderingContext2D | null = null;

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      effacerSignature();
    }
  }
});

const commencerDessin = (e: MouseEvent) => {
  if (!ctx || !canvasRef.value) return;
  
  isDrawing.value = true;
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
};

const dessiner = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
};

const commencerDessinTouch = (e: TouchEvent) => {
  e.preventDefault();
  if (!ctx || !canvasRef.value) return;
  
  isDrawing.value = true;
  const touch = e.touches[0];
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
};

const dessinerTouch = (e: TouchEvent) => {
  e.preventDefault();
  if (!isDrawing.value || !ctx || !canvasRef.value) return;
  
  const touch = e.touches[0];
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
};

const arreterDessin = () => {
  if (!isDrawing.value) return;
  
  isDrawing.value = false;
  mettreAJourSignature();
};

const effacerSignature = () => {
  if (!ctx || !canvasRef.value) return;
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, props.width, props.height);
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  emit('update:modelValue', '');
  signatureValide.value = true;
};

const mettreAJourSignature = () => {
  if (!canvasRef.value) return;
  
  const signatureData = canvasRef.value.toDataURL('image/png');
  emit('update:modelValue', signatureData);
  signatureValide.value = true;
};

const validerSignature = (): boolean => {
  if (!canvasRef.value) return false;
  
  // Vérifier si la signature n'est pas vide
  const imageData = ctx?.getImageData(0, 0, props.width, props.height).data;
  const signatureNonVide = imageData ? Array.from(imageData).some(alpha => alpha !== 0) : false;
  
  signatureValide.value = signatureNonVide;
  return signatureNonVide;
};

defineExpose({
  validerSignature,
  effacerSignature
});
</script>

<style scoped>
.signature-pad {
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}

.signature-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
}

.signature-canvas {
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: crosshair;
  touch-action: none;
}

@media (max-width: 768px) {
  .signature-canvas {
    width: 100% !important;
    height: 120px !important;
  }
}
</style>