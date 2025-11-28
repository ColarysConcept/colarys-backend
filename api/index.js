// api/index.js - Point d'entrée Vercel CORRIGÉ
console.log('🚀 Colarys API - Vercel Serverless Function Starting...');

let app;
let dbInitialized = false;

const initializeApp = async () => {
  try {
    console.log('🔄 Initializing application...');
    
    // Import de l'app compilée - CHEMIN CORRIGÉ
    app = require('../dist/app').default;
    console.log('✅ App imported successfully');
    
    // Initialisation de la base de données avec retry
    console.log('🔄 Initializing database connection...');
    
    const { initializeDatabase } = require('../dist/config/data-source');
    
    // Tentative de connexion avec 3 essais
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📊 Database connection attempt ${attempt}/3...`);
        dbInitialized = await initializeDatabase();
        
        if (dbInitialized) {
          console.log('✅ Database connected successfully');
          break;
        } else {
          console.log(`❌ Database connection attempt ${attempt} failed`);
        }
      } catch (dbError) {
        console.error(`❌ Database attempt ${attempt} error:`, dbError.message);
      }
      
      if (attempt < 3) {
        console.log('⏳ Waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!dbInitialized) {
      console.warn('⚠️ Database connection failed, but continuing in limited mode');
    }
    
    console.log('🎉 Vercel serverless function ready');
    return app;
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    
    // Fallback minimal si l'import échoue
    const express = require('express');
    const fallbackApp = express();
    
    fallbackApp.use(require('cors')());
    fallbackApp.use(express.json());
    
    // Routes de base en fallback
    fallbackApp.get('/api/health', (_req, res) => {
      res.json({
        status: "fallback",
        message: "Running in fallback mode",
        database: dbInitialized ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString()
      });
    });
    
    fallbackApp.get('/', (_req, res) => {
      res.json({
        message: "Colarys API (Fallback Mode)",
        status: "operational",
        database: dbInitialized ? "connected" : "disconnected"
      });
    });
    
    fallbackApp.all('*', (req, res) => {
      res.status(503).json({
        error: "Service initializing",
        message: "Database connection in progress, please try again",
        database: dbInitialized ? "connected" : "disconnected"
      });
    });
    
    return fallbackApp;
  }
};

// Initialiser l'app immédiatement
const appPromise = initializeApp();

// Export pour Vercel
module.exports = async (req, res) => {
  try {
    const currentApp = await appPromise;
    
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return currentApp(req, res);
  } catch (error) {
    console.error('❌ Request handler error:', error);
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      database: dbInitialized ? "connected" : "disconnected"
    });
  }
};