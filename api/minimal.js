// api/minimal.js - Version corrigée pour Supabase avec colonnes majuscules
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

// Route de login CORRIGÉE pour les colonnes majuscules
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

    // Chercher l'utilisateur avec les colonnes correctes (majuscules)
    const users = await AppDataSource.query(
      'SELECT id, name, email, password, role, "createdAt", "updatedAt" FROM "user" WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    const user = users[0];
    console.log('🔍 User found:', { email: user.email, passwordLength: user.password ? user.password.length : 'null' });

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('❌ Password comparison failed');
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

    console.log('✅ Login successful for user:', user.email);

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


// ========== ROUTES POUR LE FRONTEND ==========

// Route pour agents-colarys
app.get('/api/agents-colarys', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching agents from database...');

    // Essayer de récupérer depuis la table agents_colarys
    let agents = [];
    try {
      agents = await AppDataSource.query('SELECT * FROM agents_colarys LIMIT 50');
      console.log(`✅ Found ${agents.length} agents in agents_colarys`);
    } catch (error) {
      console.log('⚠️ agents_colarys table not found, trying other tables...');
      
      // Essayer d'autres tables possibles
      try {
        agents = await AppDataSource.query('SELECT * FROM agent LIMIT 50');
        console.log(`✅ Found ${agents.length} agents in agent table`);
      } catch (error2) {
        console.log('⚠️ agent table not found either');
      }
    }

    // Données mockées en attendant
    if (agents.length === 0) {
      agents = [
        {
          id: 1,
          name: "Agent Test 1",
          email: "agent1@test.com",
          status: "active"
        },
        {
          id: 2, 
          name: "Agent Test 2",
          email: "agent2@test.com",
          status: "active"
        }
      ];
      console.log('📝 Using mock agents data');
    }

    res.json({
      success: true,
      data: agents,
      count: agents.length,
      message: agents.length > 0 ? "Agents retrieved successfully" : "Using mock data - no agents table found"
    });

  } catch (error) {
    console.error('❌ Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch agents",
      message: error.message
    });
  }
});

// Route pour les présences
app.get('/api/presences', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching presences...');

    let presences = [];
    try {
      presences = await AppDataSource.query('SELECT * FROM presence LIMIT 50');
    } catch (error) {
      console.log('⚠️ presence table not found');
    }

    // Données mockées
    if (presences.length === 0) {
      presences = [
        {
          id: 1,
          agent_id: 1,
          date: new Date().toISOString(),
          status: "present"
        }
      ];
    }

    res.json({
      success: true,
      data: presences,
      count: presences.length
    });

  } catch (error) {
    console.error('❌ Error fetching presences:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch presences"
    });
  }
});

// Route pour les plannings
app.get('/api/plannings', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching plannings...');

    let plannings = [];
    try {
      plannings = await AppDataSource.query('SELECT * FROM planning LIMIT 50');
    } catch (error) {
      console.log('⚠️ planning table not found');
    }

    // Données mockées
    if (plannings.length === 0) {
      plannings = [
        {
          id: 1,
          agent_id: 1,
          date: new Date().toISOString(),
          shift: "morning"
        }
      ];
    }

    res.json({
      success: true,
      data: plannings,
      count: plannings.length
    });

  } catch (error) {
    console.error('❌ Error fetching plannings:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plannings"
    });
  }
});

// Route pour debug - lister toutes les tables
app.get('/api/debug-tables', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    res.json({
      success: true,
      tables: tables.map(t => t.table_name),
      count: tables.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour vérifier l'utilisateur spécifique
app.get('/api/check-my-user', async (req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const user = await AppDataSource.query(
      'SELECT id, name, email, role, "createdAt", "updatedAt" FROM "user" WHERE email = $1',
      ['ressource.prod@gmail.com']
    );

    if (user.length === 0) {
      return res.json({
        success: false,
        message: "User not found in database"
      });
    }

    res.json({
      success: true,
      user: user[0],
      message: "User found in database"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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

    const users = await AppDataSource.query('SELECT id, name, email, role, "createdAt", "updatedAt" FROM "user"');
    
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

console.log('✅ Enhanced API ready!');

module.exports = app;