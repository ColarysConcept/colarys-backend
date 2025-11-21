// @ts-nocheck
console.log('🚀 ULTRA-SIMPLE API Starting on Vercel...');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: "🎉 ULTRA-SIMPLE API WORKS!",
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    version: "3.0.0"
  });
});

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    service: "Colarys Concept API - Simple Version",
    platform: "Vercel"
  });
});

// Route test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: "Simple API test successful!",
    timestamp: new Date().toISOString(),
    version: "3.0.0"
  });
});

// Route debug pour voir l'environnement
app.get('/api/debug', (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: "Debug endpoint"
  });
});

console.log('✅ ULTRA-SIMPLE API configured');

module.exports = app;