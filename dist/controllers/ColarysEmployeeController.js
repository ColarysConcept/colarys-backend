"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colarysEmployeeController = exports.ColarysEmployeeController = void 0;
const ColarysEmployeeService_1 = require("../services/ColarysEmployeeService");
class ColarysEmployeeController {
    async healthCheck(_req, res) {
        try {
            const employees = await ColarysEmployeeService_1.colarysEmployeeService.getAllEmployees();
            const presences = await ColarysEmployeeService_1.colarysEmployeeService.getPresences();
            const salaires = await ColarysEmployeeService_1.colarysEmployeeService.getSalaires();
            res.json({
                success: true,
                data: {
                    employees: employees.length,
                    presences: Object.keys(presences).length,
                    salaires: Object.keys(salaires).length
                },
                message: 'Service Colarys opérationnel'
            });
        }
        catch (error) {
            console.error('Erreur health check:', error);
            res.status(500).json({
                success: false,
                message: 'Service Colarys indisponible'
            });
        }
    }
    async getAllEmployees(_req, res) {
        try {
            const employees = await ColarysEmployeeService_1.colarysEmployeeService.getAllEmployees();
            res.json({
                success: true,
                data: employees,
                count: employees.length
            });
        }
        catch (error) {
            console.error('Erreur récupération employés:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des employés'
            });
        }
    }
    async getEmployee(req, res) {
        try {
            const { matricule } = req.params;
            const employee = await ColarysEmployeeService_1.colarysEmployeeService.getEmployeeByMatricule(matricule);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employé non trouvé'
                });
            }
            res.json({
                success: true,
                data: employee
            });
        }
        catch (error) {
            console.error('Erreur récupération employé:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'employé'
            });
        }
    }
    async createEmployee(req, res) {
        try {
            const result = await ColarysEmployeeService_1.colarysEmployeeService.createEmployee(req.body);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    matricule: result.matricule
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('Erreur création employé:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'employé'
            });
        }
    }
    async updateEmployee(req, res) {
        try {
            const { matricule } = req.params;
            const result = await ColarysEmployeeService_1.colarysEmployeeService.updateEmployee(matricule, req.body);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('Erreur modification employé:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de l\'employé'
            });
        }
    }
    async deleteEmployee(req, res) {
        try {
            const { matricule } = req.params;
            const result = await ColarysEmployeeService_1.colarysEmployeeService.deleteEmployee(matricule);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('Erreur suppression employé:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'employé'
            });
        }
    }
    async getPresences(_req, res) {
        try {
            const presences = await ColarysEmployeeService_1.colarysEmployeeService.getPresences();
            res.json({
                success: true,
                data: presences,
                count: Object.keys(presences).length
            });
        }
        catch (error) {
            console.error('Erreur récupération présences:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des présences'
            });
        }
    }
    async getMonthlyPresences(req, res) {
        try {
            const { year, month } = req.params;
            const presences = await ColarysEmployeeService_1.colarysEmployeeService.getMonthlyPresences(parseInt(year), parseInt(month));
            res.json({
                success: true,
                data: presences
            });
        }
        catch (error) {
            console.error('Erreur récupération présences mensuelles:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des présences mensuelles'
            });
        }
    }
    async syncJoursOff(req, res) {
        try {
            const { year, month } = req.body;
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || isNaN(monthNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Année et mois invalides'
                });
            }
            const result = await this.synchroniserJoursOffAutomatique(yearNum, monthNum);
            res.json({
                success: true,
                message: `Synchronisation des jours OFF terminée: ${result.synchronises} jours OFF ajoutés`,
                data: result
            });
        }
        catch (error) {
            console.error('Erreur synchronisation jours OFF:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la synchronisation des jours OFF'
            });
        }
    }
    async synchroniserJoursOffAutomatique(year, month) {
        let synchronises = 0;
        let erreurs = 0;
        try {
            const employees = await ColarysEmployeeService_1.colarysEmployeeService.getAllEmployees();
            for (const employee of employees) {
                try {
                    const matricule = employee.Matricule;
                    const joursOffEmploye = await this.getJoursOffForEmployee(matricule, year, month);
                    for (const dateStr of joursOffEmploye) {
                        const date = new Date(dateStr);
                        const day = date.getDate();
                        await ColarysEmployeeService_1.colarysEmployeeService.updatePresence(matricule, year, month, day, 'o');
                        synchronises++;
                    }
                }
                catch (error) {
                    console.error(`Erreur synchronisation jours OFF pour ${employee.Matricule}:`, error);
                    erreurs++;
                }
            }
            return { synchronises, erreurs };
        }
        catch (error) {
            console.error('Erreur globale synchronisation jours OFF:', error);
            throw error;
        }
    }
    async getJoursOffForEmployee(matricule, year, month) {
        try {
            return [];
        }
        catch (error) {
            console.error(`Erreur récupération jours OFF pour ${matricule}:`, error);
            return [];
        }
    }
    async updatePresence(req, res) {
        try {
            const { matricule, year, month, day } = req.params;
            const { type } = req.body;
            const result = await ColarysEmployeeService_1.colarysEmployeeService.updatePresence(matricule, parseInt(year), parseInt(month), parseInt(day), type);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('Erreur mise à jour présence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la présence'
            });
        }
    }
    async getSalaires(_req, res) {
        try {
            const salaires = await ColarysEmployeeService_1.colarysEmployeeService.getSalaires();
            res.json({
                success: true,
                data: salaires,
                count: Object.keys(salaires).length
            });
        }
        catch (error) {
            console.error('Erreur récupération salaires:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des salaires'
            });
        }
    }
    async calculateSalaires(req, res) {
        try {
            const { year, month } = req.params;
            const { joursTheoriques } = req.query;
            console.log(`🧮 Calcul salaires demandé: ${year}/${month}, jours: ${joursTheoriques || 'auto'}`);
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                return res.status(400).json({
                    success: false,
                    message: 'Année invalide. Doit être entre 2000 et 2100.'
                });
            }
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Mois invalide. Doit être entre 1 et 12.'
                });
            }
            let joursTheoriquesNum;
            if (joursTheoriques !== undefined && joursTheoriques !== null && joursTheoriques !== '') {
                joursTheoriquesNum = parseInt(joursTheoriques);
                if (isNaN(joursTheoriquesNum) || joursTheoriquesNum <= 0 || joursTheoriquesNum > 31) {
                    return res.status(400).json({
                        success: false,
                        message: 'Jours théoriques invalide. Doit être un nombre entre 1 et 31.'
                    });
                }
            }
            console.log(`📊 Paramètres validés: ${yearNum}/${monthNum}, jours: ${joursTheoriquesNum || 'auto'}`);
            const salaires = await ColarysEmployeeService_1.colarysEmployeeService.calculateSalaires(yearNum, monthNum, joursTheoriquesNum);
            console.log(`✅ Calcul réussi: ${salaires.length} salaires calculés`);
            const getMonthName = (month) => {
                const months = [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ];
                return months[month - 1] || 'Inconnu';
            };
            const premierSalaire = salaires[0] || {};
            const joursUtilises = premierSalaire['Jours théoriques'] || 'auto';
            res.json({
                success: true,
                data: salaires,
                count: salaires.length,
                metadata: {
                    periode: {
                        annee: yearNum,
                        mois: monthNum,
                        libelleMois: getMonthName(monthNum)
                    },
                    joursUtilises: joursUtilises,
                    calculAutoJours: joursTheoriquesNum === undefined,
                    totalBrut: salaires.reduce((sum, s) => sum + (s['Salaire brut'] || 0), 0),
                    totalNet: salaires.reduce((sum, s) => sum + (s['Reste à payer'] || 0), 0)
                }
            });
        }
        catch (error) {
            console.error('💥 Erreur contrôleur calcul salaires:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors du calcul des salaires';
            res.status(500).json({
                success: false,
                message: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateSalaire(req, res) {
        try {
            const { matricule, year, month } = req.params;
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                return res.status(400).json({
                    success: false,
                    message: 'Année invalide'
                });
            }
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Mois invalide'
                });
            }
            const result = await ColarysEmployeeService_1.colarysEmployeeService.updateSalaire(matricule, yearNum, monthNum, req.body);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    data: {
                        matricule,
                        periode: `${monthNum}/${yearNum}`,
                        modifications: Object.keys(req.body)
                    }
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('Erreur mise à jour salaire:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du salaire'
            });
        }
    }
    async updateCongesAutomatique(_req, res) {
        try {
            await ColarysEmployeeService_1.colarysEmployeeService.updateCongesAutomatique();
            res.json({
                success: true,
                message: 'Mise à jour automatique des congés effectuée avec succès',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Erreur mise à jour congés automatique:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour des congés'
            });
        }
    }
    async getStatistiques(req, res) {
        try {
            const { year, month } = req.query;
            let yearNum;
            let monthNum;
            if (year && month) {
                yearNum = parseInt(year);
                monthNum = parseInt(month);
                if (isNaN(yearNum) || isNaN(monthNum)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Paramètres année/mois invalides'
                    });
                }
            }
            const employees = await ColarysEmployeeService_1.colarysEmployeeService.getAllEmployees();
            const presences = await ColarysEmployeeService_1.colarysEmployeeService.getPresences();
            let totalJoursOff = 0;
            if (yearNum && monthNum) {
                const presencesData = await ColarysEmployeeService_1.colarysEmployeeService.getMonthlyPresences(yearNum, monthNum);
                for (const key in presencesData.presences) {
                    if (presencesData.presences[key] === 'o') {
                        totalJoursOff++;
                    }
                }
            }
            let joursOuvrables = null;
            if (yearNum && monthNum) {
                const service = ColarysEmployeeService_1.colarysEmployeeService;
                joursOuvrables = service.calculerJoursOuvrables(yearNum, monthNum);
            }
            const stats = {
                totalEmployes: employees.length,
                totalPresences: Object.keys(presences).length,
                totalJoursOff: totalJoursOff,
                employesActifs: employees.filter(emp => this.parseFloat(emp['Solde de congé']) > 0).length,
                congesMoyens: employees.length > 0 ?
                    employees.reduce((sum, emp) => sum + this.parseFloat(emp['Solde de congé']), 0) / employees.length : 0,
                joursOuvrables: joursOuvrables
            };
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Erreur récupération statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }
    async exportFichesPaie(req, res) {
        try {
            const { year, month, matricules } = req.body;
            console.log(`📄 Export fiches de paie demandé: ${month}/${year}, ${(matricules === null || matricules === void 0 ? void 0 : matricules.length) || 'tous'} employés`);
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                return res.status(400).json({
                    success: false,
                    message: 'Année invalide'
                });
            }
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Mois invalide'
                });
            }
            const salaires = await ColarysEmployeeService_1.colarysEmployeeService.calculateSalaires(yearNum, monthNum);
            let salairesFiltres = salaires;
            if (matricules && Array.isArray(matricules) && matricules.length > 0) {
                salairesFiltres = salaires.filter(s => matricules.includes(s.Matricule));
                console.log(`🔍 Filtrage: ${salairesFiltres.length}/${salaires.length} employés sélectionnés`);
            }
            if (salairesFiltres.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune donnée de salaire trouvée pour les critères spécifiés'
                });
            }
            const resultatExport = {
                success: true,
                message: `${salairesFiltres.length} fiche(s) de paie générée(s)`,
                data: {
                    periode: `${monthNum}/${yearNum}`,
                    fiches: salairesFiltres.map(salaire => ({
                        matricule: salaire.Matricule,
                        nom: salaire.Nom,
                        prenom: salaire.Prénom,
                        salaireBrut: salaire['Salaire brut'],
                        salaireNet: salaire['Reste à payer'],
                        details: {
                            salaireBase: salaire['Salaire de base'],
                            primes: {
                                production: salaire['Prime de production'],
                                assiduite: salaire['Prime d\'assiduité'],
                                anciennete: salaire['Prime d\'ancienneté'],
                                elite: salaire['Prime élite'],
                                responsabilite: salaire['Prime de responsabilité']
                            },
                            indemnites: {
                                repas: salaire['Indemnité repas'],
                                transport: salaire['Indemnité transport'],
                                formation: salaire['Indemnité formation'],
                                conge: salaire['Indemnité congé']
                            },
                            deductions: {
                                avance: salaire['Avance sur salaire'],
                                ostie: salaire['OSTIE'],
                                cnaps: salaire['CNaPS'],
                                social: salaire['Social'],
                                igr: salaire['IGR']
                            }
                        }
                    }))
                },
                metadata: {
                    totalBrut: salairesFiltres.reduce((sum, s) => sum + (s['Salaire brut'] || 0), 0),
                    totalNet: salairesFiltres.reduce((sum, s) => sum + (s['Reste à payer'] || 0), 0),
                    dateGeneration: new Date().toISOString()
                }
            };
            res.json(resultatExport);
        }
        catch (error) {
            console.error('💥 Erreur export fiches paie:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'export des fiches de paie';
            res.status(500).json({
                success: false,
                message: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    getMonthName(month) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return months[month - 1] || 'Inconnu';
    }
    parseFloat(value, defaultValue = 0) {
        try {
            if (value === null || value === undefined)
                return defaultValue;
            if (typeof value === 'number')
                return value;
            const str = String(value).replace(/\s/g, '').replace(',', '.');
            return parseFloat(str) || defaultValue;
        }
        catch (_a) {
            return defaultValue;
        }
    }
    calculerJoursOuvrables(year, month) {
        try {
            const joursDansMois = new Date(year, month, 0).getDate();
            let joursOuvrables = 0;
            for (let jour = 1; jour <= joursDansMois; jour++) {
                const date = new Date(year, month - 1, jour);
                const jourSemaine = date.getDay();
                if (jourSemaine >= 1 && jourSemaine <= 5) {
                    joursOuvrables++;
                }
            }
            return Math.max(joursOuvrables, 1);
        }
        catch (error) {
            console.error('Erreur calcul jours ouvrables:', error);
            return 22;
        }
    }
    async genererPDFFichesPaie(salaires, year, month) {
        return Buffer.from('');
    }
}
exports.ColarysEmployeeController = ColarysEmployeeController;
exports.colarysEmployeeController = new ColarysEmployeeController();
