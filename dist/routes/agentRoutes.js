"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AgentController_1 = require("../controllers/AgentController");
const router = (0, express_1.Router)();
const agentController = new AgentController_1.AgentController();
router.get('/', (req, res) => {
    console.log('GET /agents/ - Fetching REAL agents from database');
    agentController.getAll(req, res);
});
router.get('/matricule/:matricule', (req, res) => {
    console.log('GET /agents/matricule/:matricule appelé avec matricule:', req.params.matricule);
    agentController.getByMatricule(req, res);
});
router.get('/nom/:nom/prenom/:prenom', (req, res) => {
    console.log('GET /agents/nom/:nom/prenom/:prenom appelé avec:', req.params);
    agentController.getByNomPrenom(req, res);
});
router.get('/search', (req, res) => {
    agentController.searchByNomPrenom(req, res);
});
console.log('Routes d\'agent enregistrées:');
console.log('- GET / → REAL database data');
console.log('- GET /matricule/:matricule');
console.log('- GET /nom/:nom/prenom/:prenom');
console.log('- GET /search');
exports.default = router;
