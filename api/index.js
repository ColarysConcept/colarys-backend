// api/index.js - VERSION URGENCE
console.log('🚀 Colarys API - Emergency debug version');

const express = require('express');
const app = express();

// Middleware basique
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(require('cors')({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

// Route de santé SIMPLE
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK - Emergency',
    message: 'Basic API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    database: 'Not tested'
  });
});

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys API - Emergency Mode",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// Test des variables d'environnement (sans crash)
app.get('/api/debug', (_req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    has_jwt_secret: !!process.env.JWT_SECRET,
    has_db_host: !!process.env.POSTGRES_HOST,
    has_db_user: !!process.env.POSTGRES_USER,
    // Ne pas montrer les valeurs sensibles
  });
});

console.log('✅ Emergency app configured');

module.exports = app;