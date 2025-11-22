"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withVersionHeader = withVersionHeader;
const data_source_1 = require("../config/data-source");
function withVersionHeader(entity) {
    return async (req, res, next) => {
        var _a;
        try {
            const repo = data_source_1.AppDataSource.getRepository(entity);
            const result = await repo
                .createQueryBuilder("e")
                .select("MAX(e.updatedAt)", "lastUpdate")
                .getRawOne();
            const version = ((_a = result === null || result === void 0 ? void 0 : result.lastUpdate) === null || _a === void 0 ? void 0 : _a.toString()) || Date.now().toString();
            res.setHeader("X-Version", version);
        }
        catch (err) {
            console.error("❌ Impossible de définir X-Version:", err);
        }
        next();
    };
}
