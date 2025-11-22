import "reflect-metadata";
import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import multer from 'multer';
import { AppDataSource } from "./config/data-source";
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

dotenv.config();

console.log('🚀 Starting Colarys API Server...');

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
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://colarys-frontend.vercel.app' // ✅ Ajoutez votre futur frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

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
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "Colarys Concept API",
    version: "2.0.0",
    database: AppDataSource.isInitialized ? "Connected" : "Connecting"
  });
});

// Mount routes avec logging
console.log('📋 Mounting API routes...');

try {
  app.use(`${API_PREFIX}/auth`, authRoutes);
  console.log('✅ Mounted: /api/auth');
  
  app.use(`${API_PREFIX}/users`, userRoutes);
  console.log('✅ Mounted: /api/users');
  
  app.use(`${API_PREFIX}/agents`, agentRoutes);
  console.log('✅ Mounted: /api/agents');
  
  app.use(`${API_PREFIX}/presences`, presenceRoutes);
  console.log('✅ Mounted: /api/presences');
  
  // Routes optionnelles - avec try/catch
  try {
    app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes);
    console.log('✅ Mounted: /api/agent-history');
  } catch (e) {
    console.warn('⚠️ Could not mount /api/agent-history');
  }
  
  try {
    app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes);
    console.log('✅ Mounted: /api/agents-colarys');
  } catch (e) {
    console.warn('⚠️ Could not mount /api/agents-colarys');
  }
  
  try {
    app.use(`${API_PREFIX}/colarys`, colarysRoutes);
    console.log('✅ Mounted: /api/colarys');
  } catch (e) {
    console.warn('⚠️ Could not mount /api/colarys');
  }
  
} catch (error) {
  console.error('❌ Error mounting routes:', error);
}

console.log('📋 Finished mounting routes');

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
      "/api/auth/login",
      "/api/users",
      "/api/agents"
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
// ✅ IMPORTANT: Ne démarre le serveur QUE en local, pas sur Vercel

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("📦 Connected to database");

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
      });
    } else {
      console.log('✅ Vercel environment - Serverless function ready');
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    // ✅ Ne pas quitter le processus sur Vercel
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// ✅ Démarrage conditionnel
if (!process.env.VERCEL) {
  startServer();
} else {
  console.log('🚀 Vercel Serverless - App exported without starting server');
}

export default app;