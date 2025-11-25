import "reflect-metadata";
import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";

// Routes imports
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
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 Platform:', process.env.VERCEL ? 'Vercel' : 'Local');

const API_PREFIX = "/api";
const app = express();

app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));


// ✅ CORS Configuration optimisée pour Vercel
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://theme-gestion-des-resources-et-prod.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Middleware de logging simplifié pour Vercel
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production' || req.method !== 'OPTIONS') {
    console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  }
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
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    status: "operational"
  });
});

// Route de santé optimisée
app.get(`${API_PREFIX}/health`, async (_req, res) => {
  try {
    const dbStatus = AppDataSource.isInitialized ? "connected" : "disconnected";
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: "Colarys Concept API",
      version: "2.0.0",
      database: dbStatus,
      platform: process.env.VERCEL ? 'Vercel' : 'Local'
    });
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      database: "connection_failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Mount toutes les routes
console.log('📋 Mounting API routes...');

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/agents`, agentRoutes);
app.use(`${API_PREFIX}/presences`, presenceRoutes);
app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/plannings`, planningRoutes);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes);
app.use(`${API_PREFIX}/colarys`, colarysRoutes);

console.log('✅ All routes mounted successfully');

// Middleware d'erreur
app.use(errorMiddleware);

// ✅ Route 404 améliorée
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found", 
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      "/api/health",
      "/api/auth/login",
      "/api/agents-colarys",
      "/api/presences",
      "/api/plannings"
    ],
    timestamp: new Date().toISOString()
  });
});

// ✅ Gestionnaire d'erreurs global optimisé
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err);
  
  // Masquer les détails d'erreur en production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: errorMessage,
    timestamp: new Date().toISOString()
  });
});

// ✅ Export pour Vercel (NE PAS démarrer le serveur)
export default app;

// ✅ Démarrage conditionnel uniquement en local
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await AppDataSource.initialize();
      console.log("📦 Connected to database");

      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔗 Agents API: http://localhost:${PORT}/api/agents-colarys`);
      });
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  };

  startServer();
} else {
  console.log('✅ Vercel environment - App exported as serverless function');
}
