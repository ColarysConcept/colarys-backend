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

const requiredEnvVars = [
  'JWT_SECRET',
  'POSTGRES_HOST', 
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`❌ ${envVar} must be defined in .env file`);
  }
});

const PORT = process.env.PORT || 3000;
const API_PREFIX = "/api";
const app = express();

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Configuration Multer CORRIGÉE
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

// SOLUTION 1: Utiliser le type correct pour le callback
const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // CORRECTION: Passer l'erreur comme premier paramètre seulement
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

// SOLUTION 2: Exporter upload pour l'utiliser dans les routes
export { upload };

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

// Middleware d'erreur
app.use(errorMiddleware);

// Route de santé
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "Colarys Concept API - Local Development",
    version: "2.0.0"
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found", 
    requestedUrl: req.url 
  });
});

// Gestionnaire d'erreurs global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Error:", err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("📦 Connected to database");
    console.log("✅ All services initialized");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}${API_PREFIX}/health`);
      console.log(`🔗 Agents Colarys: http://localhost:${PORT}${API_PREFIX}/agents-colarys`);
      console.log(`🌐 CORS enabled for: http://localhost:5173`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();