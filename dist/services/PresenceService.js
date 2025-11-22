"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Presence_1 = require("../entities/Presence");
const DetailPresence_1 = require("../entities/DetailPresence");
const Agent_1 = require("../entities/Agent");
const uuid_1 = require("uuid");
class PresenceService {
    constructor() {
        this.presenceRepository = data_source_1.AppDataSource.getRepository(Presence_1.Presence);
        this.agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
        this.detailPresenceRepository = data_source_1.AppDataSource.getRepository(DetailPresence_1.DetailPresence);
    }
    async pointageEntree(data) {
        var _a;
        console.log('pointageEntree dans PresenceService:', data);
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (!data.nom || !data.prenom) {
                throw new Error("Le nom et le prénom sont obligatoires");
            }
            let agent;
            let matriculeValue = ((_a = data.matricule) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (matriculeValue) {
                const existingAgent = await queryRunner.manager.findOne(Agent_1.Agent, {
                    where: { matricule: matriculeValue }
                });
                if (existingAgent) {
                    agent = existingAgent;
                    console.log('Agent existant trouvé:', agent);
                }
                else {
                    agent = new Agent_1.Agent();
                    agent.matricule = matriculeValue;
                    agent.nom = data.nom;
                    agent.prenom = data.prenom;
                    agent.campagne = data.campagne || "Standard";
                    agent.dateCreation = new Date();
                    agent = await queryRunner.manager.save(agent);
                    console.log('Nouvel agent créé avec matricule:', agent);
                }
            }
            else {
                const generatedMatricule = `AG-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
                console.log('Matricule généré:', generatedMatricule);
                agent = new Agent_1.Agent();
                agent.matricule = generatedMatricule;
                agent.nom = data.nom;
                agent.prenom = data.prenom;
                agent.campagne = data.campagne || "Standard";
                agent.dateCreation = new Date();
                agent = await queryRunner.manager.save(agent);
                console.log('Nouvel agent créé sans matricule fourni:', agent);
            }
            const today = new Date().toISOString().split('T')[0];
            const existingPresence = await queryRunner.manager.findOne(Presence_1.Presence, {
                where: {
                    agent: { id: agent.id },
                    date: today,
                },
                relations: ['details'],
            });
            if (existingPresence) {
                if (!existingPresence.heureSortie) {
                    throw new Error("Une présence pour aujourd'hui existe déjà. Veuillez pointer la sortie d'abord.");
                }
                else {
                    throw new Error("Vous avez déjà pointé l'entrée et la sortie aujourd'hui.");
                }
            }
            const heureEntree = data.heureEntreeManuelle || new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const presence = new Presence_1.Presence();
            presence.agent = agent;
            presence.date = today;
            presence.heureEntree = heureEntree;
            presence.shift = data.shift || "JOUR";
            presence.createdAt = new Date();
            const details = new DetailPresence_1.DetailPresence();
            details.signatureEntree = data.signatureEntree;
            details.presence = presence;
            const savedPresence = await queryRunner.manager.save(presence);
            details.presence = savedPresence;
            await queryRunner.manager.save(details);
            await queryRunner.commitTransaction();
            const completePresence = await this.presenceRepository.findOne({
                where: { id: savedPresence.id },
                relations: ['agent', 'details'],
            });
            return { presence: completePresence };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Erreur lors du pointage d\'entrée:', error);
            let errorMessage = 'Erreur inconnue lors du pointage d\'entrée';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            throw new Error(errorMessage);
        }
        finally {
            await queryRunner.release();
        }
    }
    async pointageSortie(matricule, signatureSortie, heureSortieManuelle) {
        console.log('pointageSortie dans PresenceService:', { matricule, signatureSortie, heureSortieManuelle });
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const today = new Date().toISOString().split('T')[0];
            const presence = await queryRunner.manager.findOne(Presence_1.Presence, {
                where: {
                    agent: { matricule },
                    date: today
                },
                relations: ['agent', 'details'],
            });
            if (!presence) {
                throw new Error("Aucune présence trouvée pour aujourd'hui");
            }
            if (presence.heureSortie) {
                throw new Error("Pointage de sortie déjà effectué");
            }
            const heureSortie = heureSortieManuelle
                ? this.validerFormatHeure(heureSortieManuelle)
                : new Date().toTimeString().split(' ')[0];
            presence.heureSortie = heureSortie;
            presence.heuresTravaillees = this.calculerHeuresTravaillees(presence.heureEntree, heureSortie);
            if (presence.details) {
                presence.details.signatureSortie = signatureSortie;
                await queryRunner.manager.save(DetailPresence_1.DetailPresence, presence.details);
            }
            else {
                const detailPresence = new DetailPresence_1.DetailPresence();
                detailPresence.signatureSortie = signatureSortie;
                detailPresence.presence = presence;
                await queryRunner.manager.save(detailPresence);
                presence.details = detailPresence;
            }
            await queryRunner.manager.save(Presence_1.Presence, presence);
            await queryRunner.commitTransaction();
            const completePresence = await this.presenceRepository.findOne({
                where: { id: presence.id },
                relations: ['agent', 'details'],
            });
            return { success: true, presence: completePresence };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Erreur dans pointageSortie:', error);
            let errorMessage = 'Erreur inconnue lors du pointage de sortie';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            throw new Error(errorMessage);
        }
        finally {
            await queryRunner.release();
        }
    }
    validerFormatHeure(heure) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!regex.test(heure)) {
            throw new Error('Format d\'heure invalide. Utilisez HH:MM');
        }
        return heure + ':00';
    }
    calculerHeuresTravaillees(heureEntree, heureSortie) {
        return 8.00;
    }
    async getPresenceAujourdhuiByMatricule(matricule) {
        console.log('getPresenceAujourdhuiByMatricule dans PresenceService:', matricule);
        try {
            const today = new Date().toISOString().split('T')[0];
            const presence = await this.presenceRepository.findOne({
                where: {
                    agent: { matricule },
                    date: today
                },
                relations: ['agent', 'details'],
            });
            return { success: true, data: presence };
        }
        catch (error) {
            console.error('Erreur dans getPresenceAujourdhuiByMatricule:', error);
            let errorMessage = 'Erreur inconnue lors de la recherche de présence';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            return { success: false, error: errorMessage };
        }
    }
    async getPresenceAujourdhuiByNomPrenom(nom, prenom) {
        console.log('getPresenceAujourdhuiByNomPrenom dans PresenceService:', { nom, prenom });
        try {
            const today = new Date().toISOString().split('T')[0];
            const presence = await this.presenceRepository.findOne({
                where: {
                    agent: { nom, prenom },
                    date: today
                },
                relations: ['agent', 'details'],
            });
            return { success: true, data: presence };
        }
        catch (error) {
            console.error('Erreur dans getPresenceAujourdhuiByNomPrenom:', error);
            let errorMessage = 'Erreur inconnue lors de la recherche de présence';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            return { success: false, error: errorMessage };
        }
    }
    getLastDayOfMonth(annee, mois) {
        const year = parseInt(annee);
        const month = mois ? parseInt(mois) : 12;
        const lastDay = new Date(year, month, 0).getDate();
        return `${annee}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    }
    async getHistoriquePresences(filters) {
        console.log('getHistoriquePresences avec filtres:', filters);
        try {
            const queryBuilder = this.presenceRepository.createQueryBuilder('presence')
                .leftJoinAndSelect('presence.agent', 'agent')
                .leftJoinAndSelect('presence.details', 'details');
            const whereConditions = [];
            const parameters = {};
            if (filters.dateDebut && filters.dateFin) {
                whereConditions.push('presence.date BETWEEN :dateDebut AND :dateFin');
                parameters.dateDebut = filters.dateDebut;
                parameters.dateFin = filters.dateFin;
            }
            else if (filters.annee) {
                const startDate = `${filters.annee}-${filters.mois || '01'}-01`;
                const endDate = this.getLastDayOfMonth(filters.annee, filters.mois);
                whereConditions.push('presence.date BETWEEN :startDate AND :endDate');
                parameters.startDate = startDate;
                parameters.endDate = endDate;
            }
            else {
                throw new Error('Période non spécifiée');
            }
            if (filters.matricule) {
                whereConditions.push('agent.matricule = :matricule');
                parameters.matricule = filters.matricule;
            }
            if (filters.nom) {
                whereConditions.push('agent.nom ILIKE :nom');
                parameters.nom = `%${filters.nom}%`;
            }
            if (filters.prenom) {
                whereConditions.push('agent.prenom ILIKE :prenom');
                parameters.prenom = `%${filters.prenom}%`;
            }
            if (filters.campagne) {
                whereConditions.push('agent.campagne = :campagne');
                parameters.campagne = filters.campagne;
            }
            if (filters.shift) {
                whereConditions.push('presence.shift = :shift');
                parameters.shift = filters.shift;
            }
            if (filters.nom) {
                await this.debugAgentsByNom(filters.nom);
            }
            console.log('Conditions de recherche:', whereConditions);
            console.log('Paramètres:', parameters);
            if (whereConditions.length > 0) {
                queryBuilder.where(whereConditions.join(' AND '), parameters);
            }
            queryBuilder.orderBy('presence.date', 'DESC')
                .addOrderBy('agent.nom', 'ASC')
                .addOrderBy('agent.prenom', 'ASC');
            const presences = await queryBuilder.getMany();
            console.log(`✅ ${presences.length} présence(s) trouvée(s) avec les filtres appliqués`);
            const presencesAvecTypesCorrects = presences.map(presence => (Object.assign(Object.assign({}, presence), { heuresTravaillees: presence.heuresTravaillees != null ? Number(presence.heuresTravaillees) : null })));
            const totalHeures = presencesAvecTypesCorrects.reduce((sum, presence) => {
                return sum + (presence.heuresTravaillees != null ? presence.heuresTravaillees : 0);
            }, 0);
            return {
                data: presencesAvecTypesCorrects,
                totalHeures,
                totalPresences: presencesAvecTypesCorrects.length,
            };
        }
        catch (error) {
            console.error('Erreur dans getHistoriquePresences:', error);
            let errorMessage = 'Erreur inconnue lors de la récupération de l\'historique';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            throw new Error(errorMessage);
        }
    }
    async debugAgentsByNom(nom) {
        try {
            const agents = await this.agentRepository.find({
                where: {
                    nom: (0, typeorm_1.Like)(`%${nom}%`)
                }
            });
            console.log(`🔍 Agents trouvés avec le nom "${nom}":`, agents);
            return agents;
        }
        catch (error) {
            console.error('Erreur lors du débogage des agents:', error);
            return [];
        }
    }
    async verifierDonnees() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const count = await this.presenceRepository.count({
                where: { date: today }
            });
            console.log(`Nombre de présences aujourd'hui (${today}): ${count}`);
            const allPresences = await this.presenceRepository.find({
                relations: ['agent', 'details'],
                take: 5
            });
            console.log('Dernières présences:', allPresences);
            return count;
        }
        catch (error) {
            console.error('Erreur de vérification:', error);
        }
    }
    async generatePDF(presences, totalHeures, totalPresences) {
        var _a, _b;
        try {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
            if (!presences) {
                throw new Error('Aucune donnée de présence à exporter');
            }
            doc.lineWidth(0.5);
            doc.fontSize(16).text('Rapport des Présences - Colarys Concept', 30, 30);
            doc.fontSize(10);
            doc.text(`Calculé le: ${new Date().toLocaleDateString('fr-FR')}`, 30, 60);
            doc.text(`Total des présences: ${totalPresences}`, 30, 75);
            doc.text(`Total des heures travaillées: ${totalHeures}h`, 30, 90);
            const columns = [
                { start: 30, width: 60, align: 'center' },
                { start: 90, width: 70, align: 'center' },
                { start: 160, width: 120, align: 'center' },
                { start: 280, width: 50, align: 'center' },
                { start: 330, width: 50, align: 'center' },
                { start: 380, width: 50, align: 'center' },
                { start: 430, width: 40, align: 'center' },
                { start: 470, width: 60, align: 'center' },
                { start: 530, width: 50, align: 'center' },
                { start: 580, width: 50, align: 'center' }
            ];
            const verticalPositions = columns.map(col => col.start).concat(columns[columns.length - 1].start + columns[columns.length - 1].width);
            let y = 120;
            const rowHeight = 25;
            const fontSize = 8;
            const drawCenteredText = (text, x, y, width, height, align = 'center') => {
                doc.fontSize(fontSize);
                const textHeight = doc.heightOfString(text, {
                    width: width - 4,
                    align: align
                });
                const centeredY = y + (height - textHeight) / 2;
                doc.text(text, x + 2, centeredY, {
                    width: width - 4,
                    align: align,
                    lineGap: 1
                });
            };
            const drawHeader = () => {
                const headerY = y;
                const headerHeight = 25;
                doc.moveTo(verticalPositions[0], headerY).lineTo(verticalPositions[verticalPositions.length - 1], headerY).stroke();
                verticalPositions.forEach(pos => {
                    doc.moveTo(pos, headerY).lineTo(pos, headerY + headerHeight).stroke();
                });
                doc.fontSize(7).font('Helvetica-Bold');
                const headerTextY = headerY + (headerHeight - 7) / 2;
                doc.text('Date', columns[0].start, headerTextY, { width: columns[0].width, align: 'center' });
                doc.text('Matricule', columns[1].start, headerTextY, { width: columns[1].width, align: 'center' });
                doc.text('Nom', columns[2].start, headerTextY, { width: columns[2].width, align: 'center' });
                doc.text('Entrée', columns[3].start, headerTextY, { width: columns[3].width, align: 'center' });
                doc.text('Sortie', columns[4].start, headerTextY, { width: columns[4].width, align: 'center' });
                doc.text('Heures', columns[5].start, headerTextY, { width: columns[5].width, align: 'center' });
                doc.text('Shift', columns[6].start, headerTextY, { width: columns[6].width, align: 'center' });
                doc.text('Campagne', columns[7].start, headerTextY, { width: columns[7].width, align: 'center' });
                doc.text('Sig. Entrée', columns[8].start, headerTextY, { width: columns[8].width, align: 'center' });
                doc.text('Sig. Sortie', columns[9].start, headerTextY, { width: columns[9].width, align: 'center' });
                doc.moveTo(verticalPositions[0], headerY + headerHeight).lineTo(verticalPositions[verticalPositions.length - 1], headerY + headerHeight).stroke();
                y += headerHeight;
            };
            drawHeader();
            doc.font('Helvetica');
            for (const presence of presences) {
                if (y > 500) {
                    doc.addPage();
                    y = 30;
                    drawHeader();
                    doc.font('Helvetica');
                }
                const rowStartY = y;
                const dateFormatee = new Date(presence.date).toLocaleDateString('fr-FR');
                const heuresTravaillees = presence.heuresTravaillees ?
                    `${Number(presence.heuresTravaillees).toFixed(2)}h` : '-';
                const nomComplet = `${presence.agent.nom} ${presence.agent.prenom}`;
                verticalPositions.forEach(pos => {
                    doc.moveTo(pos, rowStartY).lineTo(pos, rowStartY + rowHeight).stroke();
                });
                doc.fontSize(fontSize);
                drawCenteredText(dateFormatee, columns[0].start, rowStartY, columns[0].width, rowHeight, 'center');
                drawCenteredText(presence.agent.matricule || 'N/D', columns[1].start, rowStartY, columns[1].width, rowHeight, 'center');
                const nomCompletTronque = doc.heightOfString(nomComplet, { width: columns[2].width - 4 }) > rowHeight ?
                    presence.agent.nom + ' ' + presence.agent.prenom.substring(0, 1) + '.' :
                    nomComplet;
                drawCenteredText(nomCompletTronque, columns[2].start, rowStartY, columns[2].width, rowHeight, 'center');
                drawCenteredText(presence.heureEntree, columns[3].start, rowStartY, columns[3].width, rowHeight, 'center');
                drawCenteredText(presence.heureSortie || '-', columns[4].start, rowStartY, columns[4].width, rowHeight, 'center');
                drawCenteredText(heuresTravaillees, columns[5].start, rowStartY, columns[5].width, rowHeight, 'center');
                drawCenteredText(presence.shift, columns[6].start, rowStartY, columns[6].width, rowHeight, 'center');
                drawCenteredText(presence.agent.campagne, columns[7].start, rowStartY, columns[7].width, rowHeight, 'center');
                const signatureHeight = 20;
                const signatureY = rowStartY + (rowHeight - signatureHeight) / 2;
                try {
                    if ((_a = presence.details) === null || _a === void 0 ? void 0 : _a.signatureEntree) {
                        console.log('📝 Signature entrée trouvée pour:', nomComplet);
                        doc.image(presence.details.signatureEntree, columns[8].start + (columns[8].width - 40) / 2, signatureY, {
                            width: 40,
                            height: signatureHeight,
                            fit: [40, signatureHeight],
                            align: 'center',
                            valign: 'center'
                        });
                    }
                    else {
                        drawCenteredText('-', columns[8].start, rowStartY, columns[8].width, rowHeight, 'center');
                    }
                }
                catch (error) {
                    console.error('❌ Erreur signature entrée:', error);
                    drawCenteredText('Erreur', columns[8].start, rowStartY, columns[8].width, rowHeight, 'center');
                }
                try {
                    if ((_b = presence.details) === null || _b === void 0 ? void 0 : _b.signatureSortie) {
                        console.log('📝 Signature sortie trouvée pour:', nomComplet);
                        doc.image(presence.details.signatureSortie, columns[9].start + (columns[9].width - 40) / 2, signatureY, {
                            width: 40,
                            height: signatureHeight,
                            fit: [40, signatureHeight],
                            align: 'center',
                            valign: 'center'
                        });
                    }
                    else {
                        drawCenteredText('-', columns[9].start, rowStartY, columns[9].width, rowHeight, 'center');
                    }
                }
                catch (error) {
                    console.error('❌ Erreur signature sortie:', error);
                    drawCenteredText('Erreur', columns[9].start, rowStartY, columns[9].width, rowHeight, 'center');
                }
                doc.moveTo(verticalPositions[0], rowStartY + rowHeight).lineTo(verticalPositions[verticalPositions.length - 1], rowStartY + rowHeight).stroke();
                y += rowHeight;
            }
            if (y > 500 - 20) {
                doc.addPage();
                y = 30;
            }
            y += 10;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text(`TOTAL GÉNÉRAL: ${totalHeures} heures travaillées`, 30, y);
            return new Promise((resolve, reject) => {
                try {
                    const chunks = [];
                    doc.on('data', (chunk) => chunks.push(chunk));
                    doc.on('end', () => resolve(Buffer.concat(chunks)));
                    doc.on('error', reject);
                    doc.end();
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        catch (error) {
            console.error('Erreur dans generatePDF:', error);
            let errorMessage = 'Erreur inconnue lors de la génération du PDF';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            throw new Error(errorMessage);
        }
    }
}
exports.PresenceService = PresenceService;
