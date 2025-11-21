"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrashpresenceService = void 0;
// services/PresenceService.ts
const data_source_1 = require("../config/data-source");
const Trashpresence_1 = require("../entities/Trashpresence");
const BaseService_1 = require("./BaseService");
const trashpresenceRepo = data_source_1.AppDataSource.getRepository(Trashpresence_1.Trashpresence);
class TrashpresenceService extends BaseService_1.BaseService {
    constructor() {
        super(trashpresenceRepo);
    }
}
exports.TrashpresenceService = TrashpresenceService;
