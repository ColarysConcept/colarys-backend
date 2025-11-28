// api/index.js - Version ultra-simplifiée
console.log('🚀 Colarys API - Starting Vercel Function...');

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`📱 ${req.method} ${req.path}`);
  next();
});

// Route santé simplifiée
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server",
    status: "operational",
    timestamp: new Date().toISOString()
  });
});

// Route pour initialiser la DB et créer l'utilisateur
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('🔄 Initializing database...');
    
    // Essayer d'importer TypeORM
    let dbInitialized = false;
    let userCreated = false;
    
    try {
      const { initializeDatabase } = require('../dist/config/data-source');
      const { AppDataSource } = require('../dist/config/data-source');
      const { User } = require('../dist/entities/User');
      const bcrypt = require('bcryptjs');
      
      // Initialiser DB
      dbInitialized = await initializeDatabase();
      
      if (dbInitialized) {
        // Créer utilisateur
        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOne({ 
          where: { email: 'ressource.prod@gmail.com' } 
        });
        
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('stage25', 10);
          const defaultUser = userRepository.create({
            name: 'Admin Ressources',
            email: 'ressource.prod@gmail.com',
            password: hashedPassword,
            role: 'admin'
          });
          await userRepository.save(defaultUser);
          userCreated = true;
        } else {
          userCreated = true;
        }
      }
    } catch (dbError) {
      console.log('⚠️ Database init failed:', dbError.message);
    }
    
    res.json({
      success: true,
      database: dbInitialized ? "connected" : "disconnected",
      user: userCreated ? "created/exists" : "not_created",
      credentials: {
        email: "ressource.prod@gmail.com",
        password: "stage25"
      }
    });
    
  } catch (error) {
    console.error('❌ Init DB error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test DB
app.get('/api/test-db', async (req, res) => {
  try {
    let dbStatus = "not_attempted";
    
    try {
      const { initializeDatabase } = require('../dist/config/data-source');
      dbStatus = await initializeDatabase() ? "connected" : "failed";
    } catch (error) {
      dbStatus = `error: ${error.message}`;
    }
    
    res.json({
      success: true,
      database: dbStatus,
      environment: {
        node_env: process.env.NODE_ENV,
        postgres_host: process.env.POSTGRES_HOST ? "set" : "missing",
        postgres_user: process.env.POSTGRES_USER ? "set" : "missing"
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Gestionnaire d'erreurs
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl
  });
});

console.log('✅ Vercel Function initialized successfully');

module.exports = app;