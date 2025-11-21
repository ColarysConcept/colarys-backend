"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = exports.RoleController = void 0;
// src/controllers/AgentController.ts
const RoleService_1 = require("../services/RoleService");
const BaseController_1 = require("./BaseController");
const roleService = new RoleService_1.RoleService();
class RoleController extends BaseController_1.BaseController {
    constructor() {
        super(roleService);
    }
}
exports.RoleController = RoleController;
exports.roleController = new RoleController();
