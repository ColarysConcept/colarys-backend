"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningController = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const XLSX = __importStar(require("xlsx"));
const Planning_1 = require("../entities/Planning");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class PlanningController {
    static getISOWeek(date) {
        if (isNaN(date.getTime()))
            return 1;
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }
    static extractWeekNumber(weekInfo) {
        try {
            const dateMatch = weekInfo.match(/(\d{2}\/\d{2}\/\d{2})/);
            if (!dateMatch) {
                console.error('Format de date invalide dans weekInfo:', weekInfo);
                throw new Error('Format de date invalide');
            }
            const [day, month, shortYear] = dateMatch[1].split('/').map(Number);
            const year = shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear;
            const startDate = new Date(year, month - 1, day);
            if (isNaN(startDate.getTime())) {
                console.error('Date invalide:', dateMatch[1]);
                throw new Error('Date invalide');
            }
            const monday = new Date(startDate);
            monday.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);
            const weekNum = this.getISOWeek(monday);
            const result = `${year}-W${weekNum.toString().padStart(2, '0')}`;
            console.log(`Semaine calculée: ${result} pour ${weekInfo}`);
            return result;
        }
        catch (error) {
            console.error('Erreur extractWeekNumber:', error, 'weekInfo:', weekInfo);
            throw new Error('Impossible d\'extraire le numéro de semaine');
        }
    }
    static extractYearFromWeek(weekInfo) {
        try {
            const yearMatch = weekInfo.match(/(\d{2}\/\d{2}\/\d{2})/);
            if (yearMatch) {
                const shortYear = parseInt(yearMatch[1].split('/')[2]);
                return (shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear).toString();
            }
            return new Date().getFullYear().toString();
        }
        catch (error) {
            console.error('Erreur extractYearFromWeek:', error, 'weekInfo:', weekInfo);
            return new Date().getFullYear().toString();
        }
    }
    static calculateDate(week, dayIndex, year) {
        try {
            const [, weekNum] = week.split('-W');
            const weekNumber = parseInt(weekNum);
            const yearNumber = parseInt(year);
            const simple = new Date(yearNumber, 0, 1 + (weekNumber - 1) * 7);
            const dow = simple.getDay();
            const ISOweekStart = new Date(simple);
            if (dow <= 4) {
                ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            }
            else {
                ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
            }
            ISOweekStart.setDate(ISOweekStart.getDate() + dayIndex);
            return ISOweekStart;
        }
        catch (error) {
            console.error('Erreur calculateDate:', error);
            return new Date();
        }
    }
    static parseMultiMonthExcel(file) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const plannings = [];
        const weeks = [];
        const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
        workbook.SheetNames.forEach(sheetName => {
            var _a, _b, _c, _d, _e, _f, _g;
            if (!sheetName || ['Octobre', 'Novembre', 'Decembre'].includes(sheetName)) {
                console.log(`Ignorer feuille: ${sheetName}`);
                return;
            }
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const headerRow = rawData.find(row => row[0] === 'PRENOMS') || [];
            const hasManrdiTypo = headerRow[2] === 'MANRDI';
            let currentWeek = '';
            let currentYear = '2025';
            let agentOrder = 0;
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                if (row[0] && typeof row[0] === 'string' && row[0].includes('Semaine du')) {
                    const weekInfo = row[0];
                    try {
                        currentWeek = this.extractWeekNumber(weekInfo);
                        currentYear = this.extractYearFromWeek(weekInfo);
                        if (!weeks.includes(currentWeek)) {
                            weeks.push(currentWeek);
                        }
                        agentOrder = 0;
                        console.log(`Feuille: ${sheetName}, Semaine extraite: ${currentWeek}, Année: ${currentYear}`);
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.warn(`Erreur lors de l'extraction de la semaine: ${errorMessage}`);
                        currentWeek = currentWeek || `${new Date().getFullYear()}-W01`;
                    }
                    continue;
                }
                if (!row[0] || row[0] === 'PRENOMS' || row[0] === 'EMPLOI DU TEMPS' || typeof row[0] !== 'string') {
                    continue;
                }
                const agentName = row[0].trim();
                if (agentName && agentName !== '' && !agentName.includes('Semaine du')) {
                    const days = daysOfWeek.map((day, index) => {
                        const columnIndex = hasManrdiTypo && day === 'MARDI' ? index + 1 : index + 1;
                        const shiftRaw = row[columnIndex] || 'OFF';
                        const shift = shiftRaw.toUpperCase().replace(/\s+/g, '');
                        let date;
                        try {
                            date = this.calculateDate(currentWeek, index, currentYear);
                            if (isNaN(date.getTime())) {
                                throw new Error('Invalid date');
                            }
                        }
                        catch (error) {
                            console.error(`Date invalide pour la semaine ${currentWeek}, jour ${index}:`, error);
                            date = new Date();
                        }
                        return {
                            fullDate: date.toISOString().split('T')[0],
                            name: day.substring(0, 3),
                            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                            shift,
                            hours: Planning_1.SHIFT_HOURS_MAP[shift] || 0,
                            day,
                            remarques: row[8] || null,
                        };
                    }).filter(Boolean);
                    const monthsInWeek = [...new Set(days.map(d => d.fullDate.substring(5, 7)))].filter(m => m);
                    const totalHours = days.reduce((sum, d) => sum + d.hours, 0);
                    plannings.push({
                        agent_name: agentName,
                        semaine: currentWeek || `${currentYear}-W01`,
                        year: currentYear,
                        month: monthsInWeek.length > 0 ? monthsInWeek : [sheetName.toLowerCase()],
                        days,
                        total_heures: totalHours,
                        remarques: row[8] || null,
                        lundi: ((_a = days[0]) === null || _a === void 0 ? void 0 : _a.shift) || 'OFF',
                        mardi: ((_b = days[1]) === null || _b === void 0 ? void 0 : _b.shift) || 'OFF',
                        mercredi: ((_c = days[2]) === null || _c === void 0 ? void 0 : _c.shift) || 'OFF',
                        jeudi: ((_d = days[3]) === null || _d === void 0 ? void 0 : _d.shift) || 'OFF',
                        vendredi: ((_e = days[4]) === null || _e === void 0 ? void 0 : _e.shift) || 'OFF',
                        samedi: ((_f = days[5]) === null || _f === void 0 ? void 0 : _f.shift) || 'OFF',
                        dimanche: ((_g = days[6]) === null || _g === void 0 ? void 0 : _g.shift) || 'OFF',
                    });
                }
            }
        });
        return {
            count: plannings.length,
            weeks,
            message: 'Fichier Excel multi-mois parsé avec succès',
            data: plannings,
        };
    }
    static async uploadPlanning(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Aucun fichier fourni' });
            }
            console.log('Fichier reçu:', req.file.originalname);
            const result = PlanningController.parseMultiMonthExcel(req.file);
            console.log('Données parsées:', {
                count: result.count,
                weeks: result.weeks,
                sample: result.data.length > 0 ? result.data[0] : 'Aucune donnée'
            });
            const { error } = await supabase
                .from('plannings')
                .upsert(result.data, {
                onConflict: 'agent_name,semaine',
                ignoreDuplicates: false
            });
            if (error) {
                console.error('Erreur Supabase:', error);
                throw error;
            }
            res.status(200).json({
                message: result.message,
                count: result.count,
                weeks: result.weeks,
                data: result.data,
            });
        }
        catch (error) {
            console.error('Erreur dans uploadPlanning:', error);
            res.status(500).json({
                error: error.message || 'Erreur lors de l\'upload du planning',
                details: error.details || 'Aucun détail supplémentaire'
            });
        }
    }
    static async getPlannings(req, res) {
        try {
            const { searchQuery, selectedFilter, selectedYear, selectedMonth, selectedWeek } = req.query;
            console.log('Filtres reçus dans getPlannings:', { searchQuery, selectedFilter, selectedYear, selectedMonth, selectedWeek });
            let query = supabase.from('plannings').select('*');
            if (searchQuery && searchQuery !== 'all') {
                query = query.ilike('agent_name', `%${searchQuery}%`);
            }
            if (selectedYear && selectedYear !== 'all') {
                query = query.eq('year', selectedYear);
            }
            if (selectedMonth && selectedMonth !== 'all') {
                query = query.contains('month', [selectedMonth]);
            }
            if (selectedWeek && selectedWeek !== 'all') {
                query = query.eq('semaine', selectedWeek);
            }
            if (selectedFilter && selectedFilter !== 'all') {
                query = query.or(`lundi.ilike.%${selectedFilter}%,mardi.ilike.%${selectedFilter}%,mercredi.ilike.%${selectedFilter}%,jeudi.ilike.%${selectedFilter}%,vendredi.ilike.%${selectedFilter}%,samedi.ilike.%${selectedFilter}%,dimanche.ilike.%${selectedFilter}%`);
            }
            query = query.order('semaine', { ascending: true });
            const { data, error, count } = await query;
            if (error)
                throw error;
            console.log('Résultats filtrés Supabase:', { count, sample: data === null || data === void 0 ? void 0 : data[0] });
            res.json(data || []);
        }
        catch (error) {
            console.error('Erreur getPlannings:', error);
            res.status(500).json([]);
        }
    }
    static async getAvailableYears(_req, res) {
        try {
            const { data, error } = await supabase
                .from('plannings')
                .select('year')
                .order('year');
            if (error)
                throw error;
            const years = [...new Set(data === null || data === void 0 ? void 0 : data.map(item => item.year).filter(Boolean))];
            console.log('Années disponibles:', years);
            res.json(years);
        }
        catch (error) {
            console.error('Erreur getAvailableYears:', error);
            res.json([new Date().getFullYear().toString()]);
        }
    }
    static async getAvailableMonths(_req, res) {
        try {
            const { data, error } = await supabase
                .from('plannings')
                .select('month');
            if (error)
                throw error;
            const allMonths = (data === null || data === void 0 ? void 0 : data.flatMap(item => item.month || [])) || [];
            const uniqueMonths = [...new Set(allMonths)].sort();
            res.json(uniqueMonths);
        }
        catch (error) {
            console.error('Erreur getAvailableMonths:', error);
            res.json(Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')));
        }
    }
    static async getAvailableWeeks(_req, res) {
        try {
            const { data, error } = await supabase
                .from('plannings')
                .select('semaine')
                .order('semaine');
            if (error)
                throw error;
            const weeks = [...new Set(data === null || data === void 0 ? void 0 : data.map(item => item.semaine))];
            res.json(weeks);
        }
        catch (error) {
            console.error('Erreur getAvailableWeeks:', error);
            res.json([]);
        }
    }
    static async getAvailableAgents(_req, res) {
        try {
            const { data, error } = await supabase
                .from('plannings')
                .select('agent_name')
                .order('agent_name');
            if (error)
                throw error;
            const agents = [...new Set(data === null || data === void 0 ? void 0 : data.map(item => item.agent_name))];
            res.json(agents);
        }
        catch (error) {
            console.error('Erreur getAvailableAgents:', error);
            res.json([]);
        }
    }
    static async getStats(req, res) {
        try {
            const { searchQuery, selectedFilter, selectedYear, selectedMonth, selectedWeek } = req.query;
            console.log('Filtres reçus dans getStats:', { searchQuery, selectedFilter, selectedYear, selectedMonth, selectedWeek });
            let query = supabase.from('plannings').select('agent_name, days, total_heures');
            if (searchQuery) {
                query = query.ilike('agent_name', `%${searchQuery}%`);
            }
            if (selectedYear && selectedYear !== 'all') {
                query = query.eq('year', selectedYear);
            }
            if (selectedMonth && selectedMonth !== 'all') {
                query = query.contains('month', [selectedMonth]);
            }
            if (selectedWeek && selectedWeek !== 'all') {
                query = query.eq('semaine', selectedWeek);
            }
            if (selectedFilter && selectedFilter !== 'all') {
                query = query.or(`lundi.ilike.%${selectedFilter}%,mardi.ilike.%${selectedFilter}%,mercredi.ilike.%${selectedFilter}%,jeudi.ilike.%${selectedFilter}%,vendredi.ilike.%${selectedFilter}%,samedi.ilike.%${selectedFilter}%,dimanche.ilike.%${selectedFilter}%`);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            const uniqueAgents = new Set();
            let totalHours = 0;
            let presentCount = 0;
            let absentCount = 0;
            let dayShiftCount = 0;
            let nightShiftCount = 0;
            const shiftCounts = {};
            data === null || data === void 0 ? void 0 : data.forEach((p) => {
                uniqueAgents.add(p.agent_name);
                totalHours += p.total_heures || 0;
            });
            data === null || data === void 0 ? void 0 : data.forEach((p) => {
                var _a, _b;
                const hasWorkDay = (_a = p.days) === null || _a === void 0 ? void 0 : _a.some((d) => d.shift !== 'OFF' && d.shift !== 'CONGE' && d.shift !== '-' && d.shift !== 'FORMATION');
                if (hasWorkDay) {
                    presentCount++;
                }
                else {
                    absentCount++;
                }
                (_b = p.days) === null || _b === void 0 ? void 0 : _b.forEach((d) => {
                    if (['JOUR', 'MAT5', 'MAT8', 'MAT9'].includes(d.shift)) {
                        dayShiftCount++;
                    }
                    if (d.shift === 'NUIT') {
                        nightShiftCount++;
                    }
                    shiftCounts[d.shift] = (shiftCounts[d.shift] || 0) + 1;
                });
            });
            const totalUniqueAgents = uniqueAgents.size;
            const avgHours = totalUniqueAgents > 0 ? totalHours / totalUniqueAgents : 0;
            const stats = {
                totalAgents: totalUniqueAgents,
                totalHours,
                avgHours,
                present: presentCount,
                absent: absentCount,
                dayShift: dayShiftCount,
                nightShift: nightShiftCount,
                shiftCounts,
            };
            console.log('Stats calculées (agents uniques):', stats);
            res.json(stats);
        }
        catch (error) {
            console.error('Erreur getStats:', error);
            res.status(500).json({
                totalAgents: 0,
                totalHours: 0,
                avgHours: 0,
                present: 0,
                absent: 0,
                dayShift: 0,
                nightShift: 0,
                shiftCounts: {},
            });
        }
    }
    static async deleteAllPlannings(_req, res) {
        try {
            const { error, count } = await supabase.from('plannings').delete({ count: 'exact' });
            if (error)
                throw error;
            res.status(200).json({
                message: `Tous les plannings ont été supprimés avec succès (${count} lignes supprimées)`,
                count: count || 0,
            });
        }
        catch (error) {
            console.error('Erreur dans deleteAllPlannings:', error);
            res.status(500).json({
                error: error.message || 'Erreur lors de la suppression des plannings',
            });
        }
    }
}
exports.PlanningController = PlanningController;
