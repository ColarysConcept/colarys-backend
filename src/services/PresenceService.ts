// backend/src/services/PresenceService.ts
import { Repository, Between, Like } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Presence } from '../entities/Presence';
import { DetailPresence } from '../entities/DetailPresence';
import { Agent } from '../entities/Agent';
import { v4 as uuidv4 } from 'uuid';

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
  private presenceRepository: Repository<Presence>;
  private agentRepository: Repository<Agent>;
  private detailPresenceRepository: Repository<DetailPresence>;

  constructor() {
    this.presenceRepository = AppDataSource.getRepository(Presence);
    this.agentRepository = AppDataSource.getRepository(Agent);
    this.detailPresenceRepository = AppDataSource.getRepository(DetailPresence);
  }

  // Méthode pour vérifier l'état de présence
  async verifierEtatPresence(matricule?: string, nom?: string, prenom?: string) {
    console.log('🔍 verifierEtatPresence:', { matricule, nom, prenom });
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let presence = null;

      // Chercher par matricule d'abord
      if (matricule) {
        presence = await this.presenceRepository.findOne({
          where: {
            agent: { matricule },
            date: today
          },
          relations: ['agent', 'details'],
        });
      }

      // Chercher par nom/prénom si non trouvé
      if (!presence && nom && prenom) {
        presence = await this.presenceRepository.findOne({
          where: {
            agent: { nom, prenom },
            date: today
          },
          relations: ['agent', 'details'],
        });
      }

      // Déterminer l'état
      if (!presence) {
        return {
          success: true,
          etat: 'ABSENT',
          message: "Aucune présence aujourd'hui",
          presence: null
        };
      }

      if (presence.heureSortie) {
        return {
          success: true,
          etat: 'COMPLET',
          message: "Entrée et sortie déjà pointées",
          presence: presence
        };
      }

      return {
        success: true,
        etat: 'ENTREE_ONLY',
        message: "Entrée pointée, sortie attendue",
        presence: presence
      };

    } catch (error: unknown) {
      console.error('❌ Erreur verifierEtatPresence:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return {
        success: false,
        etat: 'ERROR',
        message: errorMessage,
        presence: null
      };
    }
  }
// Méthode pointageEntree améliorée
  async pointageEntree(data: {
    matricule?: string;
    nom: string;
    prenom: string;
    campagne: string;
    shift: string;
    signatureEntree: string;
    heureEntreeManuelle?: string;
  }) {
    console.log('pointageEntree dans PresenceService:', {
      ...data,
      signatureLength: data.signatureEntree?.length,
      signaturePreview: data.signatureEntree?.substring(0, 100)
    });

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validation
      if (!data.nom || !data.prenom) {
        throw new Error("Le nom et le prénom sont obligatoires");
      }

      let agent: Agent;
      let matriculeValue = data.matricule?.trim() || '';

      // Vérifier d'abord si l'agent existe aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      if (matriculeValue) {
        const existingPresence = await queryRunner.manager.findOne(Presence, {
          where: {
            agent: { matricule: matriculeValue },
            date: today
          },
          relations: ['agent'],
        });

        if (existingPresence) {
          if (!existingPresence.heureSortie) {
            throw new Error("Une entrée existe déjà pour aujourd'hui. Veuillez pointer la sortie d'abord.");
          } else {
            throw new Error("Entrée et sortie déjà pointées pour aujourd'hui.");
          }
        }
      }

      // Gestion de l'agent
      if (matriculeValue) {
        // Recherche d'un agent existant
        const existingAgent = await queryRunner.manager.findOne(Agent, {
          where: { matricule: matriculeValue }
        });

        if (existingAgent) {
          agent = existingAgent;
          console.log('✅ Agent existant trouvé:', agent);
        } else {
          // Création d'un nouvel agent avec matricule
          agent = new Agent();
          agent.matricule = matriculeValue;
          agent.nom = data.nom;
          agent.prenom = data.prenom;
          agent.campagne = data.campagne || "Standard";
          agent.dateCreation = new Date();

          agent = await queryRunner.manager.save(agent);
          console.log('✅ Nouvel agent créé avec matricule:', agent);
        }
      } else {
        // Création d'un nouvel agent sans matricule
        const generatedMatricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
        console.log('🎫 Matricule généré:', generatedMatricule);

        agent = new Agent();
        agent.matricule = generatedMatricule;
        agent.nom = data.nom;
        agent.prenom = data.prenom;
        agent.campagne = data.campagne || "Standard";
        agent.dateCreation = new Date();

        agent = await queryRunner.manager.save(agent);
        console.log('✅ Nouvel agent créé sans matricule fourni:', agent);
      }

      // Calcul de l'heure d'entrée
      const heureEntree = data.heureEntreeManuelle || new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Création de la présence
      const presence = new Presence();
      presence.agent = agent;
      presence.date = today;
      presence.heureEntree = heureEntree;
      presence.shift = data.shift || "JOUR";
      presence.createdAt = new Date();

      // Nettoyer la signature
      let signatureClean = data.signatureEntree;
      if (signatureClean && !signatureClean.startsWith('data:image/')) {
        signatureClean = 'data:image/png;base64,' + signatureClean;
      }

      // Création des détails
      const details = new DetailPresence();
      details.signatureEntree = signatureClean;
      details.presence = presence;

      // Sauvegarde
      const savedPresence = await queryRunner.manager.save(presence);
      details.presence = savedPresence;
      await queryRunner.manager.save(details);

      await queryRunner.commitTransaction();

      // Récupération complète
      const completePresence = await this.presenceRepository.findOne({
        where: { id: savedPresence.id },
        relations: ['agent', 'details'],
      });

      return { 
        success: true, 
        presence: completePresence,
        message: "Pointage d'entrée enregistré"
      };

    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Erreur pointageEntree:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(errorMessage);
    } finally {
      await queryRunner.release();
    }
  }
async pointageSortie(matricule: string, signatureSortie: string, heureSortieManuelle?: string) {
    console.log('pointageSortie dans PresenceService:', {
      matricule,
      signatureLength: signatureSortie?.length
    });

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date().toISOString().split('T')[0];
      const presence = await queryRunner.manager.findOne(Presence, {
        where: {
          agent: { matricule },
          date: today
        },
        relations: ['agent', 'details'],
      });

      if (!presence) {
        throw new Error("Aucune entrée trouvée pour aujourd'hui. Veuillez pointer l'entrée d'abord.");
      }

      if (presence.heureSortie) {
        throw new Error("Sortie déjà pointée pour aujourd'hui.");
      }

      // Calcul de l'heure de sortie
      const heureSortie = heureSortieManuelle
        ? this.validerFormatHeure(heureSortieManuelle)
        : new Date().toTimeString().split(' ')[0];

      // Mise à jour de la présence
      presence.heureSortie = heureSortie;
      presence.heuresTravaillees = this.calculerHeuresTravaillees(presence.heureEntree, heureSortie);

      // Nettoyer la signature
      let signatureClean = signatureSortie;
      if (signatureClean && !signatureClean.startsWith('data:image/')) {
        signatureClean = 'data:image/png;base64,' + signatureClean;
      }

    

      // Sauvegarde finale
      await queryRunner.manager.save(Presence, presence);
      await queryRunner.commitTransaction();

      // Récupération complète
      const completePresence = await this.presenceRepository.findOne({
        where: { id: presence.id },
        relations: ['agent', 'details'],
      });

      return { 
        success: true, 
        presence: completePresence,
        message: "Pointage de sortie enregistré"
      };

    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Erreur pointageSortie:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(errorMessage);
    } finally {
      await queryRunner.release();
    }
  }


  async findAll(): Promise<any[]> {
  try {
    // Exemple d'implémentation - adaptez selon votre base de données
    const presences = await this.presenceRepository.find({
      relations: ['agent'],
      order: { date: 'DESC' }
    });
    return presences;
  } catch (error) {
    console.error('Error finding all presences:', error);
    throw error;
  }
}

    // Méthodes utilitaires (garder les existantes)
  private validerFormatHeure(heure: string): string {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(heure)) {
      throw new Error('Format d\'heure invalide. Utilisez HH:MM');
    }
    return heure + ':00';
  }

  private calculerHeuresTravaillees(heureEntree: string, heureSortie: string): number {
    // Fixer à 8 heures pour tous les shifts
    return 8.00;
  
}


  async getPresenceAujourdhuiByMatricule(matricule: string) {
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
    } catch (error: unknown) {
      console.error('Erreur dans getPresenceAujourdhuiByMatricule:', error);

      let errorMessage = 'Erreur inconnue lors de la recherche de présence';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return { success: false, error: errorMessage };
    }
  }

  // Dans PresenceService.ts
  async getPresenceAujourdhuiByNomPrenom(nom: string, prenom: string) {
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
    } catch (error: unknown) {
      // CORRECTION : Gestion appropriée du type unknown
      console.error('Erreur dans getPresenceAujourdhuiByNomPrenom:', error);

      let errorMessage = 'Erreur inconnue lors de la recherche de présence';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return { success: false, error: errorMessage };
    }
  }

  // CORRECTION : Déplacer getLastDayOfMonth avant son utilisation
  private getLastDayOfMonth(annee: string, mois?: string): string {
    const year = parseInt(annee);
    const month = mois ? parseInt(mois) : 12;
    const lastDay = new Date(year, month, 0).getDate();
    return `${annee}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  }

  async getHistoriquePresences(filters: HistoriqueFilters): Promise<{ data: Presence[]; totalHeures: number; totalPresences: number }> {
    console.log('getHistoriquePresences avec filtres:', filters);

    try {
      const queryBuilder = this.presenceRepository.createQueryBuilder('presence')
        .leftJoinAndSelect('presence.agent', 'agent')
        .leftJoinAndSelect('presence.details', 'details');

      // Construction de la condition WHERE
      const whereConditions: any[] = [];
      const parameters: any = {};

      // Filtre par période (dateDebut/dateFin OU année/mois)
      if (filters.dateDebut && filters.dateFin) {
        whereConditions.push('presence.date BETWEEN :dateDebut AND :dateFin');
        parameters.dateDebut = filters.dateDebut;
        parameters.dateFin = filters.dateFin;
      } else if (filters.annee) {
        const startDate = `${filters.annee}-${filters.mois || '01'}-01`;
        const endDate = this.getLastDayOfMonth(filters.annee, filters.mois);
        whereConditions.push('presence.date BETWEEN :startDate AND :endDate');
        parameters.startDate = startDate;
        parameters.endDate = endDate;
      } else {
        throw new Error('Période non spécifiée');
      }

      // CORRECTION : Recherche par matricule
      if (filters.matricule) {
        whereConditions.push('agent.matricule = :matricule');
        parameters.matricule = filters.matricule;
      }

      // CORRECTION : Recherche par nom (avec LIKE pour plus de flexibilité)
      if (filters.nom) {
        whereConditions.push('agent.nom ILIKE :nom');
        parameters.nom = `%${filters.nom}%`;
      }

      // CORRECTION : Recherche par prénom (avec LIKE pour plus de flexibilité)
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

      // CORRECTION : Appel temporaire pour le débogage
      if (filters.nom) {
        await this.debugAgentsByNom(filters.nom);
      }

      // CORRECTION : Log des conditions pour le débogage
      console.log('Conditions de recherche:', whereConditions);
      console.log('Paramètres:', parameters);

      // Appliquer toutes les conditions
      if (whereConditions.length > 0) {
        queryBuilder.where(whereConditions.join(' AND '), parameters);
      }

      // CORRECTION : Ajouter un ordre par défaut
      queryBuilder.orderBy('presence.date', 'DESC')
        .addOrderBy('agent.nom', 'ASC')
        .addOrderBy('agent.prenom', 'ASC');

      const presences = await queryBuilder.getMany();

      console.log(`✅ ${presences.length} présence(s) trouvée(s) avec les filtres appliqués`);

      // S'assurer que toutes les données sont bien formatées
      const presencesAvecTypesCorrects = presences.map(presence => ({
        ...presence,
        heuresTravaillees: presence.heuresTravaillees != null ? Number(presence.heuresTravaillees) : null
      }));

      // Calculer le total des heures travaillées
      const totalHeures = presencesAvecTypesCorrects.reduce((sum, presence) => {
        return sum + (presence.heuresTravaillees != null ? presence.heuresTravaillees : 0);
      }, 0);

      return {
        data: presencesAvecTypesCorrects,
        totalHeures,
        totalPresences: presencesAvecTypesCorrects.length,
      };
    } catch (error: unknown) {
      console.error('Erreur dans getHistoriquePresences:', error);

      let errorMessage = 'Erreur inconnue lors de la récupération de l\'historique';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      throw new Error(errorMessage);
    }
  }


  async debugAgentsByNom(nom: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.find({
        where: {
          nom: Like(`%${nom}%`)
        }
      });
      console.log(`🔍 Agents trouvés avec le nom "${nom}":`, agents);
      return agents;
    } catch (error) {
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
    } catch (error: unknown) {
      console.error('Erreur de vérification:', error);
    }
  }
 

async generatePDF(presences: Presence[], totalHeures: number, totalPresences: number): Promise<Buffer> {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    if (!presences || presences.length === 0) {
      throw new Error('Aucune donnée de présence à exporter');
    }

    console.log(`📊 Génération PDF pour ${presences.length} présence(s)`);

    // Fonction CRITIQUE : convertir base64 en buffer
    const base64ToBuffer = (base64String: string | null | undefined): Buffer | null => {
      if (!base64String || base64String.trim() === '') {
        return null;
      }

      try {
        console.log('📝 Conversion signature base64:', {
          length: base64String.length,
          startsWithDataImage: base64String.startsWith('data:image/'),
          preview: base64String.substring(0, 30)
        });

        // Nettoyer le base64
        let cleanBase64 = base64String;
        
        // Si c'est déjà du base64 pur, ajouter le préfixe PNG
        if (!cleanBase64.startsWith('data:image/') && 
            cleanBase64.match(/^[A-Za-z0-9+/]+=*$/)) {
          cleanBase64 = 'data:image/png;base64,' + cleanBase64;
        }
        
        // Extraire la partie base64 pure
        const base64Data = cleanBase64.replace(/^data:image\/\w+;base64,/, '');
        
        // Créer le buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Vérifier que le buffer est valide
        if (buffer.length > 0) {
          console.log(`✅ Buffer créé: ${buffer.length} bytes`);
          return buffer;
        }
        
        return null;
      } catch (error) {
        console.error('❌ Erreur conversion base64:', error);
        console.error('Base64 problématique:', base64String?.substring(0, 50));
        return null;
      }
    };

    // === DÉBUT DU PDF ===
    
    // Titre
    doc.fontSize(18).font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('Rapport des Présences - Colarys Concept', 30, 30);
    
    doc.fontSize(10).font('Helvetica')
      .fillColor('#7f8c8d')
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 30, 60);

    // Statistiques
    doc.fillColor('#3498db').font('Helvetica-Bold');
    doc.text(`Total des présences: ${totalPresences}`, 30, 85);
    doc.text(`Total des heures travaillées: ${totalHeures}h`, 30, 100);
    
    // Informations sur les signatures
    const signaturesCount = presences.filter(p => 
      p.details?.signatureEntree || p.details?.signatureSortie
    ).length;
    doc.text(`Présences avec signatures: ${signaturesCount}/${totalPresences}`, 30, 115);

    // === CONFIGURATION DU TABLEAU ===
    
    // Définir les colonnes
    const columns = [
      { x: 30, width: 70, label: 'Date', align: 'center' },
      { x: 100, width: 80, label: 'Matricule', align: 'center' },
      { x: 180, width: 120, label: 'Nom', align: 'center' },
      { x: 300, width: 60, label: 'Entrée', align: 'center' },
      { x: 360, width: 60, label: 'Sortie', align: 'center' },
      { x: 420, width: 70, label: 'Heures', align: 'center' },
      { x: 490, width: 50, label: 'Shift', align: 'center' },
      { x: 540, width: 80, label: 'Campagne', align: 'center' },
      { x: 620, width: 80, label: 'Signature Entrée', align: 'center' },
      { x: 700, width: 80, label: 'Signature Sortie', align: 'center' }
    ];

    // Position verticale initiale
    let y = 150;
    const rowHeight = 35;
    const signatureSize = 25;

    // === EN-TÊTE DU TABLEAU ===
    
    doc.rect(columns[0].x, y, columns.reduce((sum, col) => sum + col.width, 0), rowHeight)
      .fillColor('#ecf0f1').fill()
      .strokeColor('#bdc3c7').lineWidth(0.5);

    // Bordures verticales
    columns.forEach(col => {
      doc.moveTo(col.x, y).lineTo(col.x, y + rowHeight).stroke();
    });
    doc.moveTo(columns[columns.length - 1].x + columns[columns.length - 1].width, y)
      .lineTo(columns[columns.length - 1].x + columns[columns.length - 1].width, y + rowHeight)
      .stroke();

    // Texte de l'en-tête
    doc.fillColor('#2c3e50').fontSize(8).font('Helvetica-Bold');
    columns.forEach(col => {
      doc.text(col.label, col.x, y + 12, {
        width: col.width,
        align: col.align
      });
    });

    y += rowHeight;

    // === DONNÉES DES PRÉSENCES ===
    
    doc.fontSize(8).font('Helvetica').fillColor('#2c3e50');

    for (const presence of presences) {
      // Vérifier la fin de page
      if (y > 500) {
        doc.addPage();
        y = 50;
        
        // Réécrire l'en-tête
        doc.rect(columns[0].x, y, columns.reduce((sum, col) => sum + col.width, 0), rowHeight)
          .fillColor('#ecf0f1').fill()
          .strokeColor('#bdc3c7').lineWidth(0.5);
        
        columns.forEach(col => {
          doc.moveTo(col.x, y).lineTo(col.x, y + rowHeight).stroke();
        });
        
        doc.fillColor('#2c3e50').fontSize(8).font('Helvetica-Bold');
        columns.forEach(col => {
          doc.text(col.label, col.x, y + 12, {
            width: col.width,
            align: col.align
          });
        });
        
        y += rowHeight;
        doc.fontSize(8).font('Helvetica').fillColor('#2c3e50');
      }

      // Bordures de la ligne
      doc.rect(columns[0].x, y, columns.reduce((sum, col) => sum + col.width, 0), rowHeight)
        .strokeColor('#ecf0f1').stroke();

      // Données de base
      const nomComplet = `${presence.agent?.nom || 'Inconnu'} ${presence.agent?.prenom || ''}`;
     const matriculeValue = presence.agent?.matricule || 'N/D';
      const dateFormatee = new Date(presence.date).toLocaleDateString('fr-FR');
      const heuresTravaillees = presence.heuresTravaillees ? 
        `${Number(presence.heuresTravaillees).toFixed(2)}h` : '-';

      // Colonne 1: Date
      doc.text(dateFormatee, columns[0].x, y + 12, {
        width: columns[0].width,
        align: 'center'
      });

      // Colonne 2: Matricule
      doc.text(matriculeValue, columns[1].x, y + 12, {
        width: columns[1].width,
        align: 'center'
      });

      // Colonne 3: Nom complet
      const nomTronque = nomComplet.length > 15 ? 
        nomComplet.substring(0, 12) + '...' : 
        nomComplet;
      doc.text(nomTronque, columns[2].x, y + 12, {
        width: columns[2].width,
        align: 'center'
      });

      // Colonne 4: Heure entrée
      doc.text(presence.heureEntree || '-', columns[3].x, y + 12, {
        width: columns[3].width,
        align: 'center'
      });

      // Colonne 5: Heure sortie
      doc.text(presence.heureSortie || '-', columns[4].x, y + 12, {
        width: columns[4].width,
        align: 'center'
      });

      // Colonne 6: Heures travaillées
      doc.text(heuresTravaillees, columns[5].x, y + 12, {
        width: columns[5].width,
        align: 'center'
      });

      // Colonne 7: Shift
      doc.text(presence.shift || '-', columns[6].x, y + 12, {
        width: columns[6].width,
        align: 'center'
      });

      // Colonne 8: Campagne
      doc.text(presence.agent?.campagne || '-', columns[7].x, y + 12, {
        width: columns[8].width,
        align: 'center'
      });

      // === COLONNES SIGNATURES ===
      
      // Colonne 9: Signature Entrée
      try {
        if (presence.details?.signatureEntree) {
          const signatureBuffer = base64ToBuffer(presence.details.signatureEntree);
          
          if (signatureBuffer) {
            // Calculer la position centrée
            const sigX = columns[8].x + (columns[8].width - signatureSize) / 2;
            const sigY = y + (rowHeight - signatureSize) / 2;
            
            doc.image(signatureBuffer, sigX, sigY, {
              width: signatureSize,
              height: signatureSize
            });
          } else {
            doc.text('-', columns[8].x, y + 12, {
              width: columns[8].width,
              align: 'center'
            });
          }
        } else {
          doc.text('-', columns[8].x, y + 12, {
            width: columns[8].width,
            align: 'center'
          });
        }
      } catch (error) {
        console.error('❌ Erreur signature entrée:', error);
        doc.text('Err', columns[8].x, y + 12, {
          width: columns[8].width,
          align: 'center'
        });
      }

      // Colonne 10: Signature Sortie
      try {
        if (presence.details?.signatureSortie) {
          const signatureBuffer = base64ToBuffer(presence.details.signatureSortie);
          
          if (signatureBuffer) {
            // Calculer la position centrée
            const sigX = columns[9].x + (columns[9].width - signatureSize) / 2;
            const sigY = y + (rowHeight - signatureSize) / 2;
            
            doc.image(signatureBuffer, sigX, sigY, {
              width: signatureSize,
              height: signatureSize
            });
          } else {
            doc.text('-', columns[9].x, y + 12, {
              width: columns[9].width,
              align: 'center'
            });
          }
        } else {
          doc.text('-', columns[9].x, y + 12, {
            width: columns[9].width,
            align: 'center'
          });
        }
      } catch (error) {
        console.error('❌ Erreur signature sortie:', error);
        doc.text('Err', columns[9].x, y + 12, {
          width: columns[9].width,
          align: 'center'
        });
      }

      y += rowHeight;
    }

    // === PIED DE PAGE ===
    
    if (y > 550) {
      doc.addPage();
      y = 50;
    }

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`TOTAL GÉNÉRAL: ${totalPresences} présence(s), ${totalHeures} heures travaillées`, 30, y);

    // Légende
    doc.fontSize(8).font('Helvetica').fillColor('#7f8c8d');
    y += 20;
    doc.text('* Note: Le temps de présence est fixé à 8 heures pour tous les shifts', 30, y);
    y += 10;
    doc.text(`* Signatures: ${signaturesCount} présence(s) avec au moins une signature`, 30, y);

    // === FINALISATION ===
    
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          console.log(`✅ PDF généré: ${chunks.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erreur dans generatePDF:', error);

    let errorMessage = 'Erreur inconnue lors de la génération du PDF';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    throw new Error(errorMessage);
  }
}
}