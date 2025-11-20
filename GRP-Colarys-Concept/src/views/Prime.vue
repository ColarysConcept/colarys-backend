<script setup>
import * as XLSX from "xlsx";
import { ref } from "vue";
import PageModel from "@/components/organisms/PageModel.vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const currentData = ref({});
const month = ref("");
const appPrix = ref(15);
const tmcPrix = ref(50);
const file = ref(null);

function formatAr(amount) {
  return amount.toLocaleString("fr-FR").replace(/,/g, " ") + " Ar";
}

function normalizeName(raw) {
  if (!raw) return "";
  let s = String(raw)
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
  if (/^[0-9]/.test(s) || s === "TOTAL") return "";
  if (s.startsWith("MAT")) return "MAT";
  return s;
}

function handleFileUpload(e) {
  file.value = e.target;
}

function handleUpload() {
  if (!month.value) return alert("⚠️ Sélectionnez un Mois/Année.");
  if (!file.value?.files.length) return alert("⚠️ Choisissez un fichier Excel.");

  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    const structured = {};

    for (let i = 1; i < rows.length; i++) {
      const [rawNom, nbAppel, log, tmc, shift, remarque] = rows[i];
      const key = normalizeName(rawNom);
      if (!key) continue;
      if (!structured[key]) structured[key] = [];
      structured[key].push({
        nom: normalizeName(rawNom),
        nombreAppel: Number(nbAppel) || 0,
        log: log || "",
        tmc: Number(tmc) || 0,
        shift: shift || "",
        remarque: remarque || "",
      });
    }

    localStorage.setItem(`data_${month.value}`, JSON.stringify(structured));
    alert(`✅ Données stockées pour ${month.value}`);
  };
  reader.readAsArrayBuffer(file.value.files[0]);
}

function loadAndRender() {
  const raw = localStorage.getItem(`data_${month.value}`);
  if (!raw) return alert(`❌ Aucune donnée pour ${month.value}`);
  currentData.value = JSON.parse(raw);
  renderSummary();
  document.getElementById("details").innerHTML = "";
}

function renderSummary() {
  const summaryArray = Object.entries(currentData.value).map(([agent, entries]) => {
    const totAppels = entries.reduce((s, e) => s + e.nombreAppel, 0);
    const totTMC = entries.reduce((s, e) => s + e.tmc, 0);
    const montantAppels = totAppels * appPrix.value;
    const montantTMC = totTMC * tmcPrix.value;
    return { agent, totAppels, totTMC, montantAppels, montantTMC, montantTotal: montantAppels + montantTMC };
  });

  summaryArray.sort((a, b) => b.montantTotal - a.montantTotal);

  let html = `<h4 class="mb-3">🔎 Synthèse par agent</h4><table class="table table-striped table-bordered table-hover">
        <thead class="table-dark">
        <tr><th>Agent</th><th>Total Appels</th><th>Total TMC</th><th>Montant Appels</th><th>Montant TMC</th><th>Montant Total</th></tr>
      </thead><tbody>`;

  summaryArray.forEach((s) => {
    html += `<tr style="cursor:pointer" onclick="window.__showDetails('${s.agent}')">
      <td>${s.agent}</td><td>${s.totAppels}</td><td>${s.totTMC}</td>
      <td>${formatAr(s.montantAppels)}</td><td>${formatAr(s.montantTMC)}</td><td><strong>${formatAr(s.montantTotal)}</strong></td>
    </tr>`;
  });

  html += "</tbody></table>";
  document.getElementById("summary").innerHTML = html;
}

window.__showDetails = function (agent) {
  const rows = currentData.value[agent] || [];
  let html = `<h4 class="mb-3">📋 Détails pour ${agent}</h4><table class="table table-sm table-bordered">
      <thead class="table-secondary">
      <tr><th>#</th><th>Nom</th><th>Appels</th><th>Montant Appels</th><th>Log</th><th>TMC</th><th>Montant TMC</th><th>Shift</th><th>Remarque</th></tr>
    </thead><tbody>`;

  rows.forEach((e, i) => {
    const ma = e.nombreAppel * appPrix.value;
    const mt = e.tmc * tmcPrix.value;
    html += `<tr><td>${i + 1}</td><td>${e.nom}</td><td>${e.nombreAppel}</td><td>${formatAr(ma)}</td><td>${e.log}</td><td>${e.tmc}</td><td>${formatAr(mt)}</td><td>${e.shift}</td><td>${e.remarque}</td></tr>`;
  });

  html += "</tbody></table>";
  document.getElementById("details").innerHTML = html;
};

function exportExcel() {
  if (!month.value || !Object.keys(currentData.value).length) return alert("🔔 Chargez d'abord les données.");
  const wb = XLSX.utils.book_new();

  const sumData = [["Agent", "Total Appels", "Total TMC", "Montant Appels", "Montant TMC", "Montant Total"]];
  for (const ag in currentData.value) {
    const entries = currentData.value[ag];
    const totAppels = entries.reduce((s, e) => s + e.nombreAppel, 0);
    const totTMC = entries.reduce((s, e) => s + e.tmc, 0);
    const ma = totAppels * appPrix.value;
    const mt = totTMC * tmcPrix.value;
    sumData.push([ag, totAppels, totTMC, ma, mt, ma + mt]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumData), "Résumé");

  for (const ag in currentData.value) {
    const data = [["Nom", "Appels", "Montant Appels", "Log", "TMC", "Montant TMC", "Shift", "Remarque"]];
    currentData.value[ag].forEach((e) => {
      data.push([e.nom, e.nombreAppel, e.nombreAppel * appPrix.value, e.log, e.tmc, e.tmc * tmcPrix.value, e.shift, e.remarque]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), ag);
  }

  XLSX.writeFile(wb, `Données_${month.value}.xlsx`);
}

// Nouvelle fonction pour exporter en PDF
async function exportPDF() {
  if (!month.value || !Object.keys(currentData.value).length) {
    return alert("🔔 Chargez d'abord les données.");
  }

  try {
    // Créer un élément temporaire pour contenir tout le contenu
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '20px';
    pdfContent.style.backgroundColor = 'white';

    // Cloner le résumé
    const summaryElement = document.getElementById('summary');
    if (summaryElement) {
      const summaryClone = summaryElement.cloneNode(true);
      pdfContent.appendChild(summaryClone);
    }

    // Cloner les détails s'ils existent
    const detailsElement = document.getElementById('details');
    if (detailsElement && detailsElement.innerHTML !== '') {
      const detailsClone = detailsElement.cloneNode(true);
      pdfContent.appendChild(detailsClone);
    } else {
      // Si pas de détails visibles, créer les détails pour tous les agents
      Object.keys(currentData.value).forEach(agent => {
        const agentDetails = document.createElement('div');
        agentDetails.innerHTML = window.__showDetails.toString().includes('agent')
          ? generateDetailsHTML(agent)
          : `<h4>Détails pour ${agent}</h4>`;
        pdfContent.appendChild(agentDetails);
      });
    }

    document.body.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: pdfContent.scrollWidth,
      height: pdfContent.scrollHeight
    });

    document.body.removeChild(pdfContent);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Rapport_${month.value}.pdf`);

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('❌ Erreur lors de la génération du PDF');
  }
}

// Fonction helper pour générer le HTML des détails
function generateDetailsHTML(agent) {
  const rows = currentData.value[agent] || [];
  let html = `<h4 class="mb-3">📋 Détails pour ${agent}</h4><table class="table table-sm table-bordered">
      <thead class="table-secondary">
      <tr><th>#</th><th>Nom</th><th>Appels</th><th>Montant Appels</th><th>Log</th><th>TMC</th><th>Montant TMC</th><th>Shift</th><th>Remarque</th></tr>
    </thead><tbody>`;

  rows.forEach((e, i) => {
    const ma = e.nombreAppel * appPrix.value;
    const mt = e.tmc * tmcPrix.value;
    html += `<tr><td>${i + 1}</td><td>${e.nom}</td><td>${e.nombreAppel}</td><td>${formatAr(ma)}</td><td>${e.log}</td><td>${e.tmc}</td><td>${formatAr(mt)}</td><td>${e.shift}</td><td>${e.remarque}</td></tr>`;
  });

  html += "</tbody></table>";
  return html;
}
</script>

<template>
  <PageModel>
    <div class="container-fluid prime-container">
      <div class="card shadow prime-card p-4">
        <h2 class="text-center mb-4 prime-title">📊 Gestionnaire Excel Avancé</h2>

        <!-- Paramètres -->
        <div class="mb-3 row">
          <div class="col-md-6">
            <label class="form-label prime-label">💰 Prix par appel (Ar)</label>
            <input type="number" class="form-control prime-input" v-model="appPrix" min="0" />
          </div>
          <div class="col-md-6">
            <label class="form-label prime-label">💰 Prix par TMC (Ar)</label>
            <input type="number" class="form-control prime-input" v-model="tmcPrix" min="0" />
          </div>
        </div>

        <!-- Upload -->
        <div class="mb-3 row">
          <div class="col-md-6">
            <label class="form-label prime-label">📅 Mois / Année</label>
            <input type="month" class="form-control prime-input" v-model="month" />
          </div>
          <div class="col-md-6">
            <label class="form-label prime-label">📂 Fichier Excel</label>
            <input type="file" class="form-control prime-input" @change="handleFileUpload" accept=".xlsx, .xls" />
          </div>
        </div>

        <div class="d-flex justify-content-between mb-4 flex-wrap gap-2 prime-buttons">
          <button class="btn primary-btn" @click="handleUpload">📤 Analyser & Stocker</button>
          <button class="btn secondary-btn" @click="loadAndRender">🔍 Lister & Synthèse</button>
          <button class="btn export-excel-btn" @click="exportExcel">📥 Exporter Excel</button>
          <button class="btn export-pdf-btn" @click="exportPDF">📄 Exporter PDF</button>
        </div>

        <!-- Résultats -->
        <div id="summary" class="mt-4"></div>
        <div id="details" class="mt-4"></div>
      </div>
    </div>
  </PageModel>
</template>

<style scoped>
.prime-container {
  padding: 20px;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
}

.prime-card {
  border-radius: 8px;
  margin: 0 auto;
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  width: 100%;
  max-width: 1200px;
}

.prime-title {
  color: #ffc107 !important;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.prime-label {
  color: #f0f0f5 !important;
  font-weight: 500;
  margin-bottom: 8px;
}

.prime-input {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #ced4da;
  border-radius: 8px;
  color: #333333 !important;
  padding: 10px 12px;
  transition: all 0.3s ease;
}

.prime-input:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  background: rgba(255, 255, 255, 0.95) !important;
  outline: none;
}

.prime-input::placeholder {
  color: #6c757d;
}

.prime-buttons {
  gap: 12px;
}

/* Styles des boutons */
.btn {
  min-width: 200px;
  border-radius: 25px;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
}

.secondary-btn {
  background: #95a5a6;
}

.secondary-btn:hover {
  background: #7b8a8b;
}

.export-excel-btn {
  background: #28a745;
}

.export-excel-btn:hover {
  background: #218838;
}

.export-pdf-btn {
  background: #dc3545;
}

.export-pdf-btn:hover {
  background: #c82333;
}

/* Styles pour les tables générées dynamiquement */
:deep(#summary),
:deep(#details) {
  margin-bottom: 0;
  padding-bottom: 0;
}

:deep(#summary table),
:deep(#details table) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
}

:deep(#summary th),
:deep(#details th) {
  background: rgba(52, 58, 64, 0.9) !important;
  color: #ffc107 !important;
  font-weight: 600;
  padding: 12px 8px;
  border: none;
}

:deep(#summary td),
:deep(#details td) {
  padding: 10px 8px;
  border-color: rgba(0, 0, 0, 0.1);
  color: #333333;
  background: white;
}

:deep(#summary tr:hover),
:deep(#details tr:hover) {
  background: rgba(248, 249, 250, 0.8);
}

:deep(h4) {
  color: #ffc107 !important;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Style pour les lignes de tableau cliquables */
:deep(#summary tr[style*="cursor:pointer"]) {
  transition: background-color 0.3s ease;
}

:deep(#summary tr[style*="cursor:pointer"]:hover) {
  background-color: rgba(52, 152, 219, 0.1) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .prime-container {
    padding: 10px;
  }
  
  .prime-card {
    padding: 20px 15px;
  }
  
  .btn {
    min-width: 100%;
    margin-bottom: 8px;
  }
  
  .prime-buttons {
    flex-direction: column;
  }
  
  :deep(#summary table),
  :deep(#details table) {
    font-size: 0.875rem;
  }
  
  :deep(#summary th),
  :deep(#summary td),
  :deep(#details th),
  :deep(#details td) {
    padding: 8px 4px;
  }
}

@media (max-width: 576px) {
  .prime-card {
    padding: 15px 10px;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  :deep(#summary table),
  :deep(#details table) {
    font-size: 0.8rem;
  }
}

/* Animation pour les boutons */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.btn:active {
  animation: pulse 0.3s ease;
}

/* Style pour les alertes générées par JavaScript */
:deep(.alert) {
  border-radius: 8px;
  padding: 12px 16px;
  margin: 10px 0;
  border: none;
  font-weight: 500;
}

:deep(.alert-success) {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  color: #f0f0f5;
}

:deep(.alert-warning) {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

:deep(.alert-danger) {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #f0f0f5;
}
</style>