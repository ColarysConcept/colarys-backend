"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const typeorm_1 = require("typeorm");
class BaseService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(relations = []) {
        return await this.repo.find({ relations });
    }
    async findById(id, relations = []) {
        const whereCondition = { id };
        return await this.repo.findOne({
            where: whereCondition,
            relations,
        });
    }
    async create(data) {
        const entity = this.repo.create(data);
        return await this.repo.save(entity);
    }
    async update(id, data) {
        try {
            if (!data || Object.keys(data).length === 0) {
                throw new Error("Aucune donnée fournie pour la mise à jour");
            }
            const whereCondition = { id };
            const entity = await this.repo.findOne({ where: whereCondition });
            if (!entity)
                return null;
            Object.assign(entity, data);
            return await this.repo.save(entity);
        }
        catch (error) {
            console.error('Erreur dans BaseService.update:', error);
            throw error;
        }
    }
    async delete(id) {
        return await this.repo.delete(id);
    }
    async findBy(field, value, relations = []) {
        return await this.repo.find({
            where: { [field]: value },
            relations,
        });
    }
    async findByLike(field, value, relations = []) {
        return await this.repo.find({
            where: { [field]: (0, typeorm_1.Like)(`%${value}%`) },
            relations,
        });
    }
}
exports.BaseService = BaseService;
