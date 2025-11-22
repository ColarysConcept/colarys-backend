"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
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
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.POSTGRES_URL || process.env.SUPABASE_URL,
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
    synchronize: false,
    logging: false,
    migrations: [],
    ssl: true,
    extra: {
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        statement_timeout: 10000
    }
});
const initializeDatabase = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            console.log('✅ Database already connected');
            return true;
        }
        console.log('🔄 Initializing database connection...');
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
        if (error instanceof Error) {
            console.error('❌ Database connection failed:', error.message);
        }
        else {
            console.error('❌ Database connection failed:', String(error));
        }
        return false;
    }
};
exports.initializeDatabase = initializeDatabase;
