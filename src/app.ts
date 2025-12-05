import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { AppDataSource, initializeDatabase } from "./config/data-source";
import { User } from "./entities/User";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import agentRoutes from "./routes/agentRoutes";
import presenceRoutes from "./routes/presenceRoutes";
import detailPresenceRoutes from "./routes/detailPresenceRoutes";
import histoAgentsRoutes from "./routes/histoAgentsRoutes";
import roleRoutes from "./routes/roleRoutes";
import planningRoutes from "./routes/planningRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import agentColarysRoutes from "./routes/agentColarysRoutes";
import colarysRoutes from "./routes/colarysRoutes";

console.log('🚀 Starting Colarys API Server...');

dotenv.config();

// Vérification des variables d'environnement
const requiredEnvVars = [
  'JWT_SECRET',
  'POSTGRES_HOST', 
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ ${envVar} is not defined`);
  }
});

const API_PREFIX = "/api";
const app = express();

// Configuration CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:3000', 
      'http://localhost:8080',
      'https://colarys-frontend.vercel.app',
      'https://*.vercel.app'
    ];
    
    if (origin && origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, _res, next) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// ========== FONCTIONS UTILITAIRES ==========

const resetUserPassword = async () => {
  try {
    console.log('🔄 Réinitialisation du mot de passe utilisateur...');
    
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ 
      where: { email: 'ressource.prod@gmail.com' } 
    });
    
    if (existingUser) {
      const hashedPassword = await bcrypt.hash('stage25', 10);
      existingUser.password = hashedPassword;
      await userRepository.save(existingUser);
      console.log('✅ Mot de passe réinitialisé avec "stage25" pour:', existingUser.email);
    } else {
      console.log('❌ Utilisateur non trouvé pour réinitialisation');
    }
  } catch (error: any) {
    console.log('⚠️ Erreur réinitialisation mot de passe:', error.message);
  }
};

const createDefaultUser = async () => {
  try {
    console.log('🔄 Vérification/création utilisateur par défaut...');
    
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
      console.log('✅ Utilisateur par défaut créé en base de données');
    } else {
      console.log('✅ Utilisateur existe déjà en base');
      await resetUserPassword();
    }
  } catch (error: any) {
    console.log('⚠️ Note: Utilisateur non créé (DB peut être en cours de setup):', error.message);
  }
};

// ========== ROUTES DE BASE ==========

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected"
  });
});

// Route de santé
app.get(`${API_PREFIX}/health`, async (_req, res) => {
  try {
    const dbStatus = AppDataSource.isInitialized ? "Connected" : "Disconnected";
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: "Colarys Concept API",
      version: "2.0.0",
      database: dbStatus
    });
  } catch (error: any) {
    res.json({
      status: "WARNING",
      database: "Connection issues",
      error: error.message
    });
  }
});

// Route de test de connexion DB
app.get(`${API_PREFIX}/db-test`, async (_req, res) => {
  try {
    console.log('🔧 Testing database connection...');
    
    const dbStatus = {
      initialized: AppDataSource.isInitialized,
      environment: process.env.NODE_ENV,
      host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
      database: process.env.POSTGRES_DB ? '***' : 'MISSING',
      user: process.env.POSTGRES_USER ? '***' : 'MISSING',
      port: process.env.POSTGRES_PORT
    };

    let connectionTest = "Not attempted";
    let entities: string[] = [];
    
    if (!AppDataSource.isInitialized) {
      console.log('🔄 Attempting to initialize database...');
      const connected = await initializeDatabase();
      
      if (connected) {
        connectionTest = "SUCCESS - Connected via test";
        entities = AppDataSource.entityMetadatas.map(e => e.name);
        
        // Test query
        try {
          await AppDataSource.query('SELECT 1 as test');
          connectionTest += " (Query OK)";
        } catch (queryError) {
          connectionTest += ` (Query failed: ${queryError.message})`;
        }
      } else {
        connectionTest = "FAILED - Could not initialize";
      }
    } else {
      try {
        await AppDataSource.query('SELECT 1');
        connectionTest = "SUCCESS - Already connected (Query OK)";
        entities = AppDataSource.entityMetadatas.map(e => e.name);
      } catch (error) {
        connectionTest = `FAILED - Query error: ${error.message}`;
      }
    }

    res.json({
      success: true,
      database: {
        status: dbStatus,
        connectionTest: connectionTest,
        entities: entities,
        isInitialized: AppDataSource.isInitialized
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "DB test failed",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route de debug des entités
app.get(`${API_PREFIX}/debug-entities`, async (_req, res) => {
  try {
    console.log('🔧 Debug entities endpoint called');
    
    const dbStatus = {
      initialized: AppDataSource.isInitialized,
      entityCount: AppDataSource.entityMetadatas.length,
      entities: AppDataSource.entityMetadatas.map(meta => ({
        name: meta.name,
        tableName: meta.tableName,
        columns: meta.columns.map(col => col.propertyName)
      }))
    };

    // Vérification spécifique d'AgentColarys
    const agentColarysInfo = AppDataSource.entityMetadatas.find(
      meta => meta.name === 'AgentColarys' || meta.tableName === 'agents_colarys'
    );

    res.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        database: dbStatus,
        agentColarys: agentColarysInfo ? {
          found: true,
          name: agentColarysInfo.name,
          tableName: agentColarysInfo.tableName,
          columnCount: agentColarysInfo.columns.length
        } : {
          found: false,
          message: "AgentColarys entity not found in TypeORM metadata"
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Debug entities error:', error);
    res.status(500).json({
      success: false,
      error: "Debug failed",
      message: error.message
    });
  }
});

// ========== MOUNT DES ROUTES API ==========

console.log('📋 Mounting API routes...');

app.use(`${API_PREFIX}/auth`, authRoutes);
console.log('✅ Mounted: /api/auth');

app.use(`${API_PREFIX}/users`, userRoutes);
console.log('✅ Mounted: /api/users');

app.use(`${API_PREFIX}/agents`, agentRoutes);
console.log('✅ Mounted: /api/agents');

app.use(`${API_PREFIX}/presences`, presenceRoutes);
console.log('✅ Mounted: /api/presences');

app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes);
console.log('✅ Mounted: /api/attendance-details');

app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes);
console.log('✅ Mounted: /api/agent-history');

app.use(`${API_PREFIX}/roles`, roleRoutes);
console.log('✅ Mounted: /api/roles');

app.use(`${API_PREFIX}/plannings`, planningRoutes);
console.log('✅ Mounted: /api/plannings');

app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes);
console.log('✅ Mounted: /api/agents-colarys');

app.use(`${API_PREFIX}/colarys`, colarysRoutes);
console.log('✅ Mounted: /api/colarys');

console.log('📋 All routes mounted successfully');

// Middleware d'erreur
app.use(errorMiddleware);

// Route 404 - DOIT ÊTRE APRÈS toutes les routes
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found", 
    requestedUrl: req.originalUrl,
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected",
    availableRoutes: [
      "/",
      "/api/health",
      "/api/db-test",
      "/api/debug-entities",
      "/api/auth",
      "/api/users",
      "/api/agents",
      "/api/presences",
      "/api/attendance-details",
      "/api/agent-history",
      "/api/roles",
      "/api/plannings",
      "/api/agents-colarys",
      "/api/colarys"
    ]
  });
});

// Gestionnaire d'erreurs global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected"
  });
});
const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    console.log('📊 Environment:', process.env.NODE_ENV);
    console.log('🔗 DB Host:', process.env.POSTGRES_HOST ? '***' : 'MISSING');
    
    // ✅ FORCE LA CONNEXION AU DÉMARRAGE
    const maxRetries = 3;
    let connected = false;
    
    for (let i = 1; i <= maxRetries; i++) {
      console.log(`🔄 Database connection attempt ${i}/${maxRetries}...`);
      connected = await initializeDatabase();
      
      if (connected) {
        break;
      }
      
      if (i < maxRetries) {
        console.log(`⏱️ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (connected) {
      console.log('✅ Database connected successfully');
      
      // Test query immédiat
      try {
        await AppDataSource.query('SELECT version()');
        console.log('✅ Database version query successful');
      } catch (queryError) {
        console.error('❌ Database query failed:', queryError.message);
      }
      
      // Créer l'utilisateur par défaut
      await createDefaultUser();
    } else {
      console.error('❌ Database connection failed after all retries');
      console.log('⚠️ Running in limited mode - some features will not work');
    }
    
    console.log("✅ Server ready and listening for requests");
    console.log("📊 Final database status:", AppDataSource.isInitialized ? "CONNECTED" : "DISCONNECTED");

  } catch (error) {
    console.error("❌ Server startup error:", error);
  }
};

// Démarrage conditionnel
if (require.main === module || process.env.VERCEL) {
  startServer();
}

export default app;