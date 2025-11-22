"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/agentRoutes.ts - VERSION FINALE
const express_1 = require("express");
const AgentController_1 = require("../controllers/AgentController");
const router = (0, express_1.Router)();
const agentController = new AgentController_1.AgentController();
// ✅ SUPPRIMEZ LES DONNÉES TEMPORAIRES - UTILISEZ LE CONTRÔLEUR
router.get('/', (req, res) => {
    console.log('GET /agents/ - Fetching REAL agents from database');
    agentController.getAll(req, res); // Utilise les vraies données
});
// Routes existantes qui fonctionnent déjà
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
// // backend/src/routes/agentRoutes.ts
// import { Router } from 'express';
// import { AgentController } from '../controllers/AgentController';
// const router = Router();
// const agentController = new AgentController();
// // Route pour récupérer un agent par matricule
// router.get('/matricule/:matricule', (req, res) => {
//   console.log('GET /agents/matricule/:matricule appelé avec matricule:', req.params.matricule);
//   agentController.getByMatricule(req, res);
// });
// // NOUVELLE ROUTE : Recherche par nom et prénom
// router.get('/nom/:nom/prenom/:prenom', (req, res) => {
//   console.log('GET /agents/nom/:nom/prenom/:prenom appelé avec:', req.params);
//   agentController.getByNomPrenom(req, res);
// });
// // Ajoutez cette route
// router.get('/search', (req, res) => {
//   agentController.searchByNomPrenom(req, res);
// });
// console.log('Routes d\'agent enregistrées:');
// console.log('- GET /matricule/:matricule');
// console.log('- GET /nom/:nom/prenom/:prenom');
// export default router;
