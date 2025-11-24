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
console.log('🔧 Database configuration:', {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    nodeEnv: process.env.NODE_ENV
});
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingEnvVars);
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
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
    ssl: process.env.NODE_ENV === 'production',
    extra: {
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : undefined
    }
});
const initializeDatabase = async () => {
    try {
        if (!exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.initialize();
            console.log('✅ Database connection established');
        }
        return exports.AppDataSource;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
