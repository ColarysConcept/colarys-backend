// src/app.ts - APPLICATION EXPRESS (EXPORT SEULEMENT)
import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import des routes
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import agentRoutes from "./routes/agentRoutes";
import presenceRoutes from "./routes/presenceRoutes";
import detailPresenceRoutes from "./routes/detailPresenceRoutes";
import histoAgentsRoutes from "./routes/histoAgentsRoutes";
import roleRoutes from "./routes/roleRoutes";
import planningRoutes from "./routes/planningRoutes";
import agentColarysRoutes from "./routes/agentColarysRoutes";
import colarysRoutes from "./routes/colarysRoutes";

dotenv.config();

const API_PREFIX = "/api";
const app = express();

// ✅ MIDDLEWARES
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://colarys-frontend.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ MIDDLEWARE LOGGING
app.use((req, res, next) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// ========== ROUTES ==========

// ✅ ROUTE RACINE
app.get('/', (_req, res) => {
  res.json({
    message: "🚀 Colarys Concept API Server is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/users',
      '/api/agents',
      '/api/presences'
    ]
  });
});

// ✅ ROUTE HEALTH
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "Colarys Concept API",
    version: "2.0.0"
  });
});

// ✅ MOUNT DES ROUTES API
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/agents`, agentRoutes);
app.use(`${API_PREFIX}/presences`, presenceRoutes);
app.use(`${API_PREFIX}/detail-presences`, detailPresenceRoutes);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/planning`, planningRoutes);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes);
app.use(`${API_PREFIX}/colarys`, colarysRoutes);

// ✅ ROUTE 404
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
      "/api/agents",
      "/api/presences"
    ]
  });
});

// ✅ GESTIONNAIRE D'ERREURS GLOBAL
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ EXPORT DE L'APPLICATION (SANS DÉMARRAGE SERVEUR)
export default app;