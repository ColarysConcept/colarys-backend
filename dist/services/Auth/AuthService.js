"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const data_source_1 = require("../../config/data-source");
const User_1 = require("../../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
class AuthService {
    static async login(email, password) {
        try {
            const cleanEmail = email.toLowerCase().trim();
            const cleanPassword = password.trim();
            if (!cleanEmail || !cleanPassword) {
                throw new Error("Email and password required");
            }
            const user = await userRepository
                .createQueryBuilder("user")
                .addSelect("user.password")
                .where("user.email = :email", { email: cleanEmail })
                .getOne();
            if (!user) {
                throw new Error("Invalid credentials");
            }
            console.log("------ DEBUG AUTH ------");
            console.log("Input password:", cleanPassword);
            console.log("Stored hash:", user.password);
            console.log("Hash length:", user.password.length);
            console.log("Hash type:", typeof user.password);
            const isMatch = await bcryptjs_1.default.compare(cleanPassword, user.password);
            console.log("Match result:", isMatch);
            if (!isMatch) {
                const testHash = await bcryptjs_1.default.hash(cleanPassword, 10);
                console.log("New generated hash:", testHash);
                console.log("Compare new hash with stored:", testHash === user.password);
                throw new Error("Invalid credentials");
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
            const { password: _ } = user, safeUser = __rest(user, ["password"]);
            return { user: safeUser, token };
        }
        catch (error) {
            console.error("FULL ERROR DETAILS:", error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
