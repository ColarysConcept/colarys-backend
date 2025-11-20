<template>
  <div class="layout">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <aside class="sidebar">
      <div class="d-flex justify-content-between align-items-center d-md-none p-3 border-bottom">
        <button class="btn btn-outline-secondary" @click="menuOpen = !menuOpen">☰</button>
        <Profil />
      </div>

      <div class="d-none d-md-block p-3 text-center">
        <Profil />
      </div>

      <nav v-if="!isMobile || menuOpen" class="nav nav-pills flex-column p-3 pt-0 pt-md-3">
        <a v-for="(item, index) in menuItems" :key="index" class="nav-link"
          :class="{ active: activeItem === item.name }" href="#" @click.prevent="setActive(item); menuOpen = false">
          {{ item.label }}
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <div :class="{ blurred: isLoading }" class="content prime-page">
        <slot />
      </div>

      <!-- FOOTER AVEC BOUTON CONTACT -->
      <footer class="footer">
        <div class="container-fluid">
          <div class="footer-content">
            <div class="row">
              <!-- Colonne Entreprise -->
              <div class="col-lg-4 col-md-6 mb-4">
                <div class="footer-section">
                  <h5 class="footer-title">
                    <i class="fas fa-rocket me-2"></i>
                    Colarys Concept
                  </h5>
                  <p class="footer-description">
                    Solutions innovantes pour répondre <br>
                    aux besoins diversifiés des entreprises <br>
                    de toutes tailles à travers le monde.
                  </p>
                </div>
              </div>

              <!-- Colonne Navigation -->
              <div class="col-lg-3 col-md-6 mb-4">
                <div class="footer-section">
                  <h5 class="footer-title">Navigation</h5>
                  <div class="footer-links">
                    <a v-for="(item, index) in mainMenuItems" :key="index" class="footer-link" href="#"
                      @click.prevent="setActive(item)">
                      {{ item.label }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Colonne Services -->
              <div class="col-lg-3 col-md-6 mb-4">
                <div class="footer-section">
                  <h5 class="footer-title">Services</h5>
                  <div class="footer-links">
                    <a v-for="(item, index) in colarysMenuItems" :key="index" class="footer-link" href="#"
                      @click.prevent="setActive(item)">
                      {{ item.label }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Colonne Bouton Contact -->
              <div class="col-lg-2 col-md-6 mb-4">
                <div class="footer-section contact-btn-section">
                  <button class="contact-btn" @click="openContactModal">
                    <i class="fas fa-envelope contact-btn-icon"></i>
                    <span class="contact-btn-text">Nous Contacter</span>
                  </button>
                  <div class="social-links-mini">
                    <a href="https://www.facebook.com/colarysconcept" target="_blank" class="social-link-mini">
                      <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.linkedin.com/in/rinah-collard-388646106/" target="_blank" class="social-link-mini">
                      <i class="fab fa-linkedin-in"></i>
                    </a>
                    <a href="https://colarys-concept.com/" target="_blank" class="social-link-mini">
                      <i class="fas fa-globe"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bas du footer -->
          <div class="footer-bottom">
            <div class="row align-items-center">
              <div class="col-md-6">
                <div class="copyright">
                  © {{ currentYear }} Colarys Concept. Tous droits réservés.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <!-- MODAL CONTACT -->
      <div v-if="showContactModal" class="modal-overlay" @click="closeContactModal">
        <div class="modal-content contact-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-envelope me-2"></i>
              Contactez-nous
            </h3>
            <button @click="closeContactModal" class="modal-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="contact-grid">
              <!-- Informations de contact -->
              <div class="contact-info-modal">
                <div class="contact-item-modal">
                  <div class="contact-icon-modal">
                    <i class="fas fa-map-marker-alt"></i>
                  </div>
                  <div class="contact-details-modal">
                    <h6>Adresse</h6>
                    <p>Lot CS1 Bis Ambohitrarahaba<br>101 - Antananarivo, Madagascar</p>
                  </div>
                </div>

                <div class="contact-item-modal">
                  <div class="contact-icon-modal">
                    <i class="fas fa-envelope"></i>
                  </div>
                  <div class="contact-details-modal">
                    <h6>Email</h6>
                    <p>contact@colarysconcept.com</p>
                  </div>
                </div>

                <div class="contact-item-modal">
                  <div class="contact-icon-modal">
                    <i class="fas fa-phone"></i>
                  </div>
                  <div class="contact-details-modal">
                    <h6>Téléphone</h6>
                    <p>+261 32 49 928 38</p>
                  </div>
                </div>

                <div class="contact-item-modal">
                  <div class="contact-icon-modal">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div class="contact-details-modal">
                    <h6>Horaires d'ouverture</h6>
                    <p>Lundi - Vendredi: 9h30 - 20h00<br>Samedi: 10h00 - 15h00</p>
                  </div>
                </div>

                <div class="contact-item-modal">
                  <div class="contact-icon-modal">
                    <i class="fas fa-globe"></i>
                  </div>
                  <div class="contact-details-modal">
                    <h6>Site web</h6>
                    <p>https://colarys-concept.com/</p>
                  </div>
                </div>
              </div>

              <!-- Formulaire de contact -->
            
            </div>
          </div>
        </div>
      </div>

      <!-- FAB -->
      <div class="fab-container" v-if="showFab">
        <button @click="scrollToTop" class="fab-button">
          <i class="fas fa-chevron-up"></i>
        </button>
      </div>

      <div v-if="isLoading" class="loader-overlay d-flex justify-content-center align-items-center">
        <Chargement />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import Profil from "@/components/molecules/Profil.vue"
import Chargement from "@/components/ui/Chargement.vue"
import { isLoading } from "@/stores/loading"

const router = useRouter()
const currentYear = ref(new Date().getFullYear())

const menuItems = [
  { name: 'agents', label: 'Agents', route: '/agents' },
  { name: 'presence', label: 'Pointage', route: '/presence' },
  { name: 'historique-presence', label: 'Historique Présence', route: '/historique-presence' },
  { name: 'planning', label: 'Gestion Planning', route: '/planning' },
  { name: 'prime', label: 'Gestion Prime', route: '/prime' },
  { name: 'dashboard', label: 'Dashboard', route: '/dashboard' },
  { name: 'ColarysEmployees', label: 'Info Employés', route: '/colarys/employees' },
  { name: 'ColarysPresence', label: 'Relever Présence', route: '/colarys/presence' },
  { name: 'ColarysSalaries', label: 'Calculer Salaires', route: '/colarys/salaries' },
  { name: 'ColarysPayslip', label: 'Fiches de Paie', route: '/colarys/payslip' },
]

const mainMenuItems = computed(() => menuItems.slice(0, 6))
const colarysMenuItems = computed(() => menuItems.slice(6))

const activeItem = ref('')
const menuOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)
const showFab = ref(false)
const showContactModal = ref(false)
const sending = ref(false)

// Formulaire de contact
const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) menuOpen.value = false
}

const handleScroll = () => {
  showFab.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const openContactModal = () => {
  showContactModal.value = true
}

const closeContactModal = () => {
  showContactModal.value = false
}

const submitContactForm = async () => {
  sending.value = true
  try {
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Formulaire envoyé:', contactForm.value)
    
    // Réinitialiser le formulaire
    contactForm.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
    
    // Fermer le modal
    closeContactModal()
    
    // Afficher un message de succès (vous pouvez ajouter une notification ici)
    alert('Message envoyé avec succès!')
  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error)
    alert('Erreur lors de l\'envoi du message. Veuillez réessayer.')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('activeMenuItem')
  activeItem.value = menuItems.find(m => m.name === saved)?.name || menuItems[0].name
  window.addEventListener('resize', updateIsMobile)
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
  window.removeEventListener('scroll', handleScroll)
})

function setActive(item) {
  activeItem.value = item.name
  localStorage.setItem('activeMenuItem', item.name)
  router.push(item.route)
}
</script>

<style scoped>
/* Layout principal */
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
}

.prime-page {
  padding: 0;
  margin: 0;
}

/* Navigation */
.nav-link {
  margin-bottom: 0.5rem;
  border-radius: 0.375rem;
  color: #495057;
  text-decoration: none;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #e9ecef;
}

.nav-link.active {
  background: #0d6efd;
  color: white;
}

/* Footer */
.footer {
  background: #2c3e50;
  color: #ecf0f1;
  margin-top: auto;
}

.footer-content {
  padding: 2rem 0;
}

.footer-section {
  margin-bottom: 1rem;
}

.footer-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.footer-description {
  color: #bdc3c7;
  line-height: 1.5;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.company-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #3498db;
}

.stat-text {
  display: block;
  font-size: 0.7rem;
  color: #95a5a6;
  margin-top: 0.25rem;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.footer-link {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.2s;
  padding: 0.2rem 0;
  font-size: 0.85rem;
}

.footer-link:hover {
  color: #3498db;
}

/* Section bouton contact */
.contact-btn-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
}

.contact-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.contact-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  background: linear-gradient(135deg, #2980b9, #2471a3);
}

.contact-btn-icon {
  font-size: 1.1rem;
}

.contact-btn-text {
  font-size: 0.9rem;
}

.social-links-mini {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.social-link-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #34495e;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 0.8rem;
}

.social-link-mini:hover {
  transform: translateY(-2px);
}

.social-link-mini:nth-child(1):hover { background: #1877f2; }
.social-link-mini:nth-child(2):hover { background: #0a66c2; }
.social-link-mini:nth-child(3):hover { background: #3498db; }

.footer-bottom {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem 0;
  border-top: 1px solid #34495e;
}

.copyright {
  color: #95a5a6;
  font-size: 0.85rem;
  text-align: center;
}

.social-links {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #34495e;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
}

.social-link:hover {
  transform: translateY(-2px);
}

.social-link:nth-child(1):hover { background: #1877f2; }
.social-link:nth-child(2):hover { background: #0a66c2; }
.social-link:nth-child(3):hover { background: #3498db; }

/* MODAL CONTACT */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.contact-modal {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.2rem;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 30px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.contact-info-modal {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.contact-item-modal {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s;
}

.contact-item-modal:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.contact-icon-modal {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 1.1rem;
}

.contact-details-modal h6 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
}

.contact-details-modal p {
  margin: 0;
  color: #5a6c7d;
  line-height: 1.5;
  font-size: 0.9rem;
}

.contact-form {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
}

.contact-form h6 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* FAB */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1050;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s;
}

.fab-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

/* États de chargement */
.blurred {
  filter: blur(4px);
  pointer-events: none;
  opacity: 0.6;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Responsive */
@media (max-width: 991px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .contact-modal {
    max-width: 600px;
  }
}

@media (max-width: 767px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .main-content {
    margin-left: 0;
    margin-top: 0;
  }
  
  .footer-content {
    padding: 1.5rem 0;
  }
  
  .company-stats {
    justify-content: center;
  }
  
  .social-links {
    justify-content: center;
    margin-top: 1rem;
  }
  
  .copyright {
    text-align: center;
  }
  
  .fab-container {
    bottom: 1rem;
    right: 1rem;
  }
  
  .fab-button {
    width: 48px;
    height: 48px;
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .contact-modal {
    margin: 10px;
  }
}

@media (max-width: 575px) {
  .footer-section {
    text-align: center;
  }
  
  .company-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .contact-item-modal {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  
  .contact-btn-section {
    gap: 0.8rem;
  }
  
  .contact-btn {
    padding: 10px 20px;
    font-size: 0.85rem;
  }
}

/* Correction pour les très petits écrans */
@media (max-width: 380px) {
  .footer-link {
    font-size: 0.8rem;
  }
  
  .contact-btn-text {
    font-size: 0.8rem;
  }
}
</style>