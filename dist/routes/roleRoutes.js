"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crudRouter_1 = require("./crudRouter");
const RoleController_1 = require("../controllers/RoleController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const Role_1 = require("../entities/Role");
exports.default = (0, crudRouter_1.createCrudRouter)(RoleController_1.roleController, Role_1.Role, "", [authMiddleware_1.authMiddleware]);
