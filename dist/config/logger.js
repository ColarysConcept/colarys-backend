"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const getLogsDirectory = () => {
    if (process.env.VERCEL) {
        return '/tmp/logs';
    }
    return 'logs';
};
exports.logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        ...(process.env.VERCEL ? [] : [
            new winston_1.default.transports.File({
                filename: path_1.default.join(getLogsDirectory(), "auth.log"),
                level: "info"
            }),
            new winston_1.default.transports.File({
                filename: path_1.default.join(getLogsDirectory(), "error.log"),
                level: "error"
            })
        ])
    ],
});
if (!process.env.VERCEL) {
    const fs = require('fs');
    const logsDir = getLogsDirectory();
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
}
