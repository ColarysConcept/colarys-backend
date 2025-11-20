<template>
  <PageModel>
    <div class="historique-container mobile-optimized">
      <div class="presence-container">
        <div class="header-section">
          <h1>Badgeuse Virtuelle <br> Colarys Concept</h1>
          <p class="current-time">{{ currentTime }}</p>
          <p class="current-date">{{ currentDate }}</p>
        </div>

        <!-- ÉTAPE 1: Saisie du matricule -->
        <div v-if="etape === 'saisie_matricule'" class="matricule-section">
          <h3 class="section-title">Identification</h3>
          <div class="form-group">
            <label for="matricule">Matricule:</label>
            <input id="matricule" v-model="matricule" placeholder="Entrez votre matricule"
              @keyup.enter="commencerPointage" />

            <br>
            <!-- NOUVEAU : Conteneur pour les boutons en dessous de l'input -->
            <div class="buttons-container">
              <button @click="commencerPointage" class="btn-primary">Commencer</button>
              <button @click="nouveauAgent" class="btn-secondary">
                👤 Je n'ai pas de matricule
              </button>
            </div>
          </div>
        </div>

        <!-- Dans PresencePage.vue - Ajouter cette section dans le formulaire -->
        <div class="info-section">
          <div class="info-card">
            <h4>💡 Information importante</h4>
            <p>Le temps de présence est fixé à <strong>8 heures</strong> pour tous les shifts (Matin, Jour, Nuit).</p>
          </div>
        </div>

        <!-- Utilisation sécurisée de presenceAujourdhui -->
        <div v-if="etape === 'formulaire_pointage'" class="form-section">
          <div class="agent-info-card">
            <h3 class="section-title">Informations Agent</h3>
            <div v-if="agentExiste">
              <p><strong>Matricule:</strong> {{ agentInfo.matricule || 'Non défini' }}</p>
              <p><strong>Nom:</strong> {{ agentInfo.nom }}</p>
              <p><strong>Prénom:</strong> {{ agentInfo.prenom }}</p>
              <p><strong>Campagne:</strong> {{ agentInfo.campagne }}</p>

              <!-- Vérification que presenceAujourdhui n'est pas null -->
              <div v-if="presenceAujourdhui" class="debug-info">
                <h4>📊 État actuel de la présence:</h4>
                <p><strong>Heure d'entrée:</strong> {{ presenceAujourdhui.heureEntree }}</p>
                <p><strong>Heure de sortie:</strong> {{ presenceAujourdhui.heureSortie || 'Non pointée' }}</p>
                <p><strong>Statut:</strong>
                  <span v-if="presenceAujourdhui.heureSortie" class="status-complete">✅ Complet</span>
                  <span v-else class="status-pending">⏳ En attente de sortie</span>
                </p>
              </div>

              <div v-else class="status-none">
                📝 Aucun pointage aujourd'hui
              </div>
            </div>

            <div v-else class="nouvel-agent-section">
              <h4 class="section-title">Compléter les informations</h4>
              <div class="form-group">
                <label for="matricule">Matricule (facultatif):</label>
                <input id="matricule" v-model="agentInfo.matricule" placeholder="Entrez votre matricule (facultatif)" />
                <small class="form-text">Laissez vide si vous n'avez pas de matricule</small>
              </div>

              <div class="form-group">
                <label for="nom">Nom:</label>
                <input id="nom" v-model="agentInfo.nom" placeholder="Entrez votre nom" required />
              </div>
              <div class="form-group">
                <label for="prenom">Prénom:</label>
                <input id="prenom" v-model="agentInfo.prenom" placeholder="Entrez votre prénom" required />
              </div>
              <div class="form-group">
                <label for="campagne">Campagne:</label>
                <input id="campagne" v-model="agentInfo.campagne" placeholder="Entrez votre campagne" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="shift">Shift:</label>
            <select id="shift" v-model="shift">
              <option value="MATH">Matin</option>
              <option value="JOUR">Jour</option>
              <option value="NUIT">Nuit</option>
            </select>
          </div>

          <!--  Vérification de null -->
          <div v-if="!presenceAujourdhui" class="form-group">
            <label for="heureEntree">Heure d'entrée:</label>
            <input id="heureEntree" type="time" v-model="heureEntreeManuelle" required class="time-input" />
          </div>

          <!--  Vérification que presenceAujourdhui n'est pas null -->
          <div v-if="presenceAujourdhui && !presenceAujourdhui.heureSortie" class="form-group">
            <label for="heureSortie">Heure de sortie:</label>
            <input id="heureSortie" type="time" v-model="heureSortieManuelle" required class="time-input" />
          </div>

          <div class="form-group">
            <label>Signature:</label>
            <SignaturePad v-model="signatureData" :width="400" :height="200" ref="signaturePadRef" />
          </div>

          <div class="actions">
            <button @click="effacerSignature" class="btn-secondary">Effacer Signature</button>

            <!-- Conditions sécurisées pour les boutons -->
            <button v-if="!presenceAujourdhui || (presenceAujourdhui && presenceAujourdhui.heureSortie)"
              @click="pointerEntree" :disabled="enCoursPointage || !signatureValide" class="btn-primary">
              {{ presenceAujourdhui && presenceAujourdhui.heureSortie ? 'Nouvelle Entrée' : 'Pointer Entrée' }}
            </button>

            <!-- Vérification que presenceAujourdhui n'est pas null -->
            <button v-if="presenceAujourdhui && !presenceAujourdhui.heureSortie" @click="pointerSortie"
              :disabled="enCoursPointage || !signatureValide" class="btn-warning">
              Pointer Sortie
            </button>
          </div>
        </div>

        <!-- ÉTAPE 3: Confirmation -->
        <div v-if="etape === 'confirmation'" class="confirmation-section">
          <div class="confirmation-card" :class="confirmationType">
            <h3>{{ confirmationTitre }}</h3>
            <p>{{ confirmationMessage }}</p>
            <!-- CORRECTION : Vérification que dernierePresence n'est pas null -->
            <div v-if="dernierePresence" class="presence-details">
              <p><strong>Matricule:</strong> {{ dernierePresence.agent?.matricule }}</p>
              <p><strong>Nom:</strong> {{ dernierePresence.agent?.nom }} {{ dernierePresence.agent?.prenom }}</p>
              <p><strong>Date:</strong> {{ dernierePresence.date }}</p>
              <p><strong>Heure Entrée:</strong> {{ dernierePresence.heureEntree }}</p>
              <p v-if="dernierePresence.heureSortie"><strong>Heure Sortie:</strong> {{ dernierePresence.heureSortie }}
              </p>
              <p v-if="dernierePresence.heuresTravaillees"><strong>Heures Travaillées:</strong> {{
                dernierePresence.heuresTravaillees }}h</p>
            </div>
            <button @click="reinitialiser" class="btn-primary">Nouveau Pointage</button>
          </div>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
  </PageModel>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import PageModel from '@/components/organisms/PageModel.vue';
import SignaturePad from '@/components/organisms/SignaturePad.vue';
import { presenceService, agentService } from '@/services/presenceApi';
import { usePresenceStore } from '@/stores/presenceStore';
import { AxiosError } from 'axios';
import type { Presence, PointageData } from '@/types/index';

// Définition explicite du type pour agentInfo
interface AgentInfo {
  matricule: string;
  nom: string;
  prenom: string;
  campagne: string;
}

const presenceStore = usePresenceStore();

// États de l'application
const etape = ref<'saisie_matricule' | 'formulaire_pointage' | 'confirmation'>('saisie_matricule');
const matricule = ref('');
const shift = ref('JOUR');
const signatureData = ref('');
const agentExiste = ref(false);
const presenceAujourdhui = ref<Presence | null>(null);
const enCoursPointage = ref(false);
const heureEntreeManuelle = ref('');
const heureSortieManuelle = ref('');
const error = ref('');
const currentTime = ref('');
const currentDate = ref('');
const signatureValide = ref(true);

// Informations de l'agent avec ref
const agentInfo = ref<AgentInfo>({
  matricule: '',
  nom: '',
  prenom: '',
  campagne: 'Standard'
});

// Confirmation
const confirmationTitre = ref('');
const confirmationMessage = ref('');
const confirmationType = ref<'entree' | 'sortie'>('entree');
const dernierePresence = ref<Presence | null>(null);

const signaturePadRef = ref<InstanceType<typeof SignaturePad> | null>(null);

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);
});

// CORRECTION : Méthode utilitaire pour vérifier la présence
const hasPresenceToday = (): boolean => {
  return presenceAujourdhui.value !== null;
};

const hasExitTime = (): boolean => {
  return presenceAujourdhui.value !== null && presenceAujourdhui.value.heureSortie !== null && presenceAujourdhui.value.heureSortie !== undefined;
};

const nouveauAgent = () => {
  error.value = '';
  agentExiste.value = false;
  presenceAujourdhui.value = null;
  agentInfo.value = {
    matricule: '', // Matricule vide pour nouvel agent
    nom: '',
    prenom: '',
    campagne: 'Standard'
  };
  etape.value = 'formulaire_pointage';
};

const commencerPointage = async () => {
  try {
    error.value = '';
    agentExiste.value = false;
    presenceAujourdhui.value = null;

    if (matricule.value.trim()) {
      // Recherche par matricule d'abord
      console.log('Recherche de l\'agent avec matricule:', matricule.value);
      const response = await agentService.getByMatricule(matricule.value);

      if (response.data.success && response.data.data) {
        const agent = response.data.data;
        agentExiste.value = true;
        agentInfo.value = {
          matricule: agent.matricule || '',
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        };
        console.log('Agent existant trouvé par matricule:', agent);
      } else {
        agentExiste.value = false;
        agentInfo.value = {
          matricule: matricule.value,
          nom: '',
          prenom: '',
          campagne: 'Standard'
        };
        console.log('Nouvel agent avec matricule fourni');
      }
    } else {
      // Pas de matricule - nouvel agent sans matricule
      agentExiste.value = false;
      agentInfo.value = {
        matricule: '',
        nom: '',
        prenom: '',
        campagne: 'Standard'
      };
      console.log('Nouvel agent sans matricule');
    }

    // Passer à l'étape du formulaire
    etape.value = 'formulaire_pointage';

  } catch (err: any) {
    if (err.response?.status === 404) {
      // Nouvel agent - c'est normal
      agentExiste.value = false;
      agentInfo.value = {
        matricule: matricule.value,
        nom: '',
        prenom: '',
        campagne: 'Standard'
      };
      etape.value = 'formulaire_pointage';
    } else {
      console.error('Erreur lors de la recherche de l\'agent:', err);
      error.value = 'Erreur lors de la recherche de l\'agent';
    }
  }
};

// NOUVEAU : Watch pour recherche automatique quand le nom et prénom sont saisis
watch([() => agentInfo.value.nom, () => agentInfo.value.prenom], async ([newNom, newPrenom]) => {
  if (etape.value === 'formulaire_pointage' && newNom && newPrenom && !agentExiste.value) {
    try {
      console.log('Recherche automatique par nom/prénom:', { newNom, newPrenom });

      // Recherche par nom et prénom
      const response = await agentService.getByNomPrenom(newNom, newPrenom);

      if (response.data.success && response.data.data) {
        const agent = response.data.data;
        agentExiste.value = true;
        agentInfo.value = {
          matricule: agent.matricule || '',
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        };
        console.log('Agent existant trouvé par recherche automatique:', agent);

        // Vérifier la présence aujourd'hui
        await verifierPresenceAujourdhui();
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Agent non trouvé - c'est normal, c'est un nouvel agent
        console.log('Nouvel agent détecté par nom/prénom');
      } else {
        console.error('Erreur lors de la recherche automatique:', err);
      }
    }
  }
});

const verifierPresenceAujourdhui = async () => {
  console.log('Vérification de présence pour:', agentInfo.value);

  // Vérification plus robuste
  if ((!agentInfo.value.matricule?.trim()) && (!agentInfo.value.nom?.trim() || !agentInfo.value.prenom?.trim())) {
    presenceAujourdhui.value = null;
    return;
  }

  // Réinitialiser d'abord
  presenceAujourdhui.value = null;

  try {
    let response;

    // CORRECTION : Priorité au matricule, sinon recherche par nom/prénom
    if (agentInfo.value.matricule?.trim()) {
      console.log('Recherche par matricule:', agentInfo.value.matricule);
      response = await presenceService.getPresenceAujourdhui(agentInfo.value.matricule);
    } else if (agentInfo.value.nom?.trim() && agentInfo.value.prenom?.trim()) {
      console.log('Recherche par nom/prénom:', agentInfo.value.nom, agentInfo.value.prenom);
      // Si vous avez implémenté l'API par nom/prénom, utilisez-la ici
      // response = await presenceService.getPresenceAujourdhuiByNomPrenom(agentInfo.value.nom, agentInfo.value.prenom);
      console.log('API par nom/prénom non disponible - utilisation du matricule généré');
      return;
    } else {
      console.log('Informations insuffisantes pour vérifier la présence');
      return;
    }

    // CORRECTION : Vérification robuste de la réponse
    if (response?.data?.success) {
      if (response.data.data) {
        presenceAujourdhui.value = response.data.data;
        console.log('✅ Présence trouvée:', presenceAujourdhui.value);

        // CORRECTION : Utilisation d'une variable temporaire pour éviter l'erreur TypeScript
        const presence = presenceAujourdhui.value;
        if (presence && presence.heureSortie) {
          console.log('📋 Agent a déjà pointé entrée ET sortie aujourdhui');
        } else if (presence) {
          console.log('⏰ Agent a pointé entrée, en attente de sortie');
        }
      } else {
        console.log('📝 Aucune présence trouvée pour aujourdhui');
        presenceAujourdhui.value = null;
      }
    } else {
      console.log('❌ Erreur dans la réponse:', response?.data);
      presenceAujourdhui.value = null;
    }
  } catch (err: unknown) {
    console.error('❌ Erreur lors de la vérification de présence:', err);
    presenceAujourdhui.value = null;

    // CORRECTION : Ne pas afficher d'erreur pour les 404 (pas de présence)
    if (err instanceof AxiosError && err.response?.status === 404) {
      console.log('ℹ️ Aucune présence existante - normal pour nouveau pointage');
    }
  }
};

//  Méthode pour forcer la vérification après modifications
const verifierPresenceForcee = async () => {
  console.log('🔄 Forcer la vérification de présence');
  await verifierPresenceAujourdhui();
};

// CORRECTION : Watch amélioré pour détecter les changements
watch(() => agentInfo.value.matricule, async (newMatricule) => {
  if (etape.value === 'formulaire_pointage' && newMatricule?.trim()) {
    console.log('🔍 Matricule modifié, vérification de présence...');
    await verifierPresenceAujourdhui();
  }
});

watch([() => agentInfo.value.nom, () => agentInfo.value.prenom], async ([newNom, newPrenom]) => {
  if (etape.value === 'formulaire_pointage' && newNom?.trim() && newPrenom?.trim() && !agentExiste.value) {
    console.log('🔍 Nom/prénom modifiés, recherche agent...');
    // Votre logique de recherche d'agent existant...
  }
});

// CORRECTION : Watch amélioré avec vérifications de null
watch([() => agentInfo.value.nom, () => agentInfo.value.prenom], async ([newNom, newPrenom]) => {
  if (etape.value === 'formulaire_pointage' && newNom && newPrenom && !agentExiste.value) {
    try {
      console.log('Recherche automatique par nom/prénom:', { newNom, newPrenom });

      // CORRECTION : Vérification que les valeurs ne sont pas null/undefined
      if (!newNom.trim() || !newPrenom.trim()) {
        return;
      }

      const response = await agentService.getByNomPrenom(newNom, newPrenom);

      if (response.data?.success && response.data.data) {
        const agent = response.data.data;
        agentExiste.value = true;
        agentInfo.value = {
          matricule: agent.matricule || '',
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        };
        console.log('Agent existant trouvé par recherche automatique:', agent);

        // Vérifier la présence aujourd'hui
        await verifierPresenceAujourdhui();
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Agent non trouvé - c'est normal, c'est un nouvel agent
        console.log('Nouvel agent détecté par nom/prénom');
      } else {
        console.error('Erreur lors de la recherche automatique:', err);
      }
    }
  }
});

// CORRECTION : Méthode pour forcer la vérification après création d'agent
const verifierPresenceApresCreation = async () => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Petite attente
  await verifierPresenceAujourdhui();
};

// Watch modifié pour ne pas interférer avec la saisie manuelle
watch(() => agentInfo.value.matricule, async (newMatricule) => {
  // Ne faire la recherche automatique que si on est en étape de saisie matricule
  // ou si le matricule est modifié manuellement dans le formulaire
  if (etape.value === 'formulaire_pointage' && !agentExiste.value && newMatricule?.trim()) {
    try {
      const response = await agentService.getByMatricule(newMatricule);
      if (response.data.success && response.data.data) {
        const agent = response.data.data;
        agentExiste.value = true;
        agentInfo.value = {
          matricule: agent.matricule || '',
          nom: agent.nom,
          prenom: agent.prenom,
          campagne: agent.campagne
        };
        await verifierPresenceAujourdhui();
      } else {
        agentExiste.value = false;
        // Garder les valeurs saisies par l'utilisateur
      }
    } catch (err) {
      agentExiste.value = false;
      // En cas d'erreur, considérer comme nouvel agent
    }
  }
});

const effacerSignature = () => {
  signaturePadRef.value?.effacerSignature();
  signatureData.value = '';
  signatureValide.value = true;
  error.value = '';
};

const validerFormulaire = (): boolean => {
  if (agentExiste.value && !agentInfo.value.matricule.trim()) {
    error.value = 'Le matricule est obligatoire pour un agent existant';
    return false;
  }

  if (!agentExiste.value) {
    if (!agentInfo.value.nom.trim()) {
      error.value = 'Le nom est obligatoire';
      return false;
    }
    if (!agentInfo.value.prenom.trim()) {
      error.value = 'Le prénom est obligatoire';
      return false;
    }
  }

  if (!signaturePadRef.value?.validerSignature()) {
    signatureValide.value = false;
    error.value = 'Une signature valide est requise';
    return false;
  }

  return true;
};

const pointerEntree = async () => {
  if (!validerFormulaire()) return;

  // Validation de l'heure manuelle
  if (!heureEntreeManuelle.value) {
    error.value = "L'heure d'entrée est obligatoire";
    return;
  }

  enCoursPointage.value = true;
  error.value = '';

  try {
    const data: PointageData = {
      matricule: agentInfo.value.matricule || '', // Peut être vide pour nouvel agent
      nom: agentInfo.value.nom,
      prenom: agentInfo.value.prenom,
      campagne: agentInfo.value.campagne,
      shift: shift.value,
      signatureEntree: signatureData.value,
      heureEntreeManuelle: heureEntreeManuelle.value
    };

    console.log('Pointage d\'entrée:', data);
    const response = await presenceService.pointerEntree(data);

    if (response.data.success && response.data.presence) {
      dernierePresence.value = response.data.presence;
      confirmationTitre.value = 'Pointage d\'Entrée Enregistré';

      if (dernierePresence.value) {
        confirmationMessage.value = `Entrée pointée à ${dernierePresence.value.heureEntree}`;
      } else {
        confirmationMessage.value = 'Pointage d\'entrée enregistré';
      }

      confirmationType.value = 'entree';
      etape.value = 'confirmation';
    } else {
      throw new Error(response.data.error || 'Erreur lors du pointage');
    }

  } catch (err: unknown) {
    console.error('Erreur pointage entrée:', err);
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.error || err.message || 'Erreur lors du pointage d\'entrée';
    } else if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Erreur inconnue lors du pointage d\'entrée';
    }
  } finally {
    enCoursPointage.value = false;
  }
};

// Méthode pointerSortie avec vérifications améliorées
const pointerSortie = async () => {
  if (!validerFormulaire()) return;

  // CORRECTION : Vérification plus robuste
  if (!heureSortieManuelle.value) {
    error.value = "L'heure de sortie est obligatoire";
    return;
  }

  //Vérification que l'agent a un matricule ou nom/prénom
  if (!agentInfo.value.matricule?.trim() && (!agentInfo.value.nom?.trim() || !agentInfo.value.prenom?.trim())) {
    error.value = "Les informations de l'agent sont incomplètes";
    return;
  }

  enCoursPointage.value = true;
  error.value = '';

  try {
    console.log('Pointage de sortie pour:', agentInfo.value.matricule);

    // CORRECTION : Utilisation sécurisée du matricule
    const matriculePourPointage = agentInfo.value.matricule?.trim() || '';
    if (!matriculePourPointage) {
      throw new Error("Matricule requis pour le pointage de sortie");
    }

    const response = await presenceService.pointerSortie({
      matricule: matriculePourPointage,
      signatureSortie: signatureData.value,
      heureSortieManuelle: heureSortieManuelle.value
    });

    if (response.data?.success && response.data.presence) {
      dernierePresence.value = response.data.presence;
      confirmationTitre.value = 'Pointage de Sortie Enregistré';

      if (dernierePresence.value) {
        const heureSortie = dernierePresence.value.heureSortie || 'non définie';
        const heuresTravaillees = dernierePresence.value.heuresTravaillees || 0;
        confirmationMessage.value = `Sortie pointée à ${heureSortie}. Heures travaillées: ${heuresTravaillees}h`;
      } else {
        confirmationMessage.value = 'Pointage de sortie enregistré';
      }

      confirmationType.value = 'sortie';
      etape.value = 'confirmation';
    } else {
      throw new Error(response.data?.error || 'Erreur lors du pointage');
    }

  } catch (err: unknown) {
    console.error('Erreur pointage sortie:', err);
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.error || err.message || 'Erreur lors du pointage de sortie';
    } else if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Erreur inconnue lors du pointage de sortie';
    }
  } finally {
    enCoursPointage.value = false;
  }
};

// Dans PresencePage.vue, après un pointage réussi
const rafraichirHistorique = async () => {
  try {
    setTimeout(async () => {
      console.log('Rafraîchissement de l\'historique après pointage');
      // presenceStore.rafraichirHistorique();
    }, 1000);
  } catch (error) {
    console.error('Erreur lors du rafraîchissement de l\'historique:', error);
  }
};

const reinitialiser = () => {
  etape.value = 'saisie_matricule';
  matricule.value = '';
  agentExiste.value = false;
  presenceAujourdhui.value = null;
  agentInfo.value = { matricule: '', nom: '', prenom: '', campagne: 'Standard' };
  shift.value = 'JOUR';
  heureEntreeManuelle.value = '';
  heureSortieManuelle.value = '';
  effacerSignature();
  error.value = '';
  confirmationTitre.value = '';
  confirmationMessage.value = '';
  dernierePresence.value = null;
};
</script>

<style scoped>
.mobile-optimized {
  max-width: 100%;
  margin: 0;
  padding: 1rem;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
}

.presence-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding-bottom: 1rem;
  backdrop-filter: blur(10px);
}

.header-section {
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
}

.header-section h1 {
  color: #ffc107;
  margin-bottom: 0.5rem;
  padding: 15px;
}

.current-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffc107;
  margin: 0.25rem 0;
}

.current-date {
  color: #f0f0f5;
  margin: 0;
}

/* Labels en blanc */
.presence-container label {
  color: #f0f0f5;
  font-weight: 600;
}

/* Titres des sections */
.section-title {
  color: #ffc107;
  margin-bottom: 1rem;
}

.matricule-section {
  text-align: left;
  margin: 2rem 0;
}

/* Conteneur pour les boutons */
.buttons-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.buttons-container .btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.buttons-container .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.buttons-container .btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.buttons-container .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.mt-2 {
  margin-top: 0.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.agent-info-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #f0f0f5;
  padding-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.agent-info-card h3 {
  margin-top: 0;
  color: #ffc107;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #f0f0f5;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
}

.form-group input::placeholder {
  color: rgba(240, 240, 245, 0.7);
}

.nouvel-agent-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  color: #f0f0f5;
  backdrop-filter: blur(10px);
}

.nouvel-agent-section h4 {
  margin-top: 0;
  color: #ffc107;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-warning {
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-warning:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.confirmation-section {
  text-align: center;
  margin: 2rem 0;
}

.confirmation-card {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.confirmation-card.entree {
  background: rgba(212, 237, 218, 0.1);
  color: #f0f0f5;
  border-color: rgba(195, 230, 203, 0.3);
}

.confirmation-card.sortie {
  background: rgba(209, 236, 241, 0.1);
  color: #f0f0f5;
  border-color: rgba(190, 229, 235, 0.3);
}

.presence-details {
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  color: #f0f0f5;
  backdrop-filter: blur(10px);
}

.error {
  background: rgba(220, 53, 69, 0.2);
  color: #f8d7da;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.time-input {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
}

/* Style spécifique pour les inputs time sur mobile */
@media (max-width: 768px) {
  .time-input {
    font-size: 16px;
  }

  /* Adaptation mobile pour les boutons */
  .buttons-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .buttons-container .btn-primary,
  .buttons-container .btn-secondary {
    width: 100%;
    text-align: center;
  }

  .actions {
    flex-direction: column;
  }
}

/* Ajouter ces styles */
.info-note {
  color: #28a745;
  font-style: italic;
  margin-top: 0.5rem;
}

.form-text {
  color: rgba(240, 240, 245, 0.7);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Styles additionnels */
.presence-status {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.status-complete {
  background: rgba(212, 237, 218, 0.2);
  color: #f0f0f5;
  border: 1px solid rgba(195, 230, 203, 0.3);
}

.status-pending {
  background: rgba(255, 243, 205, 0.2);
  color: #f0f0f5;
  border: 1px solid rgba(255, 234, 167, 0.3);
}

.status-none {
  background: rgba(209, 236, 241, 0.2);
  color: #f0f0f5;
  border: 1px solid rgba(190, 229, 235, 0.3);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-info:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Styles additionnels pour debug */
.debug-info {
  background: rgba(233, 236, 239, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border-left: 4px solid #3498db;
  color: #f0f0f5;
  backdrop-filter: blur(10px);
}

.debug-info h4 {
  margin-top: 0;
  color: #ffc107;
}

.status-complete {
  color: #28a745;
  font-weight: bold;
}

.status-pending {
  color: #ffc107;
  font-weight: bold;
}

.btn-warning {
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-warning:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
/* Dans PresencePage.vue - Ajouter ces styles */
.info-section {
  margin: 1rem 0;
}

.info-card {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: #ffc107;
  backdrop-filter: blur(10px);
}

.info-card h4 {
  margin: 0 0 0.5rem 0;
  color: #ffc107;
}

.info-card p {
  margin: 0;
  font-size: 0.9rem;
}
</style>