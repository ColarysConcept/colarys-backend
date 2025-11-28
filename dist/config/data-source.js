"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseConnection = exports.initializeDatabase = exports.AppDataSource = void 0;
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
console.log('🔧 Database configuration - Loading entities...');
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [
        User_1.User,
        Agent_1.Agent,
        HistoAgents_1.HistoAgents,
        Role_1.Role,
        Presence_1.Presence,
        DetailPresence_1.DetailPresence,
        Trashpresence_1.Trashpresence,
        AgentColarys_1.AgentColarys
    ],
    synchronize: false,
    logging: false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    extra: {
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
    }
});
const initializeDatabase = async () => {
    if (exports.AppDataSource.isInitialized) {
        console.log('✅ Database already initialized');
        return true;
    }
    try {
        console.log('🔄 Starting database initialization...');
        const requiredVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:', missingVars);
            return false;
        }
        console.log('🔧 Attempting to connect to database...');
        await exports.AppDataSource.initialize();
        console.log('✅ Database connected successfully!');
        const entityNames = exports.AppDataSource.entityMetadatas.map(meta => meta.name);
        console.log('📋 Successfully loaded entities:', entityNames);
        return true;
    }
    catch (error) {
        console.error('❌ Database initialization FAILED:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        return false;
    }
};
exports.initializeDatabase = initializeDatabase;
const ensureDatabaseConnection = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            try {
                await exports.AppDataSource.query('SELECT 1');
                console.log('✅ Database connection verified');
                return true;
            }
            catch (error) {
                console.log('🔄 Connection test failed, reconnecting...');
                await exports.AppDataSource.destroy();
            }
        }
        console.log('🔄 Reconnecting to database...');
        return await (0, exports.initializeDatabase)();
    }
    catch (error) {
        console.error('❌ ensureDatabaseConnection failed:', error);
        return false;
    }
};
exports.ensureDatabaseConnection = ensureDatabaseConnection;
