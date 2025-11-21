// @ts-nocheck
console.log('🚀 Starting Colarys API - DEBUG VERSION...');

const fs = require('fs');
const path = require('path');

// Route de debug pour voir l'état du déploiement
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Route debug - TESTEZ CETTE URL APRÈS DÉPLOIEMENT
app.get('/api/debug', (req, res) => {
  const distPath = path.join(__dirname, '../dist');
  const distExists = fs.existsSync(distPath);
  const appJsExists = fs.existsSync(path.join(__dirname, '../dist/app.js'));
  
  let distContents = [];
  let rootContents = [];
  
  try {
    if (distExists) {
      distContents = fs.readdirSync(distPath);
    }
    rootContents = fs.readdirSync(path.join(__dirname, '..'));
  } catch (e) {
    console.error('Error reading directories:', e.message);
  }

  res.json({
    message: "🔍 DEBUG INFORMATION",
    timestamp: new Date().toISOString(),
    deployment: {
      vercel: !!process.env.VERCEL,
      environment: process.env.NODE_ENV || 'production',
      node_version: process.version
    },
    files: {
      dist_folder_exists: distExists,
      dist_app_js_exists: appJsExists,
      root_files: rootContents.filter(f => !f.startsWith('.')),
      dist_files: distContents
    },
    paths: {
      current_dir: __dirname,
      dist_path: distPath,
      app_js_path: path.join(__dirname, '../dist/app.js')
    }
  });
});

// Essayer de charger l'app complète
const distAppPath = path.join(__dirname, '../dist/app.js');
console.log('📁 Checking for dist/app.js at:', distAppPath);

if (fs.existsSync(distAppPath)) {
  console.log('✅ dist/app.js found! Attempting to load full app...');
  try {
    const fullApp = require(distAppPath).default;
    console.log('🎉 SUCCESS: Full Colarys API loaded from dist!');
    
    // Monter l'app complète
    app.use('/', fullApp);
    
  } catch (error) {
    console.error('❌ FAILED to load dist/app.js:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Routes fallback basiques
    app.get('/', (req, res) => {
      res.json({
        message: "🚀 Colarys API (Fallback - Load Error)",
        timestamp: new Date().toISOString(),
        error: error.message,
        note: "Check Vercel build logs for TypeScript errors"
      });
    });
    
    app.get('/api/health', (req, res) => {
      res.json({
        status: "OK", 
        environment: process.env.NODE_ENV || 'production',
        service: "Colarys Concept API",
        mode: "fallback-load-error"
      });
    });
  }
} else {
  console.log('❌ dist/app.js not found');
  
  // Routes fallback basiques
  app.get('/', (req, res) => {
    res.json({
      message: "🚀 Colarys API (Fallback - dist not found)",
      timestamp: new Date().toISOString(),
      status: "OK",
      note: "dist/app.js not deployed - check build process"
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: "OK", 
      environment: process.env.NODE_ENV || 'production',
      service: "Colarys Concept API",
      mode: "fallback-not-found"
    });
  });
}

module.exports = app;