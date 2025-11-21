"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const BaseController_1 = require("./BaseController");
const userService = new UserService_1.UserService();
class UserController extends BaseController_1.BaseController {
    constructor() {
        super(userService);
        this.create = async (req, res) => {
            const { name, email, password, role } = req.body;
            try {
                const newUser = await userService.createUser(name, email, password, role);
                return res.status(201).json(newUser);
            }
            catch (err) {
                return res.status(400).json({ error: "Email déjà utilisé" });
            }
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const { name, email, role, password } = req.body;
            const updatedUser = await userService.updateUser(parseInt(id), name, email, role, password);
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.json(updatedUser);
        };
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
