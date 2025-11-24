// api/index.js - VERSION COMPLÈTE POUR VERCEL
console.log('🚀 Colarys API - Starting on Vercel...');

let app;
let isInitialized = false;

async function initializeApp() {
  try {
    console.log('📦 Importing compiled app...');
    app = require('../dist/app').default;
    
    // Initialiser la base de données
    console.log('🔄 Initializing database connection...');
    const { initializeDatabase } = require('../dist/config/data-source');
    const dbConnected = await initializeDatabase();
    
    if (dbConnected) {
      console.log('✅ Database connected successfully');
    } else {
      console.warn('⚠️ Database connection failed, but server will start');
    }
    
    isInitialized = true;
    console.log('🎉 Vercel function ready to handle requests');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    
    // Fallback: créer une app Express basique
    const express = require('express');
    app = express();
    
    // Middleware basique
    app.use(express.json());
    
    // Route de santé basique
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'WARNING', 
        message: 'Application initializing...',
        database: isInitialized ? 'connected' : 'connecting'
      });
    });
    
    // Routes par défaut
    app.get('*', (req, res) => {
      res.status(503).json({ 
        error: 'Service Temporarily Unavailable',
        message: 'Application is initializing, please try again in a few seconds',
        timestamp: new Date().toISOString()
      });
    });
    
    isInitialized = false;
  }
}

// Démarrer l'initialisation immédiatement
initializeApp();

module.exports = app;