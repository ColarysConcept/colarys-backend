"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlateformeService = void 0;
const data_source_1 = require("../config/data-source");
const Plateforme_1 = require("../entities/Plateforme");
const BaseService_1 = require("./BaseService");
const plateformeRepo = data_source_1.AppDataSource.getRepository(Plateforme_1.Plateforme);
class PlateformeService extends BaseService_1.BaseService {
    constructor() {
        super(plateformeRepo);
    }
}
exports.PlateformeService = PlateformeService;
