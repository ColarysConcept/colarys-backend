"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/agentRoutes.ts
const crudRouter_1 = require("./crudRouter");
const HistoAgentsController_1 = require("../controllers/HistoAgentsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const HistoAgents_1 = require("../entities/HistoAgents");
// export default createCrudRouter(histoAgentsController, "");
exports.default = (0, crudRouter_1.createCrudRouter)(HistoAgentsController_1.histoAgentsController, HistoAgents_1.HistoAgents, "", [authMiddleware_1.authMiddleware]);
