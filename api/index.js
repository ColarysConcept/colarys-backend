// api/index.js - Point d'entrée corrigé pour Vercel
console.log('🚀 Colarys API - Vercel Serverless Function Starting...');

const path = require('path');

// Ajouter dist/ au path pour les require
require('module').Module._nodeModulePaths.push(path.join(process.cwd(), 'dist'));

const initializeApp = async () => {
  try {
    console.log('🔄 Loading compiled application from dist/...');
    
    // Forcer le chargement depuis dist/
    const appPath = path.join(process.cwd(), 'dist', 'app.js');
    console.log('📁 App path:', appPath);
    
    const appModule = require(appPath);
    const app = appModule.default || appModule;
    
    console.log('✅ App imported successfully from dist/');
    
    // Initialiser la base de données
    console.log('🔄 Initializing database...');
    const { initializeDatabase } = require(path.join(process.cwd(), 'dist', 'config', 'data-source.js'));
    
    let dbInitialized = false;
    try {
      dbInitialized = await initializeDatabase();
      console.log('✅ Database initialized:', dbInitialized);
    } catch (dbError) {
      console.log('⚠️ Database init warning:', dbError.message);
    }
    
    return app;
    
  } catch (error) {
    console.error('❌ Failed to load main app from dist/:', error);
    
    // Fallback minimal
    const express = require('express');
    const cors = require('cors');
    
    const fallbackApp = express();
    fallbackApp.use(cors());
    fallbackApp.use(express.json());
    
    fallbackApp.get('/', (req, res) => {
      res.json({
        message: "Colarys API - Fallback Mode",
        error: "Main app failed to load from dist/",
        timestamp: new Date().toISOString()
      });
    });
    
    fallbackApp.get('/api/health', (req, res) => {
      res.json({
        status: "fallback",
        message: "Check TypeScript compilation",
        timestamp: new Date().toISOString()
      });
    });
    
    return fallbackApp;
  }
};

const appPromise = initializeApp();

// Export pour Vercel
module.exports = async (req, res) => {
  try {
    const app = await appPromise;
    
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return app(req, res);
  } catch (error) {
    console.error('❌ Request handler error:', error);
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message
    });
  }
};