// api/index.js - Version corrigée sans variable inutilisée
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Colarys API...');

// Chemin vers l'app compilée
const distAppPath = path.join(__dirname, '../dist/app.js');

console.log('📁 Checking for compiled app at:', distAppPath);

if (fs.existsSync(distAppPath)) {
  // Charger l'app compilée depuis dist/
  console.log('✅ Loading compiled TypeScript app from dist/');
  try {
    const app = require(distAppPath).default;
    console.log('✅ Full TypeScript app loaded successfully');
    module.exports = app;
  } catch (error) {
    console.error('❌ Error loading compiled app:', error.message);
    loadFallbackApp();
  }
} else {
  console.log('⚠️ Compiled app not found, using fallback');
  loadFallbackApp();
}

function loadFallbackApp() {
  console.log('🔧 Loading fallback app...');
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Route racine
  app.get('/', (req, res) => {
    res.json({
      message: "🚀 Colarys API (Fallback Mode)",
      timestamp: new Date().toISOString(),
      status: "OK",
      note: "Run 'npm run build' to build TypeScript files"
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: "OK", 
      environment: process.env.NODE_ENV || 'production',
      service: "Colarys Concept API",
      mode: "fallback"
    });
  });
  
  app.get('/api/test', (req, res) => {
    res.json({
      success: true,
      message: "API test successful!",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      mode: "fallback"
    });
  });
  
  // Route 404
  app.use('*', (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      availableRoutes: ["/", "/api/health", "/api/test"],
      mode: "fallback"
    });
  });
  
  module.exports = app;
}