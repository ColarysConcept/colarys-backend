// api/index.js - VERSION AVEC GESTION DES LOGS
console.log('🚀 Colarys API - Starting Vercel serverless function...');

const fs = require('fs');
const path = require('path');

// Créer le dossier logs dans /tmp (le seul endroit accessible en écriture sur Vercel)
const logsDir = '/tmp/logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory in /tmp');
}

try {
  // Rediriger les logs vers /tmp
  process.env.LOG_DIR = '/tmp/logs';
  
  const app = require('../dist/app').default;
  console.log('✅ App imported successfully');

  const { AppDataSource } = require('../dist/config/data-source');
  
  const initDB = async () => {
    try {
      console.log('🔄 Initializing database connection...');
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  };

  initDB();

  console.log('🎉 Vercel serverless function ready');
  module.exports = app;

} catch (error) {
  console.error('❌ CRITICAL ERROR:', error);
  
  const express = require('express');
  const app = express();
  
  app.get('/', (_req, res) => {
    res.json({ 
      status: 'ERROR', 
      message: 'Application failed to start',
      error: error.message 
    });
  });
  
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ERROR',
      message: 'Application initialization failed',
      timestamp: new Date().toISOString()
    });
  });
  
  module.exports = app;
}