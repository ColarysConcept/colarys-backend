import { Repository, Between, Like } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Presence } from "../entities/Presence";
import { Agent } from "../entities/Agent";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";

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
  private presenceRepo = AppDataSource.getRepository(Presence);
  private agentRepo = AppDataSource.getRepository(Agent);

  // Pointage Entrée
  async pointageEntree(data: {
    matricule?: string;
    nom: string;
    prenom: string;
    campagne?: string;
    shift?: string;
    heureEntreeManuelle?: string;
  }) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date().toISOString().split("T")[0];

      // Vérifier si déjà pointé aujourd'hui
      if (data.matricule) {
        const exist = await queryRunner.manager.findOne(Presence, {
          where: { agent: { matricule: data.matricule }, date: today },
        });
        if (exist) {
          if (exist.heureSortie) {
            throw new Error("Entrée et sortie déjà pointées aujourd'hui");
          }
          throw new Error("Entrée déjà enregistrée aujourd'hui");
        }
      }

      // Recherche ou création de l'agent
      let agent = data.matricule
        ? await queryRunner.manager.findOne(Agent, { where: { matricule: data.matricule } })
        : null;

      if (!agent) {
        const newMatricule = data.matricule || `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
        agent = queryRunner.manager.create(Agent, {
          matricule: newMatricule,
          nom: data.nom,
          prenom: data.prenom,
          campagne: data.campagne || "Standard",
        });
        agent = await queryRunner.manager.save(agent);
      }

      // Création présence
      const presence = queryRunner.manager.create(Presence, {
        agent,
        date: today,
        heureEntree:
          data.heureEntreeManuelle ||
          new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        shift: data.shift || "JOUR",
      });

      const saved = await queryRunner.manager.save(presence);
      await queryRunner.commitTransaction();

      return {
        success: true,
        presence: await this.presenceRepo.findOne({ where: { id: saved.id }, relations: ["agent"] }),
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message || "Erreur lors du pointage d'entrée");
    } finally {
      await queryRunner.release();
    }
  }

  // Pointage Sortie
  async pointageSortie(matricule: string, heureSortieManuelle?: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date().toISOString().split("T")[0];
      const presence = await queryRunner.manager.findOne(Presence, {
        where: { agent: { matricule }, date: today },
        relations: ["agent"],
      });

      if (!presence) throw new Error("Aucune entrée trouvée aujourd'hui");
      if (presence.heureSortie) throw new Error("Sortie déjà pointée");

      const heureSortie =
        heureSortieManuelle ||
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      // Calcul heures travaillées
      const [h1, m1, s1] = presence.heureEntree.split(":").map(Number);
      const [h2, m2, s2] = heureSortie.split(":").map(Number);
      let diff = (h2 + m2 / 60 + s2 / 3600) - (h1 + m1 / 60 + s1 / 3600);
      if (diff < 0) diff += 24;

      presence.heureSortie = heureSortie;
      presence.heuresTravaillees = Number(diff.toFixed(2));

      await queryRunner.manager.save(presence);
      await queryRunner.commitTransaction();

      return {
        success: true,
        presence: await this.presenceRepo.findOne({ where: { id: presence.id }, relations: ["agent"] }),
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message || "Erreur lors du pointage de sortie");
    } finally {
      await queryRunner.release();
    }
  }

  // Dans PresenceService.ts - méthode getPresenceAujourdhuiByMatricule

async getPresenceAujourdhuiByMatricule(matricule: string) {
  const today = new Date().toISOString().split('T')[0];
  const presence = await this.presenceRepo.findOne({
    where: { agent: { matricule }, date: today },
    relations: ['agent']
  });
  
  // AJOUTER DES LOGS POUR DEBUG
  console.log('📊 Presence trouvée:', presence);
  console.log('📊 Agent dans presence:', presence?.agent);
  
  return { 
    success: !!presence, 
    data: presence || null // ← Important: retourner null si pas de présence
  };
}

  async getPresenceAujourdhuiByNomPrenom(nom: string, prenom: string) {
    const today = new Date().toISOString().split('T')[0];
    const presence = await this.presenceRepo.findOne({
      where: { agent: { nom, prenom }, date: today },
      relations: ['agent']
    });
    return { success: !!presence, data: presence };
  }

  // Historique + PDF
  async getHistoriquePresences(filters: HistoriqueFilters) {
    let where: any = {};

    if (filters.annee && filters.mois) {
      const debut = `${filters.annee}-${filters.mois.padStart(2, "0")}-01`;
      const fin = new Date(Number(filters.annee), Number(filters.mois), 0).toISOString().split("T")[0];
      where.date = Between(debut, fin);
    } else if (filters.dateDebut && filters.dateFin) {
      where.date = Between(filters.dateDebut, filters.dateFin);
    }

    if (filters.matricule) where.agent = { matricule: filters.matricule };
    if (filters.nom && filters.prenom) {
      where.agent = { nom: Like(`%${filters.nom}%`), prenom: Like(`%${filters.prenom}%`) };
    }
    if (filters.campagne) where.agent = { ...where.agent, campagne: filters.campagne };
    if (filters.shift) where.shift = filters.shift;

    const presences = await this.presenceRepo.find({
      where,
      relations: ["agent"],
      order: { date: "DESC", heureEntree: "DESC" },
    });

    const totalHeures = presences.reduce((sum, p) => sum + (p.heuresTravaillees || 0), 0);

    return {
      data: presences,
      totalHeures: Number(totalHeures.toFixed(2)),
      totalPresences: presences.length,
    };
  }

  async generatePDF(presences: Presence[], totalHeures: number, totalPresences: number): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];

    doc.fontSize(16).text("HISTORIQUE DES PRÉSENCES", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — ${totalPresences} présence(s) — ${totalHeures}h`, {
      align: "center",
    });
    doc.moveDown(2);

    const cols = [
      { label: "Date", w: 70 },
      { label: "Matricule", w: 90 },
      { label: "Nom Complet", w: 150 },
      { label: "Entrée", w: 70 },
      { label: "Sortie", w: 70 },
      { label: "Heures", w: 70 },
      { label: "Shift", w: 70 },
      { label: "Campagne", w: 100 },
    ];

    let x = 30;
    cols.forEach((c) => {
      doc.font("Helvetica-Bold").fontSize(9).text(c.label, x, doc.y, { width: c.w, align: "center" });
      x += c.w;
    });
    doc.moveDown(0.5);

    presences.forEach((p) => {
      if (doc.y > 550) doc.addPage();
      x = 30;
      const nomComplet = `${p.agent.nom} ${p.agent.prenom}`.trim();

      [
        new Date(p.date).toLocaleDateString("fr-FR"),
        p.agent.matricule || "N/D",
        nomComplet,
        p.heureEntree,
        p.heureSortie || "-",
        p.heuresTravaillees ? p.heuresTravaillees.toFixed(2) + "h" : "-",
        p.shift,
        p.agent.campagne,
      ].forEach((text) => {
        doc.font("Helvetica").fontSize(9).text(text, x, doc.y, { width: cols.shift()?.w, align: "center" });
        x += cols[0]?.w || 0;
      });
      doc.moveDown(0.8);
    });

    doc.moveDown(2);
    doc.fontSize(11).font("Helvetica-Bold").text(`TOTAL : ${totalPresences} présence(s) – ${totalHeures.toFixed(2)} heures`, {
      align: "center",
    });

    return new Promise((resolve) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.end();
    });
  }
}