"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
// src/config/data-source.ts - VERSION OPTIMISÉE POUR SUPABASE
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const Agent_1 = require("../entities/Agent");
const HistoAgents_1 = require("../entities/HistoAgents");
const Role_1 = require("../entities/Role");
const Presence_1 = require("../entities/Presence");
const DetailPresence_1 = require("../entities/DetailPresence");
const Trashpresence_1 = require("../entities/Trashpresence");
const AgentColarys_1 = require("../entities/AgentColarys");
dotenv_1.default.config();
console.log('🔧 Database configuration - Environment:', process.env.NODE_ENV);
console.log('🔧 Database host:', process.env.POSTGRES_HOST ? '***' : 'NOT SET');
// ✅ CONFIGURATION SUPABASE OPTIMISÉE
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    // ✅ PRIVILÉGIEZ L'URL COMPLÈTE
    url: process.env.POSTGRES_URL || process.env.SUPABASE_URL,
    // ✅ FALLBACK AVEC VARIABLES INDIVIDUELLES
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE || "postgres",
    entities: [
        User_1.User,
        HistoAgents_1.HistoAgents,
        Agent_1.Agent,
        Role_1.Role,
        Presence_1.Presence,
        DetailPresence_1.DetailPresence,
        Trashpresence_1.Trashpresence,
        AgentColarys_1.AgentColarys
    ],
    // ✅ CONFIGURATION PERFORMANCE POUR VERCEL
    synchronize: false,
    logging: false,
    migrations: [],
    // ✅ CONFIGURATION CONNEXION OPTIMISÉE
    poolSize: 5,
    extra: {
        // ✅ CONFIGURATION SSL POUR SUPABASE
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false,
            ca: process.env.SUPABASE_SSL_CERT // Optionnel si nécessaire
        } : false,
        // ✅ TIMEOUTS OPTIMISÉS
        connectionTimeoutMillis: 15000, // 15 secondes
        idleTimeoutMillis: 30000,
        query_timeout: 10000,
        statement_timeout: 10000,
        // ✅ OPTIONS DE PERFORMANCE
        max: 5,
        min: 0,
        acquireTimeoutMillis: 15000
    }
});
// ✅ FONCTION D'INITIALISATION AVEC RETRY
const initializeDatabase = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (exports.AppDataSource.isInitialized) {
                console.log('✅ Database already connected');
                return true;
            }
            console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
            // Vérification des variables requises
            const requiredVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
            const missingVars = requiredVars.filter(varName => !process.env[varName]);
            if (missingVars.length > 0) {
                console.warn('⚠️ Missing database variables:', missingVars);
                return false;
            }
            await exports.AppDataSource.initialize();
            console.log('✅ Database connected successfully');
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
            // ✅ ATTENTE PROGRESSIVE AVEC BACKOFF
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000; // 2s, 4s, 6s...
                console.log(`⏳ Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    console.error('❌ All database connection attempts failed');
    return false;
};
exports.initializeDatabase = initializeDatabase;
