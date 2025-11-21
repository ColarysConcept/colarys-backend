// @ts-nocheck
console.log('🚀 COLARYS API - ULTRA ROBUSTE...');

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());

// ========== ROUTES ESSENTIELLES ==========

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "🎉 Colarys API - Ultra Robuste!",
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    version: "3.0.0",
    environment: process.env.NODE_ENV || 'production',
    platform: "Vercel"
  });
});

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    service: "Colarys Concept API - Ultra Robuste",
    platform: "Vercel",
    database: process.env.POSTGRES_HOST ? "Configured" : "Not configured",
    jwt: process.env.JWT_SECRET ? "Configured" : "Not configured"
  });
});

// Route test DB
app.get('/api/test-db', (req, res) => {
  res.json({
    success: true,
    message: "Database configuration check - SUCCESS",
    timestamp: new Date().toISOString(),
    configurations: {
      postgres: !!process.env.POSTGRES_HOST,
      supabase: !!process.env.SUPABASE_URL,
      jwt: !!process.env.JWT_SECRET,
      environment: process.env.NODE_ENV || 'production'
    },
    variables: {
      postgres_host: process.env.POSTGRES_HOST ? '***' : 'NOT_SET',
      supabase_url: process.env.SUPABASE_URL ? '***' : 'NOT_SET',
      node_env: process.env.NODE_ENV || 'NOT_SET'
    }
  });
});

// Route auth simulée
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: "Login endpoint - WORKING",
    timestamp: new Date().toISOString(),
    user: "simulated_user",
    token: "simulated_jwt_token",
    note: "Replace with real authentication logic"
  });
});

// Route users simulée
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    message: "Users endpoint - WORKING",
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" }
    ]
  });
});

// Route agents simulée
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    message: "Agents endpoint - WORKING",
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, matricule: "AGT001", nom: "Doe", prenom: "John" },
      { id: 2, matricule: "AGT002", nom: "Smith", prenom: "Jane" }
    ]
  });
});

// Route présences simulée
app.get('/api/presences', (req, res) => {
  res.json({
    success: true,
    message: "Presences endpoint - WORKING",
    timestamp: new Date().toISOString(),
    data: []
  });
});

// Route pour lister toutes les routes disponibles
app.get('/api/routes', (req, res) => {
  const routes = [
    'GET  /',
    'GET  /api/health',
    'GET  /api/test-db',
    'POST /api/auth/login',
    'GET  /api/users',
    'GET  /api/agents',
    'GET  /api/presences',
    'GET  /api/routes'
  ];
  
  res.json({
    success: true,
    message: "Available routes",
    timestamp: new Date().toISOString(),
    routes: routes
  });
});

// Route 404 améliorée
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    requestedUrl: req.originalUrl,
    availableRoutes: [
      "GET  /",
      "GET  /api/health", 
      "GET  /api/test-db",
      "POST /api/auth/login",
      "GET  /api/users",
      "GET  /api/agents",
      "GET  /api/presences",
      "GET  /api/routes"
    ],
    timestamp: new Date().toISOString()
  });
});

console.log('✅ ULTRA ROBUSTE API configured with all essential routes');
module.exports = app;