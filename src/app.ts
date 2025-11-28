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
import debugRoutes from './routes/debugRoutes';

console.log('🚀 Starting Colarys API Server...');

dotenv.config();

// Vérification des variables d'environnement
console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');

const requiredEnvVars = [
  'JWT_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ ${envVar} is not defined`);
  }
});

const API_PREFIX = "/api";
const app = express();

// 🔥 CORRECTION : Configuration CORS COMPLÈTE ET PERMISSIVE
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000', 
  'http://localhost:8080',
  'https://colarys-frontend.vercel.app'
];

app.use(cors({
  origin: true, // ✅ Autorise TOUTES les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['*'], // ✅ Autorise TOUS les headers
  exposedHeaders: ['*'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
  // Headers CORS pour TOUTES les réponses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Répondre immédiatement aux requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('🛠️  CORS Preflight handled for:', req.headers.origin);
    return res.status(200).end();
  }
  
  next();
});


// 🔥 CORRECTION : Gestion OPTIONS pour CORS preflight
app.options('*', (req, res) => {
  console.log('🛠️  CORS Preflight request:', req.method, req.headers.origin);
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging amélioré
app.use((req, res, next) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin} - ${new Date().toISOString()}`);
  
  // 🔥 CORRECTION : Headers CORS dans toutes les réponses
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
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

// 🔥 AJOUTEZ CES ROUTES DE TEST AVANT LES AUTRES ROUTES :

// Route de test CORS URGENCE
app.get('/api/cors-test', (req, res) => {
  console.log('🧪 CORS Test Route called from:', req.headers.origin);
  res.json({
    success: true,
    message: '✅ CORS TEST SUCCESSFUL',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    cors: 'ENABLED'
  });
});

// Route de santé URGENCE
app.get('/api/health-urgent', (req, res) => {
  console.log('🚑 URGENT Health check from:', req.headers.origin);
  res.json({
    success: true,
    status: 'OK',
    message: '🚑 URGENT HEALTH CHECK - CORS FIXED',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected",
    cors: "Enabled",
    supabase: process.env.SUPABASE_URL ? "Configured" : "Not Configured"
  });
});

// 🔥 CORRECTION : Route de santé SIMPLIFIÉE et ROBUSTE
app.get(`${API_PREFIX}/health`, async (_req, res) => {
  try {
    console.log('🔍 Health check requested');
    
    const dbStatus = AppDataSource.isInitialized ? "Connected" : "Disconnected";
    
    res.json({
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: "Colarys Concept API",
      version: "2.0.0",
      database: dbStatus,
      cors: "Enabled",
      supabase: process.env.SUPABASE_URL ? "Configured" : "Not Configured"
    });
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    res.json({
      success: false,
      status: "ERROR",
      database: "Connection issues",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🔥 CORRECTION : Route de santé spécifique Colarys
app.get(`${API_PREFIX}/colarys/health`, async (_req, res) => {
  try {
    console.log('🔍 Colarys Health check requested');
    
    // Test simple sans dépendances complexes
    res.json({
      success: true,
      message: "✅ Colarys API is operational",
      timestamp: new Date().toISOString(),
      service: "Colarys Employee Service",
      environment: process.env.NODE_ENV || 'development',
      version: "2.0.0"
    });
  } catch (error: any) {
    console.error('❌ Colarys Health check error:', error);
    res.status(500).json({
      success: false,
      message: "Service unavailable",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
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
    console.error('❌ DB test error:', error);
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

// 🔥 CORRECTION : Ordre important - les routes spécifiques d'abord
app.use(`${API_PREFIX}/colarys`, colarysRoutes);
console.log('✅ Mounted: /api/colarys');

app.use(`${API_PREFIX}/debug`, debugRoutes);
console.log('✅ Mounted: /api/debug');

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

console.log('📋 All routes mounted successfully');

// Middleware d'erreur
app.use(errorMiddleware);

// 🔥 CORRECTION : Route 404 avec headers CORS
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.originalUrl} from ${req.headers.origin}`);
  
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found", 
    requestedUrl: req.originalUrl,
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected",
    availableRoutes: [
      "/",
      "/api/health",
      "/api/colarys/health",
      "/api/db-test",
      "/api/debug-entities",
      "/api/colarys/employees",
      "/api/colarys/presences",
      "/api/colarys/salaires",
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

// 🔥 CORRECTION : Gestionnaire d'erreurs global avec CORS
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err);
  console.error("📱 Request URL:", req.originalUrl);
  console.error("🌐 Origin:", req.headers.origin);
  
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    database: AppDataSource.isInitialized ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// ========== DÉMARRAGE CONDITIONNEL ==========

const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    console.log('🌐 CORS configured for origins:', allowedOrigins);
    
    // ✅ INITIALISATION DB AVEC GESTION D'ERREUR ROBUSTE
    try {
      console.log('🔄 Database initialization started...');
      const connected = await initializeDatabase();
      
      if (connected) {
        console.log('✅ Database connected successfully');
        
        // Créer l'utilisateur par défaut
        try {
          await createDefaultUser();
        } catch (userError) {
          console.warn('⚠️ Default user creation failed:', userError.message);
        }
      } else {
        console.warn('⚠️ Database connection failed, running in limited mode');
      }
    } catch (dbError) {
      console.error('❌ Database initialization error:', dbError.message);
      console.warn('⚠️ Continuing without database connection');
    }
    
    console.log("✅ Server ready and listening for requests");
    console.log("📊 Database status:", AppDataSource.isInitialized ? "CONNECTED" : "DISCONNECTED");
    console.log("🌐 CORS Enabled for:", allowedOrigins.join(', '));

  } catch (error) {
    console.error("❌ Server startup error:", error);
  }
};

// Démarrage conditionnel
if (require.main === module || process.env.VERCEL) {
  startServer();
}

export default app;