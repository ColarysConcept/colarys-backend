// api/index.js - Version avec votre vraie application
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Builder si nécessaire
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Importer votre vraie application
try {
  const app = require('../dist/app').default;
  console.log('✅ Loaded full Colarys API from dist');
  module.exports = app;
} catch (error) {
  console.error('❌ Failed to load full app, using fallback:', error);
  // Fallback simplifié
  const express = require('express');
  const app = express();
  app.use(require('cors')());
  app.use(require('express').json());
  
  app.get('/', (req, res) => {
    res.json({ 
      message: "🚀 Colarys API (Fallback Mode)", 
      status: "OK",
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: "OK", environment: "production" });
  });
  
  module.exports = app;
}