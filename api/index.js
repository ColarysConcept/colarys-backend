// api/index.js - POINT D'ENTRÉE VERCELL
console.log('🚀 Vercel API Handler - Starting...');

const express = require('express');
const app = express();

// ✅ MIDDLEWARE DE BASE
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CORS
app.use(require('cors')({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:8080', 
    'https://colarys-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

// ✅ ROUTES DE BASE (TOUJOURS DISPONIBLES)
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server - Vercel Deployment",
    status: "RUNNING",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    service: "Colarys Concept API",
    deployment: "Vercel"
  });
});

// ✅ ESSAYER D'IMPORTER L'APPLICATION PRINCIPALE
let mainAppInitialized = false;

try {
  console.log('🔄 Attempting to load main application...');
  const mainApp = require('../dist/app').default;
  app.use(mainApp);
  mainAppInitialized = true;
  console.log('✅ Main application loaded successfully');
} catch (error) {
  console.warn('⚠️ Could not load main application:', error.message);
  console.log('🛠️ Running in basic mode with fallback routes');
  
  // ✅ ROUTES DE SECOURS
  app.get('/api/agents', (req, res) => {
    res.json({
      success: true,
      message: "Basic mode - Sample data",
      data: [
        { id: 1, matricule: "EMP001", nom: "DUPONT", prenom: "Jean", poste: "Developer" },
        { id: 2, matricule: "EMP002", nom: "MARTIN", prenom: "Marie", poste: "Designer" }
      ]
    });
  });

  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      message: "Basic mode - Sample data",
      data: [
        { id: 1, name: "Admin", email: "admin@colarys.com", role: "admin" }
      ]
    });
  });
}

// ✅ ROUTE POUR TESTER LA CONNEXION DB
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔧 Testing database connection...');
    const { AppDataSource } = require('../dist/config/data-source');
    
    if (AppDataSource.isInitialized) {
      const result = await AppDataSource.query('SELECT NOW() as time');
      res.json({
        success: true,
        message: "Database connected",
        time: result[0].time
      });
    } else {
      res.json({
        success: false,
        message: "Database not initialized",
        mainAppLoaded: mainAppInitialized
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database test failed: " + error.message
    });
  }
});

// ✅ ROUTE 404 AMÉLIORÉE
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/',
      '/api/health',
      '/api/test-db',
      '/api/agents',
      '/api/users'
    ],
    mainAppStatus: mainAppInitialized ? "loaded" : "not loaded"
  });
});

console.log('✅ Vercel API handler ready!');
module.exports = app;