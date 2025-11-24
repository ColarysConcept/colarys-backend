// api/index.js - VERSION DEBUG COMPLÈTE
console.log('🚀 Colarys API - Debug version with full error tracking');

try {
  console.log('📦 Step 1: Loading environment variables...');
  console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST ? '✓' : '✗');
  console.log('POSTGRES_USER:', process.env.POSTGRES_USER ? '✓' : '✗');
  console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***' : '✗');
  console.log('POSTGRES_DB:', process.env.POSTGRES_DB ? process.env.POSTGRES_DB : '✗');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : '✗');

  console.log('📦 Step 2: Importing compiled app...');
  const app = require('../dist/app').default;
  console.log('✅ App imported successfully');

  console.log('📦 Step 3: Testing database connection...');
  const { AppDataSource } = require('../dist/config/data-source');
  
  // Test de connexion à la base de données
  AppDataSource.initialize()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      console.error('Full error:', error);
    });

  console.log('🎉 Serverless function ready');
  module.exports = app;

} catch (error) {
  console.error('❌ CRITICAL ERROR during initialization:', error);
  
  // Fallback Express app
  const express = require('express');
  const fallbackApp = express();
  
  fallbackApp.use(express.json());
  fallbackApp.get('/', (req, res) => {
    res.json({ 
      status: 'ERROR',
      message: 'Application failed to start',
      error: error.message
    });
  });
  
  fallbackApp.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ERROR',
      message: 'Application initialization failed',
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ Fallback app configured');
  module.exports = fallbackApp;
}