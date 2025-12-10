// backend/src/services/PresenceService.ts
// VERSION FINALE SANS SIGNATURE — 2025

import { Repository, Like } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Presence } from '../entities/Presence';
import { Agent } from '../entities/Agent';

interface HistoriqueFilters {
  dateDebut?: string;
  dateFin?: string;
  matricule?: string;
  nom?: string;
  prenom?: string;
  annee?: string;
  mois?: string;
  campagne?: string;
  shift?: string;
}

export class PresenceService {
  private presenceRepo: Repository<Presence>;
  private agentRepo: Repository<Agent>;

  constructor() {
    this.presenceRepo = AppDataSource.getRepository(Presence);
    this.agentRepo = AppDataSource.getRepository(Agent);
  }

  // ──────────────────────────────────────────────────────────────
  // POINTAGE D'ENTRÉE
  // ──────────────────────────────────────────────────────────────
 async pointageEntree(data: {
  matricule?: string;
  nom: string;
  prenom: string;
  campagne?: string;
  shift?: string;
  heureEntreeManuelle?: string;
  signatureEntree?: string; // ✅ NOUVEAU
}) {
  const today = new Date().toISOString().split('T')[0];
  const heure = data.heureEntreeManuelle || new Date().toTimeString().slice(0, 8);

    // Recherche ou création de l'agent
    let agent = data.matricule
      ? await this.agentRepo.findOne({ where: { matricule: data.matricule } })
      : await this.agentRepo.findOne({
          where: { nom: data.nom.trim(), prenom: data.prenom.trim() },
        });

    if (!agent) {
      agent = this.agentRepo.create({
        matricule: data.matricule || null,
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        campagne: data.campagne || 'Standard',
      });
      await this.agentRepo.save(agent);
    }

    // Vérifier qu'il n'y a pas déjà une entrée aujourd'hui
    const dejaPointe = await this.presenceRepo.findOne({
      where: { agent: { id: agent.id }, date: today },
    });

    if (dejaPointe) {
      throw new Error("Entrée déjà pointée aujourd'hui");
    }

     const presence = this.presenceRepo.create({
    agent,
    date: today,
    heureEntree: heure,
    shift: data.shift || 'JOUR',
    signatureEntree: data.signatureEntree || null, // ✅ STOCKAGE SIGNATURE ENTREE
  });


    await this.presenceRepo.save(presence);
    return { presence };
  }

  // ──────────────────────────────────────────────────────────────
  // POINTAGE DE SORTIE
  // ──────────────────────────────────────────────────────────────
async pointageSortie(
  matricule: string, 
  signatureSortie: string, // ✅ OBLIGATOIRE MAINTENANT
  heureSortieManuelle?: string
) {
  const today = new Date().toISOString().split('T')[0];
  const heure = heureSortieManuelle || new Date().toTimeString().slice(0, 8);

  const agent = await this.agentRepo.findOne({ where: { matricule } });
  if (!agent) throw new Error('Agent non trouvé');

  const presence = await this.presenceRepo.findOne({
    where: { agent: { id: agent.id }, date: today, heureSortie: null },
  });

  if (!presence) throw new Error("Aucune entrée pointée aujourd'hui");

  // ✅ METTRE À JOUR AVEC LA SIGNATURE
  presence.heureSortie = heure;
  presence.signatureSortie = signatureSortie; // IMPORTANT !
  presence.heuresTravaillees = 8.0;

  await this.presenceRepo.save(presence);
  return { presence };
}

async getPresenceById(id: number): Promise<Presence | null> {
  try {
    return await this.presenceRepo.findOne({
      where: { id },
      relations: ['agent'],
    });
  } catch (error) {
    console.error('Erreur récupération présence par ID:', error);
    return null;
  }
}


// OU version plus complète avec vérification
async getPresenceWithSignature(id: number, signatureType?: 'entree' | 'sortie') {
  const presence = await this.presenceRepo.findOne({
    where: { id },
    relations: ['agent'],
    select: [
      'id',
      'date',
      'heureEntree',
      'heureSortie',
      'signatureEntree',    // Inclure explicitement
      'signatureSortie',    // Inclure explicitement
      'shift',
      'heuresTravaillees',
      'createdAt',
    ],
  });

  if (!presence) {
    throw new Error('Présence non trouvée');
  }

  return {
    presence,
    hasSignatureEntree: !!presence.signatureEntree,
    hasSignatureSortie: !!presence.signatureSortie,
  };
}

  // ──────────────────────────────────────────────────────────────
  // VÉRIFICATION ÉTAT PRÉSENCE (pour la badgeuse)
  // ──────────────────────────────────────────────────────────────
  async verifierEtatPresence(matricule?: string, nom?: string, prenom?: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      let presence: Presence | null = null;

      if (matricule) {
        presence = await this.presenceRepo.findOne({
          where: { agent: { matricule }, date: today },
          relations: ['agent'],
        });
      }

      if (!presence && nom && prenom) {
        presence = await this.presenceRepo.findOne({
          where: { agent: { nom: nom.trim(), prenom: prenom.trim() }, date: today },
          relations: ['agent'],
        });
      }

      if (!presence) {
        return { success: true, etat: 'ABSENT', message: "Aucune présence aujourd'hui" };
      }

      if (presence.heureSortie) {
        return { success: true, etat: 'COMPLET', message: "Entrée et sortie déjà pointées", presence };
      }

      return { success: true, etat: 'ENTREE_ONLY', message: "Entrée pointée, sortie attendue", presence };
    } catch (error) {
      return { success: false, etat: 'ERROR', message: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  // ──────────────────────────────────────────────────────────────
  // RECHERCHE HISTORIQUE
  // ──────────────────────────────────────────────────────────────
  async getHistoriquePresences(filters: HistoriqueFilters) {
    const query = this.presenceRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.agent', 'a');

    // Période
    if (filters.dateDebut && filters.dateFin)
       query.andWhere('p.date BETWEEN :dateDebut AND :dateFin', {
          dateDebut: filters.dateDebut,
          dateFin: filters.dateFin,
        })
      query.andWhere('EXTRACT(YEAR FROM p.date) = :annee', { annee: filters.annee });

    if (filters.mois) {
      query.andWhere('EXTRACT(MONTH FROM p.date) = :mois', { mois: Number(filters.mois) });
    }

    if (filters.matricule) query.andWhere('a.matricule = :matricule', { matricule: filters.matricule });
    if (filters.nom) query.andWhere('a.nom ILIKE :nom', { nom: `%${filters.nom}%` });
    if (filters.prenom) query.andWhere('a.prenom ILIKE :prenom', { prenom: `%${filters.prenom}%` });
    if (filters.campagne) query.andWhere('a.campagne = :campagne', { campagne: filters.campagne });
    if (filters.shift) query.andWhere('p.shift = :shift', { shift: filters.shift });

    query.orderBy('p.date', 'DESC');

    const presences = await query.getMany();

    const totalHeures = presences.reduce((sum, p) => sum + (p.heuresTravaillees || 0), 0);

    return {
      data: presences,
      totalHeures,
      totalPresences: presences.length,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // GÉNÉRATION PDF (SANS SIGNATURE)
  // ──────────────────────────────────────────────────────────────
  async generatePDF(presences: Presence[], totalHeures: number, totalPresences: number): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    // Titre
    doc.fontSize(18).font('Helvetica-Bold').text('Rapport des Présences - Colarys', 30, 40);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 30, 65);

    // Stats
    doc.fontSize(12).fillColor('#2c3e50');
    doc.text(`Total présences : ${totalPresences}`, 30, 95);
    doc.text(`Total heures travaillées : ${totalHeures.toFixed(2)} h`, 30, 115);

    // Colonnes (sans signature)
    const columns = [
      { label: 'Date', width: 80 },
      { label: 'Matricule', width: 90 },
      { label: 'Nom Prénom', width: 160 },
      { label: 'Entrée', width: 70 },
      { label: 'Sortie', width: 70 },
      { label: 'Heures', width: 70 },
      { label: 'Shift', width: 60 },
      { label: 'Campagne', width: 100 },
    ];

    let y = 160;
    const rowHeight = 30;

    // En-tête tableau
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
    let x = 30;
    columns.forEach(col => {
      doc.text(col.label, x, y, { width: col.width, align: 'center' });
      x += col.width;
    });

    y += rowHeight;
    doc.fontSize(9).font('Helvetica').fillColor('#333');

    // Lignes de données
    for (const p of presences) {
      if (y > 550) {
        doc.addPage();
        y = 50;
      }

      x = 30;
      const nomComplet = `${p.agent.nom} ${p.agent.prenom}`.trim();

      const data = [
        new Date(p.date).toLocaleDateString('fr-FR'),
        p.agent.matricule || '—',
        nomComplet.length > 25 ? nomComplet.substring(0, 22) + '...' : nomComplet,
        p.heureEntree || '—',
        p.heureSortie || '—',
        p.heuresTravaillees ? p.heuresTravaillees.toFixed(2) + 'h' : '—',
        p.shift,
        p.agent.campagne,
      ];

      data.forEach((text, i) => {
        doc.text(text, x, y, { width: columns[i].width, align: 'center' });
        x += columns[i].width;
      });

      y += rowHeight;
    }

    // Pied de page
    doc.fontSize(10).fillColor('#2c3e50');
    doc.text(`TOTAL : ${totalPresences} présence(s) — ${totalHeures.toFixed(2)} heures`, 30, y + 20);


    // Finalisation
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  // ──────────────────────────────────────────────────────────────
  // AUTRES MÉTHODES UTILES
  // ──────────────────────────────────────────────────────────────
  async findAll() {
    return this.presenceRepo.find({ relations: ['agent'], order: { date: 'DESC' } });
  }

  async getPresenceAujourdhuiByMatricule(matricule: string) {
    const today = new Date().toISOString().split('T')[0];
    const presence = await this.presenceRepo.findOne({
      where: { agent: { matricule }, date: today },
      relations: ['agent'],
    });
    return { success: true, data: presence || null };
  }

  async getPresenceAujourdhuiByNomPrenom(nom: string, prenom: string) {
    const today = new Date().toISOString().split('T')[0];
    const presence = await this.presenceRepo.findOne({
      where: { agent: { nom: nom.trim(), prenom: prenom.trim() }, date: today },
      relations: ['agent'],
    });
    return { success: true, data: presence || null };
  }
}