"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ColarysEmployeeController_1 = require("../controllers/ColarysEmployeeController");
const router = (0, express_1.Router)();
// ==================== SANTÉ ====================
router.get('/health', ColarysEmployeeController_1.colarysEmployeeController.healthCheck);
// ==================== EMPLOYÉS ====================
router.get('/employees', ColarysEmployeeController_1.colarysEmployeeController.getAllEmployees);
router.get('/employees/:matricule', ColarysEmployeeController_1.colarysEmployeeController.getEmployee);
router.get('/statistiques', ColarysEmployeeController_1.colarysEmployeeController.getStatistiques);
router.post('/employees', ColarysEmployeeController_1.colarysEmployeeController.createEmployee);
router.post('/fiche-paie/export', ColarysEmployeeController_1.colarysEmployeeController.exportFichesPaie);
router.put('/employees/:matricule', ColarysEmployeeController_1.colarysEmployeeController.updateEmployee);
router.delete('/employees/:matricule', ColarysEmployeeController_1.colarysEmployeeController.deleteEmployee);
// ==================== PRÉSENCES ====================
router.get('/presences', ColarysEmployeeController_1.colarysEmployeeController.getPresences);
router.get('/presences/:year/:month', ColarysEmployeeController_1.colarysEmployeeController.getMonthlyPresences);
router.put('/presences/:matricule/:year/:month/:day', ColarysEmployeeController_1.colarysEmployeeController.updatePresence);
// 🔥 NOUVELLE ROUTE: Synchronisation automatique des jours OFF
router.post('/presences/sync-jours-off', ColarysEmployeeController_1.colarysEmployeeController.syncJoursOff);
// ==================== SALAIRES ====================
router.get('/salaires', ColarysEmployeeController_1.colarysEmployeeController.getSalaires);
router.get('/salaires/calculate/:year/:month', ColarysEmployeeController_1.colarysEmployeeController.calculateSalaires);
router.put('/salaires/:matricule/:year/:month', ColarysEmployeeController_1.colarysEmployeeController.updateSalaire);
// ==================== UTILITAIRES ====================
router.post('/update-conges', ColarysEmployeeController_1.colarysEmployeeController.updateCongesAutomatique);
exports.default = router;
