// api/index.js - VERSION CORRIGÉE
console.log('🚀 Colarys API - Starting on Vercel...');

const express = require('express');
const app = express();

let dbInitialized = false;

// Middleware de base
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS pour Vercel
app.use(require('cors')({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://colarys-frontend.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

// Route santé améliorée
app.get('/api/health', async (_req, res) => {
  res.json({
    status: dbInitialized ? "OK" : "WARNING",
    message: dbInitialized ? "API opérationnelle" : "Initialisation de l'application...",
    database: dbInitialized ? "connecté" : "connexion",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server",
    status: dbInitialized ? "READY" : "INITIALIZING",
    timestamp: new Date().toISOString()
  });
});

// Middleware pour vérifier l'initialisation de la DB
app.use('/api', (req, res, next) => {
  if (!dbInitialized && !req.path.includes('/health')) {
    return res.status(503).json({
      error: "Service Temporarily Unavailable",
      message: "Database is initializing, please try again in a few seconds",
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Fonction d'initialisation
async function initializeApp() {
  try {
    console.log('📦 Importing compiled app...');
    
    // Importer l'app compilée
    const importedApp = require('../dist/app').default;
    
    // Monter l'app importée
    app.use(importedApp);
    
    // Initialiser la base de données
    console.log('🔄 Initializing database connection...');
    const { initializeDatabase } = require('../dist/config/data-source');
    const dbConnected = await initializeDatabase();
    
    dbInitialized = dbConnected;
    
    if (dbConnected) {
      console.log('🎉 Application fully initialized and ready');
    } else {
      console.warn('⚠️ Application running without database connection');
    }
    
  } catch (error) {
    // ✅ GESTION D'ERREUR SÉCURISÉE EN JS AUSSI
    console.error('❌ Application initialization failed:', error instanceof Error ? error.message : error);
    dbInitialized = false;
    
    // Routes de secours
    app.get('/api/agents', (_req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Database connection failed",
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/users', (_req, res) => {
      res.status(503).json({
        error: "Service Unavailable", 
        message: "Database connection failed",
        timestamp: new Date().toISOString()
      });
    });
  }
}

// Démarrer l'initialisation
initializeApp();

module.exports = app;