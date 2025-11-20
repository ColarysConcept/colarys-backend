// frontend/src/stores/presenceStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Presence, Agent } from '@/types/index'; // Utilisation des types consolidés

export const usePresenceStore = defineStore('presence', () => {
  const signaturesCache = ref<Map<string, string>>(new Map());
  const historiquePresences = ref<Presence[]>([]);
  const loading = ref(false);

  const sauvegarderSignature = (matricule: string, signature: string) => {
    signaturesCache.value.set(matricule, signature);
    localStorage.setItem(`signature_${matricule}`, signature);
  };

  const recupererSignature = (matricule: string): string | null => {
    if (signaturesCache.value.has(matricule)) {
      return signaturesCache.value.get(matricule) || null;
    }
    
    const signature = localStorage.getItem(`signature_${matricule}`);
    if (signature) {
      signaturesCache.value.set(matricule, signature);
    }
    
    return signature;
  };

  const mettreAJourHistorique = (presences: Presence[]) => {
    historiquePresences.value = presences;
  };

  return {
    signaturesCache,
    historiquePresences,
    loading,
    sauvegarderSignature,
    recupererSignature,
    mettreAJourHistorique
  };
});
