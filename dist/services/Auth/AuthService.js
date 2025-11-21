"use strict";
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
            // 1. Nettoyage des entrées
            const cleanEmail = email.toLowerCase().trim();
            const cleanPassword = password.trim();
            // 2. Vérification des entrées
            if (!cleanEmail || !cleanPassword) {
                throw new Error("Email and password required");
            }
            // 3. Récupération utilisateur
            const user = await userRepository
                .createQueryBuilder("user")
                .addSelect("user.password")
                .where("user.email = :email", { email: cleanEmail })
                .getOne();
            if (!user) {
                throw new Error("Invalid credentials");
            }
            // 4. DEBUG: Affichage des valeurs pour diagnostic
            console.log("------ DEBUG AUTH ------");
            console.log("Input password:", cleanPassword);
            console.log("Stored hash:", user.password);
            console.log("Hash length:", user.password.length);
            console.log("Hash type:", typeof user.password);
            // 5. Comparaison des mots de passe
            const isMatch = await bcryptjs_1.default.compare(cleanPassword, user.password);
            console.log("Match result:", isMatch);
            if (!isMatch) {
                // 6. Génération d'un nouveau hash pour comparaison
                const testHash = await bcryptjs_1.default.hash(cleanPassword, 10);
                console.log("New generated hash:", testHash);
                console.log("Compare new hash with stored:", testHash === user.password);
                throw new Error("Invalid credentials");
            }
            // 7. Génération du token
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
            // 8. Réponse sans le mot de passe
            const { password: _, ...safeUser } = user;
            return { user: safeUser, token };
        }
        catch (error) {
            console.error("FULL ERROR DETAILS:", error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
