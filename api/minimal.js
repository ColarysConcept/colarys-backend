// api/minimal.js - Version avec gestion DB
console.log('🚀 Colarys API Enhanced - Starting...');

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========== GESTION DATABASE ==========
let dbInitialized = false;
let dbError = null;

const initializeDatabase = async () => {
  try {
    console.log('🔄 Attempting database connection...');
    
    // Essayer d'importer et d'initialiser la DB
    const { initializeDatabase: initDB } = require('../dist/config/data-source');
    dbInitialized = await initDB();
    
    if (dbInitialized) {
      console.log('✅ Database connected successfully');
    } else {
      dbError = 'Database initialization failed';
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    dbError = error.message;
    console.log('❌ Database error:', error.message);
  }
};

// Initialiser la DB au démarrage
initializeDatabase();

// ========== ROUTES ==========

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "✅ Colarys API is WORKING!",
    status: "operational", 
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: dbInitialized ? "connected" : "disconnected"
  });
});

// Route santé améliorée
app.get('/api/health', (req, res) => {
  res.json({
    status: "HEALTHY",
    message: "API server is running correctly",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbInitialized,
      error: dbError
    },
    environment: process.env.NODE_ENV || 'production'
  });
});

// Route pour initialiser/récupérer l'utilisateur
app.post('/api/init-user', async (req, res) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({
        success: false,
        error: "Database not connected",
        message: "Please check database configuration"
      });
    }

    const { AppDataSource } = require('../dist/config/data-source');
    const { User } = require('../dist/entities/User');
    const bcrypt = require('bcryptjs');

    const userRepository = AppDataSource.getRepository(User);
    
    // Vérifier si l'utilisateur existe
    let user = await userRepository.findOne({ 
      where: { email: 'ressource.prod@gmail.com' } 
    });

    if (!user) {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash('stage25', 10);
      user = userRepository.create({
        name: 'Admin Ressources',
        email: 'ressource.prod@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      await userRepository.save(user);
      
      res.json({
        success: true,
        action: 'created',
        message: 'Default user created successfully',
        user: {
          email: user.email,
          password: 'stage25'
        }
      });
    } else {
      res.json({
        success: true,
        action: 'exists',
        message: 'User already exists',
        user: {
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('❌ Init user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de login avec DB réelle
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!dbInitialized) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Service temporarily unavailable"
      });
    }

    const { AppDataSource } = require('../dist/config/data-source');
    const { User } = require('../dist/entities/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message
    });
  }
});

// Route pour vérifier la DB
app.get('/api/db-status', (req, res) => {
  res.json({
    database: {
      connected: dbInitialized,
      error: dbError,
      environment: {
        host: process.env.POSTGRES_HOST ? 'set' : 'missing',
        user: process.env.POSTGRES_USER ? 'set' : 'missing',
        database: process.env.POSTGRES_DB ? 'set' : 'missing'
      }
    }
  });
});

console.log('✅ Enhanced API ready!');

module.exports = app;