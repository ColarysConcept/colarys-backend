"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./config/data-source");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const presenceRoutes_1 = __importDefault(require("./routes/presenceRoutes"));
const histoAgentsRoutes_1 = __importDefault(require("./routes/histoAgentsRoutes"));
const agentColarysRoutes_1 = __importDefault(require("./routes/agentColarysRoutes"));
const colarysRoutes_1 = __importDefault(require("./routes/colarysRoutes"));
dotenv_1.default.config();
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
const app = (0, express_1.default)();
// Configuration CORS
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://colarys-frontend.vercel.app' // ✅ Ajoutez votre futur frontend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
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
        database: data_source_1.AppDataSource.isInitialized ? "Connected" : "Connecting"
    });
});
// Mount routes avec logging
console.log('📋 Mounting API routes...');
try {
    app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
    console.log('✅ Mounted: /api/auth');
    app.use(`${API_PREFIX}/users`, userRoutes_1.default);
    console.log('✅ Mounted: /api/users');
    app.use(`${API_PREFIX}/agents`, agentRoutes_1.default);
    console.log('✅ Mounted: /api/agents');
    app.use(`${API_PREFIX}/presences`, presenceRoutes_1.default);
    console.log('✅ Mounted: /api/presences');
    // Routes optionnelles - avec try/catch
    try {
        app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes_1.default);
        console.log('✅ Mounted: /api/agent-history');
    }
    catch (e) {
        console.warn('⚠️ Could not mount /api/agent-history');
    }
    try {
        app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes_1.default);
        console.log('✅ Mounted: /api/agents-colarys');
    }
    catch (e) {
        console.warn('⚠️ Could not mount /api/agents-colarys');
    }
    try {
        app.use(`${API_PREFIX}/colarys`, colarysRoutes_1.default);
        console.log('✅ Mounted: /api/colarys');
    }
    catch (e) {
        console.warn('⚠️ Could not mount /api/colarys');
    }
}
catch (error) {
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
app.use((err, _req, res, _next) => {
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
        await data_source_1.AppDataSource.initialize();
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
        }
        else {
            console.log('✅ Vercel environment - Serverless function ready');
        }
    }
    catch (error) {
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
}
else {
    console.log('🚀 Vercel Serverless - App exported without starting server');
}
exports.default = app;
