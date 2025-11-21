"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoAgentsService = void 0;
// services/HistoAgentsService.ts
const data_source_1 = require("../config/data-source");
const HistoAgents_1 = require("../entities/HistoAgents");
const BaseService_1 = require("./BaseService");
const distoAgentsRepo = data_source_1.AppDataSource.getRepository(HistoAgents_1.HistoAgents);
class HistoAgentsService extends BaseService_1.BaseService {
    constructor() {
        super(distoAgentsRepo);
    }
}
exports.HistoAgentsService = HistoAgentsService;
