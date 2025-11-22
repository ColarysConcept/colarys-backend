"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.histoAgentsController = exports.HistoAgentsController = void 0;
const HistoAgentsService_1 = require("../services/HistoAgentsService");
const BaseController_1 = require("./BaseController");
const histoAgentsService = new HistoAgentsService_1.HistoAgentsService();
class HistoAgentsController extends BaseController_1.BaseController {
    constructor() {
        super(histoAgentsService);
    }
}
exports.HistoAgentsController = HistoAgentsController;
exports.histoAgentsController = new HistoAgentsController();
