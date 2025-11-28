"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = require("./config/data-source");
const User_1 = require("./entities/User");
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
const debugRoutes_1 = __importDefault(require("./routes/debugRoutes"));
console.log('🚀 Starting Colarys API Server...');
dotenv_1.default.config();
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
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:8080',
            'https://colarys-frontend.vercel.app',
            'https://*.vercel.app'
        ];
        if (origin && origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, _res, next) => {
    console.log(`📱 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});
const resetUserPassword = async () => {
    try {
        console.log('🔄 Réinitialisation du mot de passe utilisateur...');
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const existingUser = await userRepository.findOne({
            where: { email: 'ressource.prod@gmail.com' }
        });
        if (existingUser) {
            const hashedPassword = await bcryptjs_1.default.hash('stage25', 10);
            existingUser.password = hashedPassword;
            await userRepository.save(existingUser);
            console.log('✅ Mot de passe réinitialisé avec "stage25" pour:', existingUser.email);
        }
        else {
            console.log('❌ Utilisateur non trouvé pour réinitialisation');
        }
    }
    catch (error) {
        console.log('⚠️ Erreur réinitialisation mot de passe:', error.message);
    }
};
const createDefaultUser = async () => {
    try {
        console.log('🔄 Vérification/création utilisateur par défaut...');
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const existingUser = await userRepository.findOne({
            where: { email: 'ressource.prod@gmail.com' }
        });
        if (!existingUser) {
            const hashedPassword = await bcryptjs_1.default.hash('stage25', 10);
            const defaultUser = userRepository.create({
                name: 'Admin Ressources',
                email: 'ressource.prod@gmail.com',
                password: hashedPassword,
                role: 'admin'
            });
            await userRepository.save(defaultUser);
            console.log('✅ Utilisateur par défaut créé en base de données');
        }
        else {
            console.log('✅ Utilisateur existe déjà en base');
            await resetUserPassword();
        }
    }
    catch (error) {
        console.log('⚠️ Note: Utilisateur non créé (DB peut être en cours de setup):', error.message);
    }
};
app.get('/', (_req, res) => {
    res.json({
        message: "🚀 Colarys Concept API Server is running!",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        database: data_source_1.AppDataSource.isInitialized ? "Connected" : "Disconnected"
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
app.get(`${API_PREFIX}/db-test`, async (_req, res) => {
    try {
        console.log('🔧 Testing database connection...');
        const dbStatus = {
            initialized: data_source_1.AppDataSource.isInitialized,
            environment: process.env.NODE_ENV,
            host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
            database: process.env.POSTGRES_DB ? '***' : 'MISSING',
            user: process.env.POSTGRES_USER ? '***' : 'MISSING',
            port: process.env.POSTGRES_PORT
        };
        let connectionTest = "Not attempted";
        let entities = [];
        if (!data_source_1.AppDataSource.isInitialized) {
            console.log('🔄 Attempting to initialize database...');
            const connected = await (0, data_source_1.initializeDatabase)();
            if (connected) {
                connectionTest = "SUCCESS - Connected via test";
                entities = data_source_1.AppDataSource.entityMetadatas.map(e => e.name);
                try {
                    await data_source_1.AppDataSource.query('SELECT 1 as test');
                    connectionTest += " (Query OK)";
                }
                catch (queryError) {
                    connectionTest += ` (Query failed: ${queryError.message})`;
                }
            }
            else {
                connectionTest = "FAILED - Could not initialize";
            }
        }
        else {
            try {
                await data_source_1.AppDataSource.query('SELECT 1');
                connectionTest = "SUCCESS - Already connected (Query OK)";
                entities = data_source_1.AppDataSource.entityMetadatas.map(e => e.name);
            }
            catch (error) {
                connectionTest = `FAILED - Query error: ${error.message}`;
            }
        }
        res.json({
            success: true,
            database: {
                status: dbStatus,
                connectionTest: connectionTest,
                entities: entities,
                isInitialized: data_source_1.AppDataSource.isInitialized
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                vercel: !!process.env.VERCEL
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "DB test failed",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
app.get(`${API_PREFIX}/debug-entities`, async (_req, res) => {
    try {
        console.log('🔧 Debug entities endpoint called');
        const dbStatus = {
            initialized: data_source_1.AppDataSource.isInitialized,
            entityCount: data_source_1.AppDataSource.entityMetadatas.length,
            entities: data_source_1.AppDataSource.entityMetadatas.map(meta => ({
                name: meta.name,
                tableName: meta.tableName,
                columns: meta.columns.map(col => col.propertyName)
            }))
        };
        const agentColarysInfo = data_source_1.AppDataSource.entityMetadatas.find(meta => meta.name === 'AgentColarys' || meta.tableName === 'agents_colarys');
        res.json({
            success: true,
            debug: {
                timestamp: new Date().toISOString(),
                database: dbStatus,
                agentColarys: agentColarysInfo ? {
                    found: true,
                    name: agentColarysInfo.name,
                    tableName: agentColarysInfo.tableName,
                    columnCount: agentColarysInfo.columns.length
                } : {
                    found: false,
                    message: "AgentColarys entity not found in TypeORM metadata"
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV,
                    vercel: !!process.env.VERCEL
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Debug entities error:', error);
        res.status(500).json({
            success: false,
            error: "Debug failed",
            message: error.message
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
app.use(`${API_PREFIX}/debug`, debugRoutes_1.default);
console.log('✅ Mounted: /api/debug');
console.log('📋 All routes mounted successfully');
app.use(errorMiddleware_1.errorMiddleware);
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        requestedUrl: req.originalUrl,
        database: data_source_1.AppDataSource.isInitialized ? "Connected" : "Disconnected",
        availableRoutes: [
            "/",
            "/api/health",
            "/api/db-test",
            "/api/debug-entities",
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
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        database: data_source_1.AppDataSource.isInitialized ? "Connected" : "Disconnected"
    });
});
const startServer = async () => {
    try {
        console.log('🚀 Starting server initialization...');
        try {
            console.log('🔄 Database initialization started...');
            const connected = await (0, data_source_1.initializeDatabase)();
            if (connected) {
                console.log('✅ Database connected successfully');
                try {
                    await createDefaultUser();
                }
                catch (userError) {
                    console.warn('⚠️ Default user creation failed:', userError.message);
                }
            }
            else {
                console.warn('⚠️ Database connection failed, running in limited mode');
            }
        }
        catch (dbError) {
            console.error('❌ Database initialization error:', dbError.message);
            console.warn('⚠️ Continuing without database connection');
        }
        console.log("✅ Server ready and listening for requests");
        console.log("📊 Database status:", data_source_1.AppDataSource.isInitialized ? "CONNECTED" : "DISCONNECTED");
    }
    catch (error) {
        console.error("❌ Server startup error:", error);
    }
};
if (require.main === module || process.env.VERCEL) {
    startServer();
}
exports.default = app;
