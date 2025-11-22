"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts - VERSION FINALE
const express_1 = require("express");
const crudRouter_1 = require("./crudRouter");
const UserController_1 = require("../controllers/UserController");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
// ✅ REDIRECTION : /api/users → /api/users/getAll (vos données réelles)
router.get('/', (req, res) => {
    console.log('GET /users - Redirecting to /getAll for real data');
    // Appelle directement la méthode getAll du contrôleur
    UserController_1.userController.getAll(req, res);
});
// ✅ MONTEZ LE ROUTEUR CRUD POUR GARDER TOUTES LES FONCTIONNALITÉS
const crudRouter = (0, crudRouter_1.createCrudRouter)(UserController_1.userController, User_1.User, "");
router.use('/', crudRouter);
console.log('✅ User routes mounted:');
console.log('   GET / → Real user data from database');
console.log('   GET /getAll → CRUD route (same data)');
console.log('   GET /getOne/:id → Get user by ID');
console.log('   POST /create → Create user');
console.log('   PUT /update/:id → Update user');
console.log('   DELETE /delete/:id → Delete user');
exports.default = router;
