"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withVersionHeader = withVersionHeader;
const data_source_1 = require("../config/data-source");
function withVersionHeader(entity) {
    return async (req, res, next) => {
        try {
            const repo = data_source_1.AppDataSource.getRepository(entity);
            const result = await repo
                .createQueryBuilder("e")
                .select("MAX(e.updatedAt)", "lastUpdate")
                .getRawOne();
            const version = result?.lastUpdate?.toString() || Date.now().toString();
            res.setHeader("X-Version", version);
        }
        catch (err) {
            console.error("❌ Impossible de définir X-Version:", err);
        }
        next();
    };
}
