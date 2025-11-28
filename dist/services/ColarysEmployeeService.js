"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colarysEmployeeService = exports.ColarysEmployeeService = void 0;
const supabase_1 = require("../lib/supabase");
class ColarysEmployeeService {
    constructor() {
        console.log('🔧 ColarysEmployeeService initialisé avec Supabase');
    }
    parseFloat(s, defaultVal = 0.0) {
        try {
            if (s === null || s === undefined)
                return defaultVal;
            if (typeof s === 'number')
                return s;
            const str = String(s).replace(/\s/g, '').replace(',', '.');
            return parseFloat(str) || defaultVal;
        }
        catch (_a) {
            return defaultVal;
        }
    }
    parseInt(s, defaultVal = 0) {
        try {
            if (s === null || s === undefined)
                return defaultVal;
            if (typeof s === 'number')
                return Math.floor(s);
            const str = String(s).replace(/[^\d-]/g, '');
            return parseInt(str, 10) || defaultVal;
        }
        catch (_a) {
            return defaultVal;
        }
    }
    parseDateEmbauche(s) {
        if (!s)
            return null;
        const trimmed = s.trim();
        const formats = [
            { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, parts: [2, 1, 0] },
            { regex: /^(\d{4})-(\d{2})-(\d{2})$/, parts: [0, 1, 2] }
        ];
        for (const format of formats) {
            const match = trimmed.match(format.regex);
            if (match) {
                const day = parseInt(match[format.parts[2] + 1]);
                const month = parseInt(match[format.parts[1] + 1]);
                const year = parseInt(match[format.parts[0] + 1]);
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 1900) {
                    return new Date(year, month - 1, day);
                }
            }
        }
        return null;
    }
    calculAnciennete(dateEmbaucheStr) {
        const dateEmbauche = this.parseDateEmbauche(dateEmbaucheStr);
        if (!dateEmbauche)
            return "";
        const today = new Date();
        let years = today.getFullYear() - dateEmbauche.getFullYear();
        let months = today.getMonth() - dateEmbauche.getMonth();
        if (today.getDate() < dateEmbauche.getDate()) {
            months--;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} ans ${months} mois`;
    }
    calculDroitDepuisDate(dateEmbaucheStr) {
        const dateEmbauche = this.parseDateEmbauche(dateEmbaucheStr);
        if (!dateEmbauche)
            return 0;
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - dateEmbauche.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 365 ? 1 : 0;
    }
    calculAncienneteAns(dateEmbaucheStr) {
        const dateEmbauche = this.parseDateEmbauche(dateEmbaucheStr);
        if (!dateEmbauche)
            return 0;
        const today = new Date();
        let years = today.getFullYear() - dateEmbauche.getFullYear();
        const months = today.getMonth() - dateEmbauche.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < dateEmbauche.getDate())) {
            years--;
        }
        return years;
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
            console.log(`📅 Mois ${month}/${year}: ${joursOuvrables} jours ouvrables sur ${joursDansMois} jours`);
            return Math.max(joursOuvrables, 1);
        }
        catch (error) {
            console.error('❌ Erreur calcul jours ouvrables:', error);
            const joursParMois = {
                1: 22, 2: 20, 3: 23, 4: 21, 5: 22, 6: 22,
                7: 21, 8: 23, 9: 21, 10: 22, 11: 22, 12: 20
            };
            return joursParMois[month] || 22;
        }
    }
    calculHeuresPresence(matricule, year, month, presences) {
        var _a;
        const result = {
            presence: 0,
            conge: 0,
            ferie: 0,
            nuit: 0,
            formation: 0,
            absence: 0,
            joursFormation: 0,
            joursOff: 0,
            heuresTravailleesReelles: 0
        };
        const joursDansMois = new Date(year, month, 0).getDate();
        for (let jour = 1; jour <= joursDansMois; jour++) {
            const key = `${matricule}_${year}_${month}_${jour}`;
            const statut = (_a = presences[key]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            const heuresPlanifiees = 8;
            switch (statut) {
                case 'p':
                    result.presence += heuresPlanifiees;
                    result.heuresTravailleesReelles += heuresPlanifiees;
                    break;
                case 'n':
                    result.presence += heuresPlanifiees;
                    result.nuit += heuresPlanifiees;
                    result.heuresTravailleesReelles += heuresPlanifiees;
                    break;
                case 'a':
                    result.absence += heuresPlanifiees;
                    break;
                case 'c':
                    result.conge += heuresPlanifiees;
                    break;
                case 'm':
                    result.presence += heuresPlanifiees;
                    result.ferie += heuresPlanifiees;
                    result.heuresTravailleesReelles += heuresPlanifiees;
                    break;
                case 'f':
                    result.formation += heuresPlanifiees;
                    result.joursFormation += 1;
                    break;
                case 'o':
                    result.joursOff += 1;
                    break;
            }
        }
        return result;
    }
    async getAllEmployees() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('employees')
                .select('*')
                .order('Matricule');
            if (error) {
                console.error('❌ Erreur récupération employés:', error);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erreur récupération employés:', error);
            return [];
        }
    }
    async getEmployeeByMatricule(matricule) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('employees')
                .select('*')
                .eq('Matricule', matricule)
                .single();
            if (error) {
                console.error('❌ Erreur récupération employé:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('❌ Erreur récupération employé:', error);
            return null;
        }
    }
    async createEmployee(employeeData) {
        try {
            const { data: existing } = await supabase_1.supabase
                .from('employees')
                .select('Matricule')
                .eq('Matricule', employeeData.Matricule)
                .single();
            if (existing) {
                return { success: false, message: 'Un employé avec ce matricule existe déjà' };
            }
            const dateEmbauche = employeeData["Date d'embauche"];
            const anciennete = this.calculAnciennete(dateEmbauche);
            const droit = this.calculDroitDepuisDate(dateEmbauche);
            const soldeInitial = this.parseFloat(employeeData["Solde initial congé"], 0);
            const soldeConge = this.parseFloat(employeeData["Solde de congé"], -1);
            const nouvelEmploye = Object.assign(Object.assign({}, employeeData), { Ancienneté: anciennete, "droit ostie": droit.toString(), "droit transport et repas": droit.toString(), "Solde de congé": soldeConge < 0 ? soldeInitial.toString() : employeeData["Solde de congé"], created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            const { data, error } = await supabase_1.supabase
                .from('employees')
                .insert([nouvelEmploye])
                .select();
            if (error) {
                console.error('❌ Erreur création employé:', error);
                return { success: false, message: error.message };
            }
            return {
                success: true,
                message: 'Employé créé avec succès',
                matricule: employeeData.Matricule
            };
        }
        catch (error) {
            console.error('❌ Erreur création employé:', error);
            return { success: false, message: 'Erreur lors de la création' };
        }
    }
    async getEmployeePresenceForMonth(matricule, year, month) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('presences')
                .select('*')
                .eq('matricule', matricule)
                .eq('year', year)
                .eq('month', month)
                .order('day');
            if (error) {
                console.error('❌ Erreur récupération présences employé:', error);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erreur récupération présences employé:', error);
            return [];
        }
    }
    async updateEmployee(matricule, employeeData) {
        try {
            const { data: existing } = await supabase_1.supabase
                .from('employees')
                .select('Matricule')
                .eq('Matricule', matricule)
                .single();
            if (!existing) {
                return { success: false, message: 'Employé non trouvé' };
            }
            if (employeeData["Date d'embauche"]) {
                const anciennete = this.calculAnciennete(employeeData["Date d'embauche"]);
                const droit = this.calculDroitDepuisDate(employeeData["Date d'embauche"]);
                employeeData.Ancienneté = anciennete;
                employeeData["droit ostie"] = droit.toString();
                employeeData["droit transport et repas"] = droit.toString();
            }
            employeeData.updated_at = new Date().toISOString();
            const { error } = await supabase_1.supabase
                .from('employees')
                .update(employeeData)
                .eq('Matricule', matricule);
            if (error) {
                console.error('❌ Erreur modification employé:', error);
                return { success: false, message: error.message };
            }
            return { success: true, message: 'Employé modifié avec succès' };
        }
        catch (error) {
            console.error('❌ Erreur modification employé:', error);
            return { success: false, message: 'Erreur lors de la modification' };
        }
    }
    async deleteEmployee(matricule) {
        try {
            const { error } = await supabase_1.supabase
                .from('employees')
                .delete()
                .eq('Matricule', matricule);
            if (error) {
                console.error('❌ Erreur suppression employé:', error);
                return { success: false, message: error.message };
            }
            return { success: true, message: 'Employé supprimé avec succès' };
        }
        catch (error) {
            console.error('❌ Erreur suppression employé:', error);
            return { success: false, message: 'Erreur lors de la suppression' };
        }
    }
    async getPresences() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('presences')
                .select('*');
            if (error) {
                console.error('❌ Erreur récupération présences:', error);
                return {};
            }
            const presencesMap = {};
            data === null || data === void 0 ? void 0 : data.forEach(presence => {
                const key = `${presence.matricule}_${presence.year}_${presence.month}_${presence.day}`;
                presencesMap[key] = presence.type;
            });
            return presencesMap;
        }
        catch (error) {
            console.error('❌ Erreur récupération présences:', error);
            return {};
        }
    }
    async updatePresence(matricule, year, month, day, type) {
        try {
            const ALLOWED_PRESENCE_VALUES = new Set(["p", "n", "a", "c", "m", "f", "o"]);
            if (!ALLOWED_PRESENCE_VALUES.has(type) && type !== '') {
                return { success: false, message: 'Type de présence invalide' };
            }
            if (type === '') {
                const { error } = await supabase_1.supabase
                    .from('presences')
                    .delete()
                    .eq('matricule', matricule)
                    .eq('year', year)
                    .eq('month', month)
                    .eq('day', day);
                if (error) {
                    return { success: false, message: error.message };
                }
            }
            else {
                const { error } = await supabase_1.supabase
                    .from('presences')
                    .upsert({
                    matricule,
                    year,
                    month,
                    day,
                    type,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'matricule,year,month,day'
                });
                if (error) {
                    return { success: false, message: error.message };
                }
            }
            if (type === 'c') {
                await this.updateSoldeConge(matricule, -1);
            }
            return { success: true, message: 'Présence mise à jour avec succès' };
        }
        catch (error) {
            console.error('❌ Erreur mise à jour présence:', error);
            return { success: false, message: 'Erreur lors de la mise à jour' };
        }
    }
    async getMonthlyPresences(year, month) {
        try {
            const { data: presencesData, error } = await supabase_1.supabase
                .from('presences')
                .select('*')
                .eq('year', year)
                .eq('month', month);
            if (error) {
                console.error('❌ Erreur récupération présences mensuelles:', error);
                return { year, month, daysInMonth: 0, presences: {}, employees: [] };
            }
            const employees = await this.getAllEmployees();
            const daysInMonth = new Date(year, month, 0).getDate();
            const presences = {};
            presencesData === null || presencesData === void 0 ? void 0 : presencesData.forEach(presence => {
                const key = `${presence.matricule}_${presence.year}_${presence.month}_${presence.day}`;
                presences[key] = presence.type;
            });
            return {
                year,
                month,
                daysInMonth,
                presences,
                employees
            };
        }
        catch (error) {
            console.error('❌ Erreur récupération présences mensuelles:', error);
            return { year, month, daysInMonth: 0, presences: {}, employees: [] };
        }
    }
    async getSalaires() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('salaires')
                .select('*');
            if (error) {
                console.error('❌ Erreur récupération salaires:', error);
                return {};
            }
            const salairesMap = {};
            data === null || data === void 0 ? void 0 : data.forEach(salaire => {
                const key = `${salaire.matricule}_${salaire.year}_${salaire.month}`;
                salairesMap[key] = salaire;
            });
            return salairesMap;
        }
        catch (error) {
            console.error('❌ Erreur récupération salaires:', error);
            return {};
        }
    }
    async updateSalaire(matricule, year, month, salaireData) {
        try {
            const { error } = await supabase_1.supabase
                .from('salaires')
                .upsert(Object.assign(Object.assign({ matricule,
                year,
                month }, salaireData), { updated_at: new Date().toISOString() }), {
                onConflict: 'matricule,year,month'
            });
            if (error) {
                console.error('❌ Erreur mise à jour salaire:', error);
                return { success: false, message: error.message };
            }
            return { success: true, message: 'Salaire mis à jour avec succès' };
        }
        catch (error) {
            console.error('❌ Erreur mise à jour salaire:', error);
            return { success: false, message: 'Erreur lors de la mise à jour' };
        }
    }
    async updateSoldeConge(matricule, variation) {
        try {
            const { data: employee } = await supabase_1.supabase
                .from('employees')
                .select('"Solde de congé"')
                .eq('Matricule', matricule)
                .single();
            if (employee) {
                const soldeActuel = this.parseFloat(employee["Solde de congé"]);
                const nouveauSolde = Math.max(0, soldeActuel + variation);
                await supabase_1.supabase
                    .from('employees')
                    .update({
                    "Solde de congé": nouveauSolde.toString(),
                    updated_at: new Date().toISOString()
                })
                    .eq('Matricule', matricule);
            }
        }
        catch (error) {
            console.error('❌ Erreur mise à jour solde congé:', error);
        }
    }
    async updateCongesAutomatique() {
        try {
            const employees = await this.getAllEmployees();
            const today = new Date();
            for (const emp of employees) {
                const soldeCourant = this.parseFloat(emp["Solde de congé"] || emp["Solde initial congé"], 0);
                const lastUpdate = emp.last_update;
                let monthsPassed = 0;
                if (lastUpdate) {
                    const lastDate = new Date(lastUpdate);
                    monthsPassed = (today.getFullYear() - lastDate.getFullYear()) * 12 +
                        (today.getMonth() - lastDate.getMonth());
                }
                else {
                    monthsPassed = 3;
                }
                if (monthsPassed > 0) {
                    const nouveauSolde = (soldeCourant + 2.5 * monthsPassed).toFixed(1);
                    await supabase_1.supabase
                        .from('employees')
                        .update({
                        "Solde de congé": nouveauSolde,
                        updated_at: new Date().toISOString()
                    })
                        .eq('Matricule', emp.Matricule);
                }
            }
            console.log('✅ Mise à jour automatique des congés terminée');
        }
        catch (error) {
            console.error('❌ Erreur mise à jour congés automatique:', error);
        }
    }
    async calculateSalaires(year, month, joursTheoriques) {
        try {
            console.log(`🧮 Calcul des salaires pour ${month}/${year}, jours théoriques: ${joursTheoriques !== undefined ? joursTheoriques : 'auto'}`);
            const employees = await this.getAllEmployees();
            const presences = await this.getPresences();
            const salaireData = await this.getSalaires();
            let joursTravail = joursTheoriques;
            if (joursTravail === undefined || joursTravail === null || joursTravail <= 0) {
                joursTravail = this.calculerJoursOuvrables(year, month);
                console.log(`📅 Jours ouvrables calculés automatiquement: ${joursTravail} jours`);
            }
            console.log(`📊 Données chargées: ${employees.length} employés, ${Object.keys(presences).length} présences, ${joursTravail} jours travaillés`);
            const salairesCalcules = [];
            for (const employee of employees) {
                try {
                    if (!employee.Matricule) {
                        console.warn('❌ Employé sans matricule ignoré:', employee);
                        continue;
                    }
                    const matricule = employee.Matricule;
                    const salBase = this.parseFloat(employee['Salaire de base']) || 0;
                    const droitTR = this.calculDroitDepuisDate(employee["Date d'embauche"]);
                    const droitOSTIE = this.calculDroitDepuisDate(employee["Date d'embauche"]);
                    const ancienneteAns = this.calculAncienneteAns(employee["Date d'embauche"]);
                    const heures = this.calculHeuresPresence(matricule, year, month, presences);
                    const h_presence = heures.presence;
                    const h_conge = heures.conge;
                    const h_ferie = heures.ferie;
                    const h_nuit = heures.nuit;
                    const joursFormation = heures.joursFormation;
                    const heuresTravailleesReelles = heures.heuresTravailleesReelles;
                    const absences = heures.absence / 8;
                    const heuresTheoriquesMois = joursTravail * 8;
                    const tauxH = heuresTheoriquesMois > 0 ? salBase / heuresTheoriquesMois : 0;
                    const key = `${matricule}_${year}_${month}`;
                    const manual = salaireData[key] || {};
                    const primeProd = this.parseFloat(manual["Prime de production"]) || 0;
                    const primeAssid = this.parseFloat(manual["Prime d'assiduité"]) || 0;
                    const primeAnc = this.parseFloat(manual["Prime d'ancienneté"]) || 0;
                    const primeElite = this.parseFloat(manual["Prime élite"]) || 0;
                    const primeResp = this.parseFloat(manual["Prime de responsabilité"]) || 0;
                    const social = this.parseFloat(manual["Social"]) || 15000;
                    const avance = this.parseFloat(manual["Avance sur salaire"]) || 0;
                    const montantAbsenceDeduit = heures.absence * tauxH;
                    const montantTravaille = Math.max(0, salBase - montantAbsenceDeduit);
                    const majNuit = (h_nuit / 8) * 8000;
                    const majFerie = h_ferie * tauxH * 1.00;
                    const indemConge = h_conge * tauxH;
                    const indemFormation = joursFormation * 10000;
                    const joursPresenceArr = Math.round(heuresTravailleesReelles / 8);
                    const indemRepas = joursPresenceArr * 2500 * (droitTR ? 1 : 0);
                    const indemTransport = joursPresenceArr * 1200 * (droitTR ? 1 : 0);
                    const brut = montantTravaille + majNuit + majFerie + indemConge + indemFormation +
                        primeProd + primeAssid + primeAnc + primeElite + primeResp +
                        indemRepas + indemTransport;
                    let ostie = 0, cnaps = 0;
                    if (ancienneteAns >= 1 && droitOSTIE) {
                        ostie = brut * 0.01;
                        cnaps = brut * 0.01;
                    }
                    const base = Math.max(0, brut);
                    const tranche1 = Math.max(0, Math.min(base, 350000));
                    const tranche2 = Math.max(0, Math.min(base, 400000) - 350000);
                    const tranche3 = Math.max(0, Math.min(base, 500000) - 400000);
                    const tranche4 = Math.max(0, Math.min(base, 600000) - 500000);
                    const tranche5 = Math.max(0, base - 600000);
                    const rep1 = tranche1 * 0.00;
                    const rep2 = tranche2 * 0.05;
                    const rep3 = tranche3 * 0.10;
                    const rep4 = tranche4 * 0.15;
                    const rep5 = tranche5 * 0.20;
                    let repTotal = rep1 + rep2 + rep3 + rep4 + rep5;
                    if (repTotal === 0)
                        repTotal = 2000;
                    const igr = matricule ? repTotal * droitOSTIE : 0;
                    const resteAPayer = brut - (avance + ostie + cnaps + social + igr);
                    salairesCalcules.push({
                        Matricule: matricule,
                        Nom: employee.Nom || '',
                        Prénom: employee.Prénom || '',
                        Compagne: employee.Compagne || '',
                        'Salaire de base': Math.round(salBase),
                        'Taux horaire': Math.round(tauxH),
                        'Solde de congé': this.parseFloat(employee['Solde de congé']),
                        'Heures de présence': parseInt(h_presence.toString()),
                        'Heures travaillées réelles': parseInt(heuresTravailleesReelles.toString()),
                        'Heures de congé': parseInt(h_conge.toString()),
                        'Heures férié majoré': parseInt(h_ferie.toString()),
                        'Heures nuit majoré': parseInt(h_nuit.toString()),
                        'Jours absence': absences,
                        'Montant absence déduit': Math.round(montantAbsenceDeduit),
                        'Montant travaillé': Math.round(montantTravaille),
                        'Majoration de nuit': Math.round(majNuit),
                        'Majoration férié': Math.round(majFerie),
                        'Indemnité congé': Math.round(indemConge),
                        'Indemnité formation': Math.round(indemFormation),
                        'Prime de production': Math.round(primeProd),
                        'Prime d\'assiduité': Math.round(primeAssid),
                        'Prime d\'ancienneté': Math.round(primeAnc),
                        'Prime élite': Math.round(primeElite),
                        'Prime de responsabilité': Math.round(primeResp),
                        'Indemnité repas': Math.round(indemRepas),
                        'Indemnité transport': Math.round(indemTransport),
                        'Salaire brut': Math.round(brut),
                        'Avance sur salaire': Math.round(avance),
                        'OSTIE': Math.round(ostie),
                        'CNaPS': Math.round(cnaps),
                        'Social': Math.round(social),
                        'IGR': Math.round(igr),
                        'Reste à payer': Math.round(resteAPayer),
                        'Jours théoriques': joursTravail,
                        'Jours formation': joursFormation,
                        'Heures théoriques mois': heuresTheoriquesMois,
                        'Pourcentage présence': heuresTheoriquesMois > 0 ?
                            Math.round((heuresTravailleesReelles / heuresTheoriquesMois) * 100) : 0
                    });
                }
                catch (error) {
                    console.error(`❌ Erreur calcul salaire pour ${employee.Matricule}:`, error);
                }
            }
            console.log(`✅ Calcul terminé: ${salairesCalcules.length} salaires calculés avec ${joursTravail} jours`);
            return salairesCalcules;
        }
        catch (error) {
            console.error('💥 Erreur globale calcul salaires:', error);
            throw error;
        }
    }
}
exports.ColarysEmployeeService = ColarysEmployeeService;
exports.colarysEmployeeService = new ColarysEmployeeService();
