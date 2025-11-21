"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts
const crudRouter_1 = require("./crudRouter");
const UserController_1 = require("../controllers/UserController");
// import { authMiddleware } from "../middleware/authMiddleware";
const User_1 = require("../entities/User");
// export default createCrudRouter(userController, "");
// export default createCrudRouter(userController,User, "", [authMiddleware]);
exports.default = (0, crudRouter_1.createCrudRouter)(UserController_1.userController, User_1.User, "");
