"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PresenceController_1 = require("../controllers/PresenceController");
const router = (0, express_1.Router)();
const presenceController = new PresenceController_1.PresenceController();
router.post('/entree', (req, res) => {
    console.log('POST /presences/entree appelé avec body:', req.body);
    presenceController.pointageEntree(req, res);
});
router.post('/sortie', (req, res) => {
    console.log('POST /presences/sortie appelé avec body:', req.body);
    presenceController.pointageSortie(req, res);
});
router.get('/historique', (req, res) => {
    console.log('GET /presences/historique appelé avec query:', req.query);
    presenceController.getHistorique(req, res);
});
router.get('/aujourdhui/:matricule', (req, res) => {
    console.log('GET /presences/aujourdhui/:matricule appelé avec matricule:', req.params.matricule);
    presenceController.getPresenceAujourdhui(req, res);
});
router.get('/export/:format', (req, res) => {
    console.log('GET /presences/export/:format appelé avec params:', req.params, 'query:', req.query);
    presenceController.exportHistorique(req, res);
});
router.get('/aujourdhui/nom/:nom/prenom/:prenom', (req, res) => {
    console.log('GET /presences/aujourdhui/nom/:nom/prenom/:prenom appelé avec:', req.params);
    presenceController.getPresenceAujourdhuiByNomPrenom(req, res);
});
exports.default = router;
