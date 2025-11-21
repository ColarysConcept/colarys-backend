"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express")); // ← Ajouter les types
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const data_source_1 = require("./config/data-source");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const presenceRoutes_1 = __importDefault(require("./routes/presenceRoutes"));
const detailPresenceRoutes_1 = __importDefault(require("./routes/detailPresenceRoutes"));
const histoAgentsRoutes_1 = __importDefault(require("./routes/histoAgentsRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const planningRoutes_1 = __importDefault(require("./routes/planningRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const agentColarysRoutes_1 = __importDefault(require("./routes/agentColarysRoutes"));
const colarysRoutes_1 = __importDefault(require("./routes/colarysRoutes"));
dotenv_1.default.config();
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
const app = (0, express_1.default)();
// Configuration CORS pour Vercel
app.use((0, cors_1.default)({
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
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: 'Trop de requêtes, veuillez réessayer plus tard.'
    }
});
app.use(apiLimiter);
// Middleware de logging avec types
app.use((req, _res, next) => {
    console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});
// Routes principales
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
app.use(`${API_PREFIX}/users`, userRoutes_1.default);
app.use(`${API_PREFIX}/agents`, agentRoutes_1.default);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes_1.default);
app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes_1.default);
app.use(`${API_PREFIX}/roles`, roleRoutes_1.default);
app.use(`${API_PREFIX}/plannings`, planningRoutes_1.default);
app.use(`${API_PREFIX}/presences`, presenceRoutes_1.default);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes_1.default);
app.use(`${API_PREFIX}/colarys`, colarysRoutes_1.default);
// Ajoutez cette route AVANT les autres routes
app.get('/', (_req, res) => {
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
app.get(`${API_PREFIX}/health`, (_req, res) => {
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
app.get(`${API_PREFIX}/test`, (_req, res) => {
    res.json({
        success: true,
        message: "API test successful!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
    });
});
// Middleware d'erreur
app.use(errorMiddleware_1.errorMiddleware);
// Route 404
app.use((req, res) => {
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
app.use((err, _req, res, _next) => {
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
            await data_source_1.AppDataSource.initialize();
            console.log("📦 Connected to database");
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
                console.log(`🔗 Health: http://localhost:${PORT}${API_PREFIX}/health`);
            });
        }
        catch (error) {
            console.error("❌ Database connection failed:", error);
            process.exit(1);
        }
    };
    startServer();
}
// ========== EXPORT POUR VERCEL ==========
exports.default = app;
