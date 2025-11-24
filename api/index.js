// api/index.js - VERSION DEBUG AVANCÉE
console.log('🚀 Colarys API - Debug version with database test');

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')({ origin: '*', credentials: true }));

// Test des variables d'environnement
app.get('/api/debug-env', (_req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    HAS_JWT: !!process.env.JWT_SECRET,
    HAS_DB_HOST: !!process.env.POSTGRES_HOST,
    HAS_DB_USER: !!process.env.POSTGRES_USER,
    HAS_DB_PASS: !!process.env.POSTGRES_PASSWORD ? '***' : 'MISSING',
    HAS_DB_NAME: !!process.env.POSTGRES_DB,
    // Ne pas logger les valeurs réelles pour la sécurité
  };
  res.json(envVars);
});

// Test de la base de données
app.get('/api/debug-db', async (_req, res) => {
  try {
    console.log('🔄 Testing database connection...');
    const { AppDataSource } = require('../dist/config/data-source');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
    
    res.json({ 
      database: 'CONNECTED',
      message: 'Database is working correctly'
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      database: 'ERROR', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Routes de base
app.get('/', (_req, res) => {
  res.json({ 
    message: "🚀 Colarys API - Debug Mode", 
    status: "Database test required",
    debug: {
      env: "/api/debug-env",
      database: "/api/debug-db"
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'DEBUG_MODE', 
    message: 'Running in debug mode - check database connection',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Debug app configured - testing environment and database');

module.exports = app;