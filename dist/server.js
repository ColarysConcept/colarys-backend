"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./config/data-source");
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
console.log('🚀 Starting Colarys API Server in LOCAL mode...');
const startServer = async () => {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log("📦 Connected to database");
        const PORT = process.env.PORT || 3000;
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📍 Local: http://localhost:${PORT}`);
            console.log(`📍 Health: http://localhost:${PORT}/api/health`);
        });
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};
if (!process.env.VERCEL) {
    startServer();
}
exports.default = app_1.default;
