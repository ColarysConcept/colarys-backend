// api/index.js - VERSION AMÉLIORÉE AVEC MEILLEUR CHARGEMENT
console.log('🚀 Vercel API Handler - Starting with enhanced loading...');

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

// ✅ ÉTAT DE L'APPLICATION
let mainAppInitialized = false;
let dbInitialized = false;
let initializationAttempted = false;

// ✅ FONCTION D'INITIALISATION ASYNCHRONE
async function initializeMainApp() {
  if (initializationAttempted) return;
  initializationAttempted = true;
  
  try {
    console.log('🔄 Step 1: Loading main application...');
    
    // Charger l'application principale
    const mainApp = require('../dist/app').default;
    console.log('✅ Main application loaded');
    
    console.log('🔄 Step 2: Initializing database...');
    // Initialiser la base de données
    const { AppDataSource, initializeDatabase } = require('../dist/config/data-source');
    
    // Utiliser la fonction d'initialisation robuste
    dbInitialized = await initializeDatabase(2);
    
    if (dbInitialized) {
      console.log('✅ Database connected successfully');
      
      // Monter l'application principale
      app.use(mainApp);
      mainAppInitialized = true;
      console.log('🎉 Full application initialized with database');
    } else {
      console.warn('⚠️ Database connection failed, using basic mode');
      setupFallbackRoutes();
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize main app:', error.message);
    console.error('💥 Full error:', error);
    setupFallbackRoutes();
  }
}

// ✅ ROUTES DE BASE (TOUJOURS DISPONIBLES)
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server - Vercel Deployment",
    status: "RUNNING",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || 'production',
    mode: mainAppInitialized ? "FULL" : "BASIC",
    database: dbInitialized ? "CONNECTED" : "DISCONNECTED"
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    service: "Colarys Concept API",
    deployment: "Vercel",
    mode: mainAppInitialized ? "full" : "basic",
    database: dbInitialized ? "connected" : "disconnected"
  });
});

// ✅ ROUTE DE DIAGNOSTIC AMÉLIORÉE
app.get('/api/debug', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Vérifier si les fichiers dist existent
    const distExists = fs.existsSync(path.join(__dirname, '../dist'));
    const appExists = fs.existsSync(path.join(__dirname, '../dist/app.js'));
    const dataSourceExists = fs.existsSync(path.join(__dirname, '../dist/config/data-source.js'));
    
    // Test de connexion base de données
    let dbTest = { success: false, error: 'Not tested' };
    try {
      const { AppDataSource } = require('../dist/config/data-source');
      if (AppDataSource.isInitialized) {
        const result = await AppDataSource.query('SELECT NOW() as time');
        dbTest = { success: true, time: result[0].time };
      }
    } catch (dbError) {
      dbTest = { success: false, error: dbError.message };
    }
    
    res.json({
      environment: {
        node_env: process.env.NODE_ENV,
        has_db_host: !!process.env.POSTGRES_HOST,
        has_db_user: !!process.env.POSTGRES_USER,
        has_db_password: !!process.env.POSTGRES_PASSWORD,
        has_db_url: !!process.env.POSTGRES_URL
      },
      files: {
        dist_folder: distExists,
        app_js: appExists,
        data_source_js: dataSourceExists
      },
      application: {
        mainAppInitialized,
        dbInitialized,
        initializationAttempted
      },
      database_test: dbTest
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ROUTES DE SECOURS (SI L'APP PRINCIPALE ÉCHOUE)
function setupFallbackRoutes() {
  console.log('🛡️ Setting up fallback routes...');
  
  app.get('/api/agents', (req, res) => {
    res.json({
      success: true,
      message: "Basic mode - Sample data (REAL DATABASE NOT CONNECTED)",
      data: [
        { id: 1, matricule: "EMP001", nom: "DUPONT", prenom: "Jean", poste: "Developer" },
        { id: 2, matricule: "EMP002", nom: "MARTIN", prenom: "Marie", poste: "Designer" }
      ],
      note: "This is MOCK data. Database connection failed.",
      debug: {
        mainAppInitialized,
        dbInitialized,
        timestamp: new Date().toISOString()
      }
    });
  });

  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      message: "Basic mode - Sample data (REAL DATABASE NOT CONNECTED)",
      data: [
        { id: 1, name: "Admin", email: "admin@colarys.com", role: "admin" }
      ],
      note: "This is MOCK data. Database connection failed."
    });
  });
}

// ✅ DÉMARRER L'INITIALISATION (NON-BLOQUANT)
console.log('🔧 Starting non-blocking initialization...');
setTimeout(() => {
  initializeMainApp().catch(error => {
    console.error('💥 Initialization failed:', error);
  });
}, 100);

// ✅ ROUTE 404 AMÉLIORÉE
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/',
      '/api/health',
      '/api/debug',
      '/api/agents',
      '/api/users'
    ],
    application_status: {
      main: mainAppInitialized ? "loaded" : "not loaded",
      database: dbInitialized ? "connected" : "disconnected"
    }
  });
});

console.log('✅ Vercel API handler ready!');
module.exports = app;