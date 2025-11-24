"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
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
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
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
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://colarys-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
    console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../public/uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path_1.default.extname(file.originalname);
        cb(null, 'agent-' + uniqueSuffix + fileExtension);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Seules les images sont autorisées!'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});
exports.upload = upload;
app.get('/', (_req, res) => {
    res.json({
        message: "🚀 Colarys Concept API Server is running!",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        platform: process.env.VERCEL ? 'Vercel' : 'Local'
    });
});
app.get(`${API_PREFIX}/health`, async (_req, res) => {
    try {
        const dbStatus = data_source_1.AppDataSource.isInitialized ? "Connected" : "Disconnected";
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            service: "Colarys Concept API",
            version: "2.0.0",
            database: dbStatus
        });
    }
    catch (error) {
        res.json({
            status: "WARNING",
            database: "Connection issues",
            error: error.message
        });
    }
});
console.log('📋 Mounting API routes...');
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
console.log('✅ Mounted: /api/auth');
app.use(`${API_PREFIX}/users`, userRoutes_1.default);
console.log('✅ Mounted: /api/users');
app.use(`${API_PREFIX}/agents`, agentRoutes_1.default);
console.log('✅ Mounted: /api/agents');
app.use(`${API_PREFIX}/presences`, presenceRoutes_1.default);
console.log('✅ Mounted: /api/presences');
app.use(`${API_PREFIX}/attendance-details`, detailPresenceRoutes_1.default);
console.log('✅ Mounted: /api/attendance-details');
app.use(`${API_PREFIX}/agent-history`, histoAgentsRoutes_1.default);
console.log('✅ Mounted: /api/agent-history');
app.use(`${API_PREFIX}/roles`, roleRoutes_1.default);
console.log('✅ Mounted: /api/roles');
app.use(`${API_PREFIX}/plannings`, planningRoutes_1.default);
console.log('✅ Mounted: /api/plannings');
app.use(`${API_PREFIX}/agents-colarys`, agentColarysRoutes_1.default);
console.log('✅ Mounted: /api/agents-colarys');
app.use(`${API_PREFIX}/colarys`, colarysRoutes_1.default);
console.log('✅ Mounted: /api/colarys');
app.use(`${API_PREFIX}/admin`, adminRoutes_1.default);
console.log('✅ Mounted: /api/admin');
console.log('📋 All routes mounted successfully');
app.use(errorMiddleware_1.errorMiddleware);
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
app.use((err, _req, res, _next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
const startServer = async () => {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log("📦 Connected to database");
        console.log("✅ All services initialized");
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
        }
        else {
            console.log('✅ Vercel environment - Serverless function ready');
        }
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};
if (!process.env.VERCEL) {
    startServer();
}
else {
    console.log('🚀 Vercel Serverless - App exported without starting server');
}
exports.default = app;
