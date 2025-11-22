// api/index.js - VERSION URGENCE STABLE
console.log('🚀 Starting Colarys API - Emergency Stable Version');

const express = require('express');
const app = express();

// ✅ MIDDLEWARE BASIQUE
app.use(express.json());
app.use(require('cors')());

// ✅ ROUTES GARANTIES
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API - Emergency Mode",
    status: "RUNNING",
    timestamp: new Date().toISOString(),
    note: "Database connection disabled for stability"
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: "OK",
    message: "API running in emergency mode",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/agents', (_req, res) => {
  res.json({
    success: true,
    message: "Emergency mode - Static data",
    data: [
      { id: 1, matricule: "EMG001", nom: "Emergency", prenom: "Mode", poste: "System" }
    ],
    timestamp: new Date().toISOString()
  });
});

// ✅ GESTION D'ERREUR
app.use((err, _req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error - Emergency mode" 
  });
});

console.log('✅ Emergency server ready');
module.exports = app;