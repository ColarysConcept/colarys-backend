"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('🔧 Database config - Checking environment variables...');
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "6543"),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [__dirname + "/../entities/*.js"],
    synchronize: false,
    logging: false,
    ssl: true,
    extra: {
        ssl: {
            rejectUnauthorized: false
        }
    }
});
const initializeDatabase = async () => {
    if (exports.AppDataSource.isInitialized) {
        return true;
    }
    try {
        console.log('🔄 Initializing database...');
        const required = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
        const missing = required.filter(key => !process.env[key]);
        if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing);
            return false;
        }
        await exports.AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Database initialization failed:');
        console.error('Error:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        return false;
    }
};
exports.initializeDatabase = initializeDatabase;
