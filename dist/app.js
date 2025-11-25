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
const detailPresenceRoutes_1 = __importDefault(require("./routes/detailPresenceRoutes"));
const histoAgentsRoutes_1 = __importDefault(require("./routes/histoAgentsRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const planningRoutes_1 = __importDefault(require("./routes/planningRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const agentColarysRoutes_1 = __importDefault(require("./routes/agentColarysRoutes"));
const colarysRoutes_1 = __importDefault(require("./routes/colarysRoutes"));
dotenv_1.default.config();
console.log('🚀 Starting Colarys API Server...');
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 Platform:', process.env.VERCEL ? 'Vercel' : 'Local');
const API_PREFIX = "/api";
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
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
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, _res, next) => {
    if (process.env.NODE_ENV !== 'production' || req.method !== 'OPTIONS') {
        console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    }
    next();
});
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
app.get(`${API_PREFIX}/health`, async (_req, res) => {
    try {
        const dbStatus = data_source_1.AppDataSource.isInitialized ? "connected" : "disconnected";
        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            service: "Colarys Concept API",
            version: "2.0.0",
            database: dbStatus,
            platform: process.env.VERCEL ? 'Vercel' : 'Local'
        });
    }
    catch (error) {
        res.status(500).json({
            status: "unhealthy",
            database: "connection_failed",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
console.log('📋 Mounting API routes...');
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
app.use(`${API_PREFIX}/users`, userRoutes_1.default);
app.use(`${API_PREFIX}/agents`, agentRoutes_1.default);
app.use(`${API_PREFIX}/presences`, presenceRoutes_1.default);
app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes_1.default);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes_1.default);
app.use(`${API_PREFIX}/roles`, roleRoutes_1.default);
app.use(`${API_PREFIX}/plannings`, planningRoutes_1.default);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes_1.default);
app.use(`${API_PREFIX}/colarys`, colarysRoutes_1.default);
console.log('✅ All routes mounted successfully');
app.use(errorMiddleware_1.errorMiddleware);
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
app.use((err, _req, res, _next) => {
    console.error("❌ Server Error:", err);
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
exports.default = app;
if (!process.env.VERCEL) {
    const startServer = async () => {
        try {
            await data_source_1.AppDataSource.initialize();
            console.log("📦 Connected to database");
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
                console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
                console.log(`🔗 Agents API: http://localhost:${PORT}/api/agents-colarys`);
            });
        }
        catch (error) {
            console.error("❌ Database connection failed:", error);
            process.exit(1);
        }
    };
    startServer();
}
else {
    console.log('✅ Vercel environment - App exported as serverless function');
}
