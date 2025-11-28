// api/minimal.js - Version 100% fonctionnelle
console.log('🚀 Colarys API Minimal - Starting...');

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "✅ Colarys API is WORKING!",
    status: "operational", 
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: "HEALTHY",
    message: "API server is running correctly",
    timestamp: new Date().toISOString()
  });
});

// Route de test de connexion
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint working",
    environment: process.env.NODE_ENV || 'production',
    database: "Not tested in minimal mode"
  });
});

// Route pour login basique (sans DB)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'ressource.prod@gmail.com' && password === 'stage25') {
    res.json({
      success: true,
      message: "Login successful (minimal mode)",
      user: {
        id: 1,
        name: "Admin Ressources",
        email: "ressource.prod@gmail.com",
        role: "admin"
      },
      token: "minimal-mode-token"
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Invalid credentials in minimal mode"
    });
  }
});

console.log('✅ Minimal API ready!');

module.exports = app;