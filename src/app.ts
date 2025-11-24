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
    'https://colarys-frontend.vercel.app'
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

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'agent-' + uniqueSuffix + fileExtension);
  }
});

const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

export { upload };

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
  } catch (error) {
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
// ✅ IMPORTANT: Ne démarre le serveur QUE en local, pas sur Vercel

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("📦 Connected to database");
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