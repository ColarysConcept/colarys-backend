// api/index.js - VERSION URGENCE SANS ERREUR
console.log('🚨 URGENCY MODE: Starting ultra-simple server...');

const express = require('express');
const app = express();

// ✅ MIDDLEWARE BASIQUE SANS ERREUR
app.use(express.json());
app.use(require('cors')());

// ✅ ROUTES ESSENTIELLES GARANTIES
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API - URGENCY MODE",
    status: "RUNNING",
    timestamp: new Date().toISOString(),
    note: "Running in emergency mode without database"
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: "OK",
    message: "API is running in emergency mode",
    timestamp: new Date().toISOString(),
    mode: "emergency"
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    message: "Emergency mode - Static data",
    data: [
      { id: 1, matricule: "EMG001", nom: "Emergency", prenom: "Mode", poste: "System" }
    ],
    note: "Database connection disabled in emergency mode"
  });
});

// ✅ GESTIONNAIRE D'ERREUR GLOBAL
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: "Emergency mode active"
  });
});

console.log('✅ URGENCY SERVER: Ready on port', process.env.PORT || 3000);
module.exports = app;