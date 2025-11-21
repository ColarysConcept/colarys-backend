"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DetailPresenceController_1 = require("../controllers/DetailPresenceController");
const crudRouter_1 = require("./crudRouter");
const DetailPresence_1 = require("../entities/DetailPresence");
const detailPresenceController = new DetailPresenceController_1.DetailPresenceController();
const router = (0, crudRouter_1.createCrudRouter)(detailPresenceController, DetailPresence_1.DetailPresence, '/attendance-details');
exports.default = router;
