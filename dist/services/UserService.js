"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const BaseService_1 = require("./BaseService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const typeorm_1 = require("typeorm");
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
class UserService extends BaseService_1.BaseService {
    constructor() {
        super(userRepo);
    }
    async createUser(name, email, password, role = "agent") {
        const existingUser = await userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new Error("L'email est déjà utilisé");
        }
        if (!name || !email || !password) {
            throw new Error("Tous les champs obligatoires doivent être remplis");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        try {
            return await this.create({
                name,
                email,
                password: hashedPassword,
                role
            });
        }
        catch (error) {
            if (error instanceof typeorm_1.QueryFailedError) {
                if (error.message.includes("unique constraint")) {
                    throw new Error("L'email existe déjà");
                }
                if (error.message.includes("not-null constraint")) {
                    throw new Error("Un champ obligatoire est manquant");
                }
            }
            throw error;
        }
    }
    async updateUser(id, name, email, role, password) {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        if (email && email !== user.email) {
            const emailExists = await userRepo.exist({ where: { email } });
            if (emailExists) {
                throw new Error("Le nouvel email est déjà utilisé");
            }
            user.email = email;
        }
        if (name)
            user.name = name;
        if (role)
            user.role = role;
        if (password) {
            user.password = await bcryptjs_1.default.hash(password, 10);
        }
        try {
            return await this.repo.save(user);
        }
        catch (error) {
            if (error instanceof typeorm_1.QueryFailedError) {
                throw new Error("Erreur lors de la mise à jour de l'utilisateur");
            }
            throw error;
        }
    }
    async getUserByEmail(email) {
        return await userRepo.findOne({
            where: { email },
            select: ["id", "name", "email", "role", "password"]
        });
    }
}
exports.UserService = UserService;
