// backend/src/controllers/PresenceController.ts
// VERSION FINALE SANS SIGNATURE — 2025

import { Request, Response } from "express";
import { PresenceService } from "../services/PresenceService";

export class PresenceController {
  private presenceService: PresenceService = new PresenceService();

  constructor() {
    this.presenceService = new PresenceService();
  }

// backend/src/controllers/PresenceController.ts
async pointageEntree(req: Request, res: Response) {
  console.log('pointageEntree appelé avec body:', req.body);
  try {
    const { 
      matricule, 
      nom, 
      prenom, 
      campagne, 
      shift, 
      heureEntreeManuelle,
      signatureEntree // ✅ NOUVEAU
    } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        success: false,
        error: "Nom et prénom sont obligatoires",
      });
    }

    // ✅ VALIDER LA SIGNATURE SI PRÉSENTE
    if (signatureEntree && !this.isValidSignature(signatureEntree)) {
      return res.status(400).json({
        success: false,
        error: "Format de signature invalide",
      });
    }

    const result = await this.presenceService.pointageEntree({
      matricule: matricule?.trim() || undefined,
      nom: nom.trim(),
      prenom: prenom.trim(),
      campagne: campagne || "Standard",
      shift: shift || "JOUR",
      heureEntreeManuelle,
      signatureEntree, // ✅ PASSER AU SERVICE
    });

    res.status(201).json({
      success: true,
      message: "Entrée pointée avec succès",
      presence: result.presence,
    });
  } catch (error: any) {
    console.error('Erreur pointage entrée:', error);
    res.status(400).json({
      success: false,
      error: error.message || "Erreur lors du pointage d'entrée",
    });
  }
}

async pointageSortie(req: Request, res: Response) {
  console.log('pointageSortie appelé avec body:', req.body);
  try {
    const { 
      matricule, 
      signatureSortie, // ✅ DEVENU OBLIGATOIRE
      heureSortieManuelle 
    } = req.body;

    if (!matricule) {
      return res.status(400).json({
        success: false,
        error: "Matricule obligatoire pour la sortie",
      });
    }

    // ✅ VALIDATION RENFORCÉE
    if (!signatureSortie) {
      return res.status(400).json({
        success: false,
        error: "Signature de sortie obligatoire",
      });
    }

    if (!this.isValidSignature(signatureSortie)) {
      return res.status(400).json({
        success: false,
        error: "Format de signature invalide",
      });
    }

    const result = await this.presenceService.pointageSortie(
      matricule.trim(), 
      signatureSortie, // ✅ PASSER LA SIGNATURE
      heureSortieManuelle
    );

    res.json({
      success: true,
      message: "Sortie pointée avec succès",
      presence: result.presence,
    });
  } catch (error: any) {
    console.error('Erreur pointage sortie:', error);
    res.status(400).json({
      success: false,
      error: error.message || "Erreur lors du pointage de sortie",
    });
  }
}

// ✅ MÉTHODE DE VALIDATION DES SIGNATURES
private isValidSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') return false;
  
  // Vérifier Base64
  if (signature.startsWith('data:image/')) {
    const base64Regex = /^data:image\/(png|jpg|jpeg|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
    return base64Regex.test(signature);
  }
  
  // Vérifier SVG
  if (signature.startsWith('<svg')) {
    return signature.includes('</svg>');
  }
  
  // Vérifier JSON (coordonnées vectorielles)
  try {
    const parsed = JSON.parse(signature);
    return Array.isArray(parsed) || (parsed.points && Array.isArray(parsed.points));
  } catch {
    return false;
  }
}

// backend/src/controllers/PresenceController.ts
async getSignature(req: Request, res: Response) {
  try {
    const { id, type } = req.params; // id de la présence, type: 'entree' ou 'sortie'
    
    // Utiliser la nouvelle méthode
    const presence = await this.presenceService.getPresenceById(Number(id));
    
    if (!presence) {
      return res.status(404).json({ 
        success: false, 
        error: 'Présence non trouvée' 
      });
    }
    
    // Vérifier si les propriétés existent (pour TypeScript)
    const signatureEntree = (presence as any).signatureEntree;
    const signatureSortie = (presence as any).signatureSortie;
    
    const signature = type === 'entree' 
      ? signatureEntree 
      : signatureSortie;
    
    if (!signature) {
      return res.status(404).json({ 
        success: false, 
        error: `Signature ${type} non trouvée pour cette présence` 
      });
    }
    
    // Si c'est une image Base64
    if (signature.startsWith('data:image/')) {
      const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le type MIME
      const mimeType = signature.match(/data:image\/(\w+);/)?.[1];
      res.set('Content-Type', `image/${mimeType || 'png'}`);
      
      return res.send(imgBuffer);
    }
    
    // Si c'est du SVG
    if (signature.startsWith('<svg')) {
      res.set('Content-Type', 'image/svg+xml');
      return res.send(signature);
    }
    
    // Sinon retourner le JSON
    res.json({ 
      success: true, 
      signature,
      presenceId: presence.id,
      agent: presence.agent,
      date: presence.date
    });
    
  } catch (error: any) {
    console.error('Erreur récupération signature:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur serveur' 
    });
  }
}


  // HISTORIQUE DES PRÉSENCES
  async getHistorique(req: Request, res: Response) {
    console.log('getHistorique appelé avec query:', req.query);
    try {
      const {
        dateDebut,
        dateFin,
        matricule,
        nom,
        prenom,
        annee,
        mois,
        campagne,
        shift,
      } = req.query;

      if ((!dateDebut || !dateFin) && !annee) {
        return res.status(400).json({
          success: false,
          error: "Période requise : soit dateDebut/dateFin, soit annee",
        });
      }

      const result = await this.presenceService.getHistoriquePresences({
        dateDebut: dateDebut as string | undefined,
        dateFin: dateFin as string | undefined,
        matricule: matricule as string | undefined,
        nom: nom as string | undefined,
        prenom: prenom as string | undefined,
        annee: annee as string | undefined,
        mois: mois as string | undefined,
        campagne: campagne as string | undefined,
        shift: shift as string | undefined,
      });

      res.json({
        success: true,
        count: result.data.length,
        totalHeures: result.totalHeures,
        totalPresences: result.totalPresences,
        data: result.data,
      });
    } catch (error: any) {
      console.error('Erreur récupération historique:', error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }

  // TOUTES LES PRÉSENCES (admin)
  async getAllPresences(req: Request, res: Response) {
    try {
      const presences = await this.presenceService.findAll();
      res.json({
        success: true,
        count: presences.length,
        data: presences,
      });
    } catch (error: any) {
      console.error('Erreur getAllPresences:', error);
      res.status(500).json({
        success: false,
        error: "Impossible de récupérer toutes les présences",
      });
    }
  }

  // VÉRIFIER L'ÉTAT ACTUEL D'UN AGENT
  async verifierEtatPresence(req: Request, res: Response) {
    try {
      const { matricule, nom, prenom } = req.body;

      if (!matricule && (!nom || !prenom)) {
        return res.status(400).json({
          success: false,
          error: "Matricule OU nom + prénom requis",
        });
      }

      const result = await this.presenceService.verifierEtatPresence(matricule, nom, prenom);

      res.json({
        success: result.success,
        etat: result.etat,
        message: result.message,
        presence: result.presence || null,
      });
    } catch (error: any) {
      console.error('Erreur verifierEtatPresence:', error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur de vérification",
      });
    }
  }

  // PRÉSENCE AUJOURD'HUI PAR MATRICULE
  async getPresenceAujourdhui(req: Request, res: Response) {
    try {
      const { matricule } = req.params;
      if (!matricule) {
        return res.status(400).json({ success: false, error: "Matricule requis" });
      }

      const result = await this.presenceService.getPresenceAujourdhuiByMatricule(matricule);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }

  // PRÉSENCE AUJOURD'HUI PAR NOM + PRÉNOM
  async getPresenceAujourdhuiByNomPrenom(req: Request, res: Response) {
    try {
      const { nom, prenom } = req.params;
      if (!nom || !prenom) {
        return res.status(400).json({ success: false, error: "Nom et prénom requis" });
      }

      const result = await this.presenceService.getPresenceAujourdhuiByNomPrenom(nom, prenom);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }

  // EXPORT PDF DE L'HISTORIQUE
  async exportHistorique(req: Request, res: Response) {
    try {
      const { dateDebut, dateFin, matricule, annee, mois, campagne, shift } = req.query;
      const { format } = req.params;

      if (format !== 'pdf') {
        return res.status(400).json({ success: false, error: "Seul le format PDF est supporté" });
      }

      const result = await this.presenceService.getHistoriquePresences({
        dateDebut: dateDebut as string | undefined,
        dateFin: dateFin as string | undefined,
        matricule: matricule as string | undefined,
        annee: annee as string | undefined,
        mois: mois as string | undefined,
        campagne: campagne as string | undefined,
        shift: shift as string | undefined,
      });

      const pdfBuffer = await this.presenceService.generatePDF(
        result.data,
        result.totalHeures,
        result.totalPresences
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique-presences-${new Date().toISOString().split('T')[0]}.pdf`
      );

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erreur export PDF:', error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur lors de la génération du PDF",
      });
    }
  }
}