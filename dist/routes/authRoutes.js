"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
router.post('/login', AuthController_1.AuthController.login);
// Debug: Affiche les routes enregistrées
console.log('Auth routes registered:');
console.log('POST /login → /api/auth/login');
exports.default = router;
