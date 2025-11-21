// api/index.js - Version compatible avec votre tsconfig
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour builder le projet si nécessaire
function buildProject() {
  console.log('📦 Building TypeScript project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

// Chemin vers l'app compilée
const distAppPath = path.join(__dirname, '../dist/app.js');
const distDir = path.join(__dirname, '../dist');

// Vérifier si le build existe, sinon le créer
if (!fs.existsSync(distDir)) {
  console.log('🔨 dist directory not found, building...');
  buildProject();
}

if (fs.existsSync(distAppPath)) {
  // Charger l'app compilée
  console.log('✅ Loading compiled app from dist');
  try {
    const app = require(distAppPath).default;
    module.exports = app;
  } catch (error) {
    console.error('❌ Failed to load compiled app:', error.message);
    // Fallback vers l'app basique
    createFallbackApp();
  }
} else {
  console.log('⚠️ Compiled app not found, using fallback');
  createFallbackApp();
}

function createFallbackApp() {
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
      note: "Building TypeScript files..."
    });
  });
  
  // Route santé
  app.get('/api/health', (req, res) => {
    res.json({
      status: "OK", 
      environment: process.env.NODE_ENV || 'production',
      service: "Colarys Concept API",
      mode: "fallback"
    });
  });
  
  // Route test - IMPORTANT: Ajout de cette route manquante
  app.get('/api/test', (req, res) => {
    res.json({
      success: true,
      message: "API test successful!",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      mode: "fallback"
    });
  });
  
  // Route 404 améliorée
  app.use('*', (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      availableRoutes: [
        "/", 
        "/api/health", 
        "/api/test",
        "/api/auth/*",
        "/api/users/*",
        "/api/agents/*"
      ],
      mode: "fallback"
    });
  });
  
  module.exports = app;
}