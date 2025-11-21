// api/index.js - Version ultra-simplifiée
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Colarys API is running!",
    timestamp: new Date().toISOString(),
    status: "OK"
  });
});

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    service: "Colarys Concept API"
  });
});

// Route test simple
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: "API test successful!",
    timestamp: new Date().toISOString()
  });
});

// Gestionnaire 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    availableRoutes: ["/", "/api/health", "/api/test"]
  });
});

module.exports = app;