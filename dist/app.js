"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const presenceRoutes_1 = __importDefault(require("./routes/presenceRoutes"));
const detailPresenceRoutes_1 = __importDefault(require("./routes/detailPresenceRoutes"));
const histoAgentsRoutes_1 = __importDefault(require("./routes/histoAgentsRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const planningRoutes_1 = __importDefault(require("./routes/planningRoutes"));
const agentColarysRoutes_1 = __importDefault(require("./routes/agentColarysRoutes"));
const colarysRoutes_1 = __importDefault(require("./routes/colarysRoutes"));
dotenv_1.default.config();
const API_PREFIX = "/api";
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://colarys-frontend.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
    console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});
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
app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        service: "Colarys Concept API",
        version: "2.0.0"
    });
});
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
app.use(`${API_PREFIX}/users`, userRoutes_1.default);
app.use(`${API_PREFIX}/agents`, agentRoutes_1.default);
app.use(`${API_PREFIX}/presences`, presenceRoutes_1.default);
app.use(`${API_PREFIX}/detail-presences`, detailPresenceRoutes_1.default);
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes_1.default);
app.use(`${API_PREFIX}/roles`, roleRoutes_1.default);
app.use(`${API_PREFIX}/planning`, planningRoutes_1.default);
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes_1.default);
app.use(`${API_PREFIX}/colarys`, colarysRoutes_1.default);
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
app.use((err, _req, res, _next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
exports.default = app;
