import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { AppDataSource ,initializeDatabase} from "./config/data-source";
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

// ========== ROUTES ==========

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel' : 'Local'
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

// Mount toutes les routes
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
    availableRoutes: [
      "/",
      "/api/health",
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
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========== DÉMARRAGE CONDITIONNEL ==========


const startServer = async () => {
  try {
    console.log('🚀 Starting Colarys API Server...');
    
    // ✅ INITIALISATION DE LA BASE DE DONNÉES AVEC GESTION D'ERREUR AMÉLIORÉE
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      console.error('❌ CRITICAL: Database connection failed');
      
      // En production, on continue sans base de données mais on log l'erreur
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Continuing without database in production mode');
      } else {
        // En développement, on arrête
        throw new Error('Database connection failed');
      }
    } else {
      console.log("📦 Database connected successfully");
      
      // ✅ CRÉATION OU RÉINITIALISATION UTILISATEUR (seulement si BD connectée)
      try {
        await createDefaultUser();
        console.log("✅ Default user check completed");
      } catch (userError) {
        console.warn('⚠️ Default user setup failed:', userError);
      }
    }

    console.log("✅ All services initialized");

    // ✅ Seulement en local
    if (!process.env.VERCEL) {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔗 Test these URLs:`);
        console.log(`   http://localhost:${PORT}/`);
        console.log(`   http://localhost:${PORT}/api/health`);
        console.log(`   http://localhost:${PORT}/api/users`);
        console.log(`   http://localhost:${PORT}/api/agents`);
        console.log(`   http://localhost:${PORT}/api/agents-colarys`);
        console.log(`🌐 CORS enabled for: http://localhost:5173`);
        console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } else {
      console.log('✅ Vercel environment - Serverless function ready');
    }
  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    
    if (error instanceof Error) {
      console.error("❌ Error details:", error.message);
    }
    
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};
// ✅ SUR VERCEL, INITIALISER TOUJOURS
if (process.env.VERCEL) {
  console.log('🚀 Vercel environment - Initializing server...');
  startServer().catch(error => {
    console.error('❌ Failed to initialize on Vercel:', error);
  });
} else {
  startServer();
}
export default app;