// api/minimal.js - Version complète avec table "user"
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

// Route pour créer la table user (au singulier)
app.get('/api/create-user-table', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('🔄 Creating user table...');

    // Créer la table user (au singulier)
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS user (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ User table created successfully');

    res.json({
      success: true,
      message: 'User table created successfully',
      next_step: 'Now create the user at /api/create-user-get'
    });

  } catch (error) {
    console.error('❌ Create table error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Route GET pour créer l'utilisateur (version avec table "user")
app.get('/api/create-user-get', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('stage25', 10);

    // Vérifier si l'utilisateur existe déjà dans la table "user"
    const existingUser = await AppDataSource.query(
      'SELECT * FROM user WHERE email = $1',
      ['ressource.prod@gmail.com']
    );

    let action = 'exists';
    
    if (existingUser.length === 0) {
      // Créer l'utilisateur dans la table "user"
      await AppDataSource.query(
        `INSERT INTO user (name, email, password, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        ['Admin Ressources', 'ressource.prod@gmail.com', hashedPassword, 'admin']
      );
      action = 'created';
    } else {
      // Mettre à jour le mot de passe dans la table "user"
      await AppDataSource.query(
        'UPDATE user SET password = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, 'ressource.prod@gmail.com']
      );
      action = 'updated';
    }

    res.json({
      success: true,
      action: action,
      message: `User ${action} successfully`,
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

// Route de login avec table "user"
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

    // Chercher l'utilisateur dans la table "user"
    const users = await AppDataSource.query(
      'SELECT * FROM user WHERE email = $1',
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

// Route pour lister tous les utilisateurs (debug)
app.get('/api/list-users', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const users = await AppDataSource.query('SELECT id, name, email, role, created_at FROM user');
    
    res.json({
      success: true,
      users: users,
      count: users.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de diagnostic d'environnement
app.get('/api/debug-env', (req, res) => {
  res.json({
    environment: {
      node_env: process.env.NODE_ENV,
      postgres_host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
      postgres_user: process.env.POSTGRES_USER ? '***' : 'MISSING', 
      postgres_db: process.env.POSTGRES_DB ? '***' : 'MISSING',
      postgres_port: process.env.POSTGRES_PORT || '5432',
      jwt_secret: process.env.JWT_SECRET ? 'SET' : 'MISSING'
    },
    database: {
      connected: dbInitialized,
      error: dbError
    }
  });
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
    path: req.originalUrl,
    available_routes: [
      "/",
      "/api/health",
      "/api/test-db-simple",
      "/api/create-user-table",
      "/api/create-user-get",
      "/api/list-users",
      "/api/debug-env",
      "POST /api/auth/login"
    ]
  });
});

console.log('✅ Enhanced API ready!');

module.exports = app;