// api/index.js - Version simplifiée avec toutes les routes
const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://colarys-frontend.vercel.app')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configuration DB
const DB_CONFIG = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  logging: false,
  synchronize: false
};

let AppDataSource = null;

// Fonction de connexion DB
const connectDB = async () => {
  if (AppDataSource?.isInitialized) {
    return AppDataSource;
  }
  
  try {
    console.log('🔄 Connecting to DB with config:', {
      hasUrl: !!process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER
    });
    
    // Configuration simple
    const config = {
      type: "postgres",
      // Priorité 1: DATABASE_URL
      url: process.env.DATABASE_URL,
      // Priorité 2: Variables séparées
      host: process.env.POSTGRES_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
      port: parseInt(process.env.POSTGRES_PORT || "6543"),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB || 'postgres',
      // SSL pour Supabase
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      extra: {
        ssl: {
          rejectUnauthorized: false
        }
      }
    };
    
    AppDataSource = new DataSource(config);
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');
    return AppDataSource;

    } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      hasEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_HOST: !!process.env.POSTGRES_HOST,
        POSTGRES_USER: !!process.env.POSTGRES_USER
      }
    });
    return null;
  }
};

// ========== ROUTES DE BASE ==========

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys API",
    version: "2.0.0",
    endpoints: [
      "/api/health",
      "/api/db-test",
      "/api/agents-colarys",
      "/api/agents-colarys/:id",
      "/api/presences/entree",
      "/api/presences/sortie",
      "/api/presences/etat",
      "/api/presences/historique"
    ]
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// DB test
app.get('/api/db-test', async (_req, res) => {
  try {
    const dataSource = await connectDB();
    if (!dataSource) {
      return res.status(503).json({
        success: false,
        error: "Database unavailable"
      });
    }
    
    const result = await dataSource.query('SELECT NOW() as time');
    res.json({
      success: true,
      database: "connected",
      time: result[0].time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ROUTES AGENTS ==========

// GET tous les agents
app.get('/api/agents-colarys', async (_req, res) => {
  try {
    const dataSource = await connectDB();
    if (!dataSource) {
      return res.status(503).json({
        success: false,
        error: "Database service unavailable"
      });
    }
    
    const agents = await dataSource.query(`
      SELECT * FROM agents_colarys 
      ORDER BY nom ASC, prenom ASC
    `);
    
    // Formater les images
    const formattedAgents = agents.map(agent => ({
      ...agent,
      displayImage: agent.image && !agent.image.includes('default-avatar')
        ? agent.image
        : '/images/default-avatar.svg',
      hasDefaultImage: !agent.image || agent.image.includes('default-avatar')
    }));
    
    res.json({
      success: true,
      data: formattedAgents,
      count: agents.length
    });
    
  } catch (error) {
    console.error('❌ Error getting agents:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// GET agent par ID
app.get('/api/agents-colarys/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID invalide"
      });
    }
    
    const dataSource = await connectDB();
    if (!dataSource) {
      return res.status(503).json({
        success: false,
        error: "Database service unavailable"
      });
    }
    
    const result = await dataSource.query(
      `SELECT * FROM agents_colarys WHERE id = $1`,
      [id]
    );
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }
    
    const agent = result[0];
    const formattedAgent = {
      ...agent,
      displayImage: agent.image && !agent.image.includes('default-avatar')
        ? agent.image
        : '/images/default-avatar.svg',
      hasDefaultImage: !agent.image || agent.image.includes('default-avatar')
    };
    
    res.json({
      success: true,
      data: formattedAgent
    });
    
  } catch (error) {
    console.error('❌ Error getting agent:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// Copiez aussi les routes présences de votre minimal.js
// ... (copiez les routes présences de votre minimal.js existant)

// ========== GESTION ERREURS ==========

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
    path: req.originalUrl
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('🔥 Global error:', err);
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur"
  });
});

// Route temporaire avec données mock
app.get('/api/agents-mock', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        matricule: "EMP001",
        nom: "Dupont",
        prenom: "Jean",
        role: "Développeur",
        mail: "jean.dupont@colarys.com",
        displayImage: "/images/default-avatar.svg",
        hasDefaultImage: true
      },
      {
        id: 2,
        matricule: "EMP002",
        nom: "Martin",
        prenom: "Marie",
        role: "Designer",
        mail: "marie.martin@colarys.com",
        displayImage: "/images/default-avatar.svg",
        hasDefaultImage: true
      }
    ],
    count: 2,
    mock: true
  });
});

// Test DB détaillé
app.get('/api/db-test-detailed', async (_req, res) => {
  try {
    console.log('DB Config:', {
      hasUrl: !!process.env.DATABASE_URL,
      hasHost: !!process.env.POSTGRES_HOST,
      hasUser: !!process.env.POSTGRES_USER,
      hasPassword: !!process.env.POSTGRES_PASSWORD
    });
    
    const dataSource = new DataSource(DB_CONFIG);
    await dataSource.initialize();
    
    const result = await dataSource.query('SELECT NOW() as time, version() as version');
    
    res.json({
      success: true,
      connected: true,
      time: result[0].time,
      version: result[0].version,
      config: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER?.substring(0, 5) + '...',
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });
    
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      config: DB_CONFIG
    });
  }
});

// Export pour Vercel
module.exports = app;