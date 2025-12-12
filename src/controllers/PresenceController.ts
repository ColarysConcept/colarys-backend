// backend/src/controllers/PresenceController.ts

import { Request, Response } from "express";
import { PresenceService } from "../services/PresenceService";

export class PresenceController {
  private service = new PresenceService();

  // Pointage Entrée
  async pointageEntree(req: Request, res: Response) {
    try {
      const { matricule, nom, prenom, campagne, shift, heureEntreeManuelle } = req.body;

      if (!nom || !prenom) {
        return res.status(400).json({
          success: false,
          error: "Nom et prénom sont obligatoires"
        });
      }

      const result = await this.service.pointageEntree({
        matricule: matricule || undefined,
        nom,
        prenom,
        campagne: campagne || "Standard",
        shift: shift || "JOUR",
        heureEntreeManuelle
      });

      return res.status(201).json({
        success: true,
        message: "Pointage d'entrée enregistré",
        presence: result.presence
      });
    } catch (error: any) {
      console.error('Erreur pointage entrée:', error);
      return res.status(400).json({
        success: false,
        error: error.message || "Erreur lors du pointage d'entrée"
      });
    }
  }

  // Pointage Sortie
  async pointageSortie(req: Request, res: Response) {
    try {
      const { matricule, heureSortieManuelle } = req.body;

      if (!matricule) {
        return res.status(400).json({
          success: false,
          error: "Matricule obligatoire pour la sortie"
        });
      }

      const result = await this.service.pointageSortie(matricule, heureSortieManuelle);

      return res.json({
        success: true,
        message: "Pointage de sortie enregistré",
        presence: result.presence
      });
    } catch (error: any) {
      console.error('Erreur pointage sortie:', error);
      return res.status(400).json({
        success: false,
        error: error.message || "Erreur lors du pointage de sortie"
      });
    }
  }

  // Historique
  async getHistorique(req: Request, res: Response) {
    try {
      const filters = req.query as any;
      const result = await this.service.getHistoriquePresences(filters);

      return res.json({
        success: true,
        data: result.data,
        totalHeures: result.totalHeures,
        totalPresences: result.totalPresences
      });
    } catch (error: any) {
      console.error('Erreur historique:', error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur"
      });
    }
  }

  // Présence aujourd'hui par matricule (CORRIGÉE)
  async getPresenceAujourdhui(req: Request, res: Response) {
    try {
      const { matricule } = req.params;
      if (!matricule) {
        return res.status(400).json({ success: false, error: "Matricule requis" });
      }

      const result = await this.service.getPresenceAujourdhuiByMatricule(matricule);

      return res.json({
        success: result.success,
        data: result.data
      });
    } catch (error: any) {
      console.error('Erreur getPresenceAujourdhui:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Présence aujourd'hui par nom + prénom (CORRIGÉE)
  async getPresenceAujourdhuiByNomPrenom(req: Request, res: Response) {
    try {
      const { nom, prenom } = req.params;
      if (!nom || !prenom) {
        return res.status(400).json({ success: false, error: "Nom et prénom requis" });
      }

      const result = await this.service.getPresenceAujourdhuiByNomPrenom(nom, prenom);

      return res.json({
        success: result.success,
        data: result.data
      });
    } catch (error: any) {
      console.error('Erreur getPresenceAujourdhuiByNomPrenom:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Export PDF
  async exportHistorique(req: Request, res: Response) {
    try {
      const { format } = req.params;
      const filters = req.query as any;

      if (format !== 'pdf') {
        return res.status(400).json({ success: false, error: "Format non supporté. Utilisez 'pdf'" });
      }

      const result = await this.service.getHistoriquePresences(filters);
      const pdfBuffer = await this.service.generatePDF(
        result.data,
        result.totalHeures,
        result.totalPresences
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=historique-presences-${new Date().toISOString().split('T')[0]}.pdf`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erreur export PDF:', error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erreur lors de l'export"
      });
    }
  }
}