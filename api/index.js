// @ts-nocheck
console.log('🚀 Starting Colarys API - Loading full TypeScript app...');

const fs = require('fs');
const path = require('path');

// Chemin vers l'app compilée
const distAppPath = path.join(__dirname, '../dist/app.js');

console.log('📁 Checking for dist/app.js at:', distAppPath);

if (fs.existsSync(distAppPath)) {
  console.log('✅ dist/app.js found! Attempting to load full app...');
  try {
    // Charger l'app compilée
    const app = require(distAppPath).default;
    console.log('🎉 SUCCESS: Full Colarys API loaded from dist!');
    console.log('📋 All routes from app.ts are now available');
    module.exports = app;
  } catch (error) {
    console.error('❌ FAILED to load dist/app.js:', error.message);
    console.error('Stack trace:', error.stack);
    loadFallbackApp('load-error');
  }
} else {
  console.log('❌ dist/app.js not found');
  loadFallbackApp('not-found');
}

function loadFallbackApp(reason) {
  console.log(`🔧 Loading fallback app (reason: ${reason})...`);
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Routes basiques
  app.get('/', (req, res) => {
    res.json({
      message: "🚀 Colarys API (Fallback Mode)",
      timestamp: new Date().toISOString(),
      status: "OK",
      reason: reason,
      note: "Full TypeScript app not loaded - check build process"
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: "OK", 
      environment: process.env.NODE_ENV || 'production',
      service: "Colarys Concept API",
      mode: "fallback",
      reason: reason
    });
  });
  
  module.exports = app;
}