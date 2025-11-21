"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
// backend/src/services/BaseService.ts
const typeorm_1 = require("typeorm");
class BaseService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(relations = []) {
        return await this.repo.find({ relations });
    }
    async findById(id, relations = []) {
        // Correction similaire si erreur ici : utiliser 'unknown' pour la conversion
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
    // backend/src/services/BaseService.ts
    async update(id, data) {
        try {
            // CORRECTION : Vérifier que data n'est pas vide
            if (!data || Object.keys(data).length === 0) {
                throw new Error("Aucune donnée fournie pour la mise à jour");
            }
            const whereCondition = { id };
            const entity = await this.repo.findOne({ where: whereCondition });
            if (!entity)
                return null;
            // CORRECTION : Vérifier que Object.assign fonctionne correctement
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
    /**
     * ✅ Recherche générique par champ exact
     */
    async findBy(field, value, relations = []) {
        return await this.repo.find({
            where: { [field]: value }, // Ajout de 'unknown' si nécessaire
            relations,
        });
    }
    /**
     * 🔥 Recherche générique avec LIKE (partiel)
     */
    async findByLike(field, value, relations = []) {
        return await this.repo.find({
            where: { [field]: (0, typeorm_1.Like)(`%${value}%`) }, // Ajout de 'unknown' si nécessaire
            relations,
        });
    }
}
exports.BaseService = BaseService;
