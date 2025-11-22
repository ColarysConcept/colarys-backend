"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const data_source_1 = require("../config/data-source");
const Role_1 = require("../entities/Role");
const BaseService_1 = require("./BaseService");
const logger_1 = require("../config/logger");
const roleRepository = data_source_1.AppDataSource.getRepository(Role_1.Role);
class RoleService extends BaseService_1.BaseService {
    constructor() {
        super(roleRepository);
    }
    async getAllRoles(filter = {}, skip = 0, take = 10) {
        try {
            logger_1.logger.debug(`Fetching roles with filter: ${JSON.stringify(filter)}`);
            const [data, total] = await roleRepository.findAndCount({
                where: filter,
                skip,
                take,
                order: { id: "ASC" }
            });
            return { data, total, skip, take };
        }
        catch (error) {
            logger_1.logger.error("Failed to fetch roles", { error });
            throw new Error("Erreur lors de la récupération des rôles");
        }
    }
    async createRole(roleData) {
        if (!roleData.role) {
            throw new Error("Le nom du rôle est requis");
        }
        try {
            const newRole = roleRepository.create(roleData);
            await roleRepository.save(newRole);
            logger_1.logger.info(`Role created: ${newRole.role}`);
            return newRole;
        }
        catch (error) {
            logger_1.logger.error("Role creation failed", { error });
            throw new Error("Erreur lors de la création du rôle");
        }
    }
}
exports.RoleService = RoleService;
