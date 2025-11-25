"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceController = void 0;
const PresenceService_1 = require("../services/PresenceService");
class PresenceController {
    constructor() {
        this.presenceService = new PresenceService_1.PresenceService();
    }
    async pointageEntree(req, res) {
        console.log('pointageEntree appelé avec body:', req.body);
        try {
            const { matricule, nom, prenom, campagne, shift, signatureEntree, heureEntreeManuelle } = req.body;
            const missingFields = [];
            if (!nom)
                missingFields.push('nom');
            if (!prenom)
                missingFields.push('prenom');
            if (!signatureEntree)
                missingFields.push('signatureEntree');
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: `Champs manquants : ${missingFields.join(', ')}`,
                });
            }
            const result = await this.presenceService.pointageEntree({
                matricule,
                nom,
                prenom,
                campagne: campagne || "Standard",
                shift: shift || "JOUR",
                signatureEntree,
                heureEntreeManuelle
            });
            res.status(201).json({
                message: "Pointage d'entrée enregistré avec succès",
                success: true,
                presence: result.presence
            });
        }
        catch (error) {
            console.error('Erreur dans pointageEntree:', error);
            if (error instanceof Error) {
                res.status(400).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: "Erreur inconnue lors du pointage d'entrée" });
            }
        }
    }
    async pointageSortie(req, res) {
        console.log('pointageSortie appelé avec body:', req.body);
        try {
            const { matricule, signatureSortie, heureSortieManuelle } = req.body;
            if (!matricule || !signatureSortie) {
                return res.status(400).json({
                    success: false,
                    error: "Matricule et signature sont obligatoires"
                });
            }
            const result = await this.presenceService.pointageSortie(matricule, signatureSortie, heureSortieManuelle);
            res.json({
                message: "Pointage de sortie enregistré avec succès",
                success: true,
                presence: result.presence
            });
        }
        catch (error) {
            console.error('Erreur dans pointageSortie:', error);
            if (error instanceof Error) {
                res.status(400).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: "Erreur inconnue lors du pointage de sortie" });
            }
        }
    }
    async getHistorique(req, res) {
        console.log('getHistorique appelé avec query:', req.query);
        try {
            const { dateDebut, dateFin, matricule, nom, prenom, annee, mois, campagne, shift } = req.query;
            if ((!dateDebut || !dateFin) && !annee) {
                return res.status(400).json({
                    success: false,
                    error: "Les paramètres dateDebut/dateFin ou annee sont requis"
                });
            }
            console.log('Recherche historique avec tous les filtres:', {
                dateDebut, dateFin, matricule, nom, prenom, annee, mois, campagne, shift
            });
            const result = await this.presenceService.getHistoriquePresences({
                dateDebut: dateDebut,
                dateFin: dateFin,
                matricule: matricule,
                nom: nom,
                prenom: prenom,
                annee: annee,
                mois: mois,
                campagne: campagne,
                shift: shift
            });
            res.json({
                success: true,
                count: result.data.length,
                totalHeures: result.totalHeures,
                totalPresences: result.totalPresences,
                data: result.data
            });
        }
        catch (error) {
            console.error('Erreur dans getHistorique:', error);
            if (error instanceof Error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: "Erreur inconnue lors de la récupération de l'historique"
                });
            }
        }
    }
    async getAllPresences(req, res) {
        try {
            console.log('🔄 Getting all presences...');
            const presences = await this.presenceService.findAll();
            res.json({
                success: true,
                message: 'All presences retrieved successfully',
                count: presences.length,
                data: presences
            });
        }
        catch (error) {
            console.error('❌ Error getting all presences:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve presences',
                message: error.message
            });
        }
    }
    async getPresenceAujourdhui(req, res) {
        console.log('getPresenceAujourdhui appelé avec matricule:', req.params.matricule);
        try {
            const { matricule } = req.params;
            if (!matricule) {
                return res.status(400).json({ success: false, error: "Le matricule est requis" });
            }
            const result = await this.presenceService.getPresenceAujourdhuiByMatricule(matricule);
            res.json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Erreur dans getPresenceAujourdhui:', error);
            if (error instanceof Error) {
                res.status(500).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: "Erreur inconnue lors de la récupération de la présence" });
            }
        }
    }
    async getPresenceAujourdhuiByNomPrenom(req, res) {
        console.log('getPresenceAujourdhuiByNomPrenom appelé avec:', req.params);
        try {
            const { nom, prenom } = req.params;
            if (!nom || !prenom) {
                return res.status(400).json({ success: false, error: "Le nom et le prénom sont requis" });
            }
            const result = await this.presenceService.getPresenceAujourdhuiByNomPrenom(nom, prenom);
            res.json(result);
        }
        catch (error) {
            console.error('Erreur dans getPresenceAujourdhuiByNomPrenom:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Erreur lors de la récupération de la présence"
            });
        }
    }
    async exportHistorique(req, res) {
        console.log('exportHistorique appelé avec params:', req.params, 'query:', req.query);
        try {
            const { dateDebut, dateFin, matricule, annee, mois, campagne, shift } = req.query;
            const { format } = req.params;
            if (format !== 'pdf') {
                return res.status(400).json({ error: 'Format non supporté. Utilisez "pdf"' });
            }
            const result = await this.presenceService.getHistoriquePresences({
                dateDebut: dateDebut,
                dateFin: dateFin,
                matricule: matricule,
                annee: annee,
                mois: mois,
                campagne: campagne,
                shift: shift
            });
            const presencesConverties = result.data.map(presence => (Object.assign(Object.assign({}, presence), { heuresTravaillees: presence.heuresTravaillees != null ? Number(presence.heuresTravaillees) : null })));
            const pdfBuffer = await this.presenceService.generatePDF(presencesConverties, result.totalHeures, result.totalPresences);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=historique-presences-${new Date().toISOString().split('T')[0]}.pdf`);
            return res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Erreur dans exportHistorique:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Erreur lors de l'export"
            });
        }
    }
}
exports.PresenceController = PresenceController;
