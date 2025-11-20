// src/app.ts
import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { AppDataSource } from "./config/data-source";

// Routes
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

import { errorMiddleware } from "./middleware/errorMiddleware";

dotenv.config();

// ---------- Vérification des variables d'environnement ----------
const requiredEnvVars = ["JWT_SECRET", "POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD"];
if (!process.env.VERCEL) {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) throw new Error(`❌ ${envVar} must be defined in .env file`);
  });
}

const API_PREFIX = "/api";
const app = express();

// ---------- CORS CONFIGURATION ----------
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Autoriser toutes les origines en développement
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      return callback(null, true);
    }
    
    // En production, vérifier les origines autorisées
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://colarys-frontend.vercel.app",
      "https://grp-colarys-concept.vercel.app",
      /https:\/\/colarys-frontend-.*-colarysconcepts-projects\.vercel\.app/,
      /https:\/\/colarys-frontend-.*\.vercel\.app/,
      /https:\/\/grp-colarys-concept-.*\.vercel\.app/,
    ];

    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS Blocked: ${origin}`);
      callback(new Error(`CORS not allowed for origin: ${origin}`), false);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin", "X-Api-Version"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Appliquer CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---------- Middleware ----------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ---------- Logging ----------
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📱 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin} - ${new Date().toISOString()}`);
  next();
});

// ---------- Multer ----------
let storage: multer.StorageEngine;

if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(__dirname, "../public/uploads/"));
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "agent-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(null, false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ========== ROUTES UNIQUEMENT AVEC PRÉFIXE /api ==========
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

// ---------- Routes spéciales ----------
app.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    service: "Colarys Concept API",
    platform: process.env.VERCEL ? "Vercel" : "Local",
    cors: "Enabled"
  });
});

app.get(`${API_PREFIX}/test-cors`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "CORS test successful!",
    origin: _req.headers.origin,
    timestamp: new Date().toISOString(),
    cors: "Enabled and working"
  });
});

app.get(`${API_PREFIX}/`, (_req: Request, res: Response) => {
  res.json({
    message: "Colarys Backend API",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      `${API_PREFIX}/auth/login`,
      `${API_PREFIX}/health`,
      `${API_PREFIX}/test-cors`,
      `${API_PREFIX}/agents-colarys`
    ]
  });
});

// ---------- Redirection pour la racine ----------
app.get("/", (_req: Request, res: Response) => {
  res.redirect(`${API_PREFIX}/`);
});

// ---------- Middleware d'erreur ----------
app.use(errorMiddleware);

// ---------- Route 404 ----------
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      `${API_PREFIX}/health`,
      `${API_PREFIX}/test-cors`,
      `${API_PREFIX}/auth/login`, 
      `${API_PREFIX}/agents-colarys`,
    ],
  });
});

// ---------- Gestionnaire global d'erreurs ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Global Error:", err);
  
  if (err && (err.message.includes("CORS") || err.name === 'CorsError')) {
    return res.status(403).json({ 
      success: false, 
      error: "CORS Error", 
      message: err.message,
      currentOrigin: _req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err?.message || String(err),
  });
});

// ---------- Initialisation ----------
export const initializeApp = async (): Promise<express.Application> => {
  try {
    if (!process.env.VERCEL) {
      await AppDataSource.initialize();
      console.log("📦 Connected to database");
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } else {
      console.log("🚨 Running in Vercel serverless mode");
    }
    return app;
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    return app;
  }
};

// ---------- Démarrage local ----------
if (!process.env.VERCEL) {
  initializeApp().catch((err) => {
    console.error("❌ Failed to initialize app:", err);
    process.exit(1);
  });
}

// ---------- Export ----------
export default app;