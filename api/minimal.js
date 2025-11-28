// api/minimal.js - Version avec connexion DB directe
console.log('🚀 Colarys API Enhanced - Starting...');

const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONFIGURATION DB DIRECTE ==========
let dbInitialized = false;
let dbError = null;
let AppDataSource = null;

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database directly...');
    
    AppDataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [
        // Entities minimales nécessaires
      ],
      synchronize: false,
      logging: false,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await AppDataSource.initialize();
    dbInitialized = true;
    console.log('✅ Database connected successfully');
    
  } catch (error) {
    dbError = error.message;
    console.log('❌ Database connection failed:', error.message);
  }
};

// Initialiser la DB
initializeDatabase();

// ========== ENTITÉS MANUELLES ==========

// Définir l'entité User manuellement
class User {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.email = undefined;
    this.password = undefined;
    this.role = undefined;
    this.createdAt = undefined;
    this.updatedAt = undefined;
  }
}

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

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: "HEALTHY",
    message: "API server is running correctly",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbInitialized,
      error: dbError
    }
  });
});

// Route de test DB simple
app.get('/api/test-db-simple', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized) {
      return res.json({
        success: false,
        error: "Database not connected",
        message: dbError
      });
    }

    // Test simple de connexion
    const result = await AppDataSource.query('SELECT NOW() as current_time, version() as postgres_version');
    
    res.json({
      success: true,
      message: "Database connection successful",
      test: result[0]
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Route pour créer l'utilisateur manuellement
app.post('/api/create-user-manual', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized) {
      return res.status(503).json({
        success: false,
        error: "Database not connected",
        message: dbError
      });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('stage25', 10);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await AppDataSource.query(
      'SELECT * FROM users WHERE email = $1',
      ['ressource.prod@gmail.com']
    );

    if (existingUser.length > 0) {
      // Mettre à jour le mot de passe
      await AppDataSource.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, 'ressource.prod@gmail.com']
      );

      return res.json({
        success: true,
        action: 'updated',
        message: 'User password updated to "stage25"',
        credentials: {
          email: 'ressource.prod@gmail.com',
          password: 'stage25'
        }
      });
    }

    // Créer l'utilisateur
    await AppDataSource.query(
      `INSERT INTO users (name, email, password, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      ['Admin Ressources', 'ressource.prod@gmail.com', hashedPassword, 'admin']
    );

    res.json({
      success: true,
      action: 'created',
      message: 'User created successfully',
      credentials: {
        email: 'ressource.prod@gmail.com',
        password: 'stage25'
      }
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Route de login avec DB directe
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: dbError
      });
    }

    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // Chercher l'utilisateur
    const users = await AppDataSource.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
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

console.log('✅ Enhanced API ready!');

module.exports = app;