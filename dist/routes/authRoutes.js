"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
router.post('/login', (req, res) => {
    console.log('POST /auth/login called with:', req.body);
    authController.login(req, res);
});
router.get('/', (req, res) => {
    res.json({
        message: 'Auth API is working',
        availableEndpoints: ['POST /login']
    });
});
exports.default = router;
