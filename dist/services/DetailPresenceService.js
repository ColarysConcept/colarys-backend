"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailPresenceService = void 0;
const data_source_1 = require("../config/data-source");
const DetailPresence_1 = require("../entities/DetailPresence");
const BaseService_1 = require("./BaseService");
const detailPresenceRepo = data_source_1.AppDataSource.getRepository(DetailPresence_1.DetailPresence);
class DetailPresenceService extends BaseService_1.BaseService {
    constructor() {
        super(detailPresenceRepo);
    }
    async update(id, data) {
        try {
            const whereCondition = { id };
            const entity = await this.repo.findOne({ where: whereCondition });
            if (!entity) {
                return null;
            }
            Object.assign(entity, data);
            return await this.repo.save(entity);
        }
        catch (error) {
            console.error('Erreur lors de la mise à jour de DetailPresence :', error);
            throw error;
        }
    }
}
exports.DetailPresenceService = DetailPresenceService;
