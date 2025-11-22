"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = exports.AppDataSource = void 0;
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
console.log('🔧 Database port:', process.env.POSTGRES_PORT);
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "6543"),
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
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    migrations: [],
    subscribers: [],
    poolSize: 5,
    maxQueryExecutionTime: 10000,
    ssl: true,
    extra: {
        ssl: {
            rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        query_timeout: 10000,
        statement_timeout: 10000,
        max: 5,
        min: 0,
    },
});
const initializeDatabase = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (exports.AppDataSource.isInitialized) {
                console.log('✅ Database already connected');
                return true;
            }
            console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
            console.log(`📍 Connecting to: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
            const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            if (missingVars.length > 0) {
                console.error('❌ Missing required environment variables:', missingVars);
                return false;
            }
            await exports.AppDataSource.initialize();
            console.log('✅ Database connected successfully');
            const result = await exports.AppDataSource.query('SELECT version() as version, NOW() as time');
            console.log('✅ Database connection verified:', result[0].version.split(',')[0]);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
            if (errorMessage.includes('SSL')) {
                console.error('🔒 SSL Error - Vérifiez la configuration SSL');
            }
            if (errorMessage.includes('password')) {
                console.error('🔑 Authentication Error - Vérifiez le mot de passe');
            }
            if (errorMessage.includes('timeout')) {
                console.error('⏱️ Timeout Error - Vérifiez le host et le port');
            }
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000;
                console.log(`⏳ Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    console.error('❌ All database connection attempts failed');
    return false;
};
exports.initializeDatabase = initializeDatabase;
const closeDatabase = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            console.log('✅ Database connection closed');
        }
    }
    catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
};
exports.closeDatabase = closeDatabase;
