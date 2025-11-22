"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "secret_key";
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) ? authHeader.split(" ")[1] : null;
    const tokenFromBody = (_a = req.body) === null || _a === void 0 ? void 0 : _a.token;
    const token = tokenFromHeader || tokenFromBody;
    if (!token)
        return res.status(401).json({ message: "Token manquant" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Token invalide" });
    }
}
