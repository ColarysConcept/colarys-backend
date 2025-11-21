import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express"; // ← Ajouter les types
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from 'express-rate-limit';
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

// Variables d'environnement requises
const requiredEnvVars = [
  'JWT_SECRET',
  'POSTGRES_HOST',
  'POSTGRES_USER', 
  'POSTGRES_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_KEY'
];

if (!process.env.VERCEL) {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`❌ ${envVar} must be defined in .env file`);
    }
  });
}

const API_PREFIX = "/api";
const app = express();

// Configuration CORS pour Vercel
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://colarys-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
});

app.use(apiLimiter);

// Middleware de logging avec types
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Routes principales
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/agents`, agentRoutes);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes);
app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/plannings`, planningRoutes);
app.use(`${API_PREFIX}/presences`, presenceRoutes);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes);
app.use(`${API_PREFIX}/colarys`, colarysRoutes);

// Ajoutez cette route AVANT les autres routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: "🚀 Colarys Concept API Server is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: "/api/health",
      test: "/api/test",
      docs: "Coming soon...",
      baseUrl: "/api"
    }
  });
});

// Route de santé
app.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "Colarys Concept API",
    version: "2.0.0",
    platform: process.env.VERCEL ? "Vercel" : "Local",
    database: process.env.POSTGRES_HOST ? "Connected" : "Not configured"
  });
});

// Route de test
app.get(`${API_PREFIX}/test`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API test successful!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Middleware d'erreur
app.use(errorMiddleware);

// Route 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found", 
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      `${API_PREFIX}/health`,
      `${API_PREFIX}/test`,
      `${API_PREFIX}/auth/login`
    ]
  });
});

// Gestionnaire d'erreurs global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Error:", err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========== DÉMARRAGE LOCAL SEULEMENT ==========
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await AppDataSource.initialize();
      console.log("📦 Connected to database");
      
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔗 Health: http://localhost:${PORT}${API_PREFIX}/health`);
      });
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  };
  
  startServer();
}

// ========== EXPORT POUR VERCEL ==========
export default app;