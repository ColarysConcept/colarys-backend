// backend/src/controllers/AgentController.ts
import { Request, Response } from "express";
import { AgentService } from "../services/AgentService";
import { AppDataSource } from "../config/data-source";

export class AgentController {
  private agentService: AgentService;
  
  constructor() {
    this.agentService = new AgentService();
  }

  private handleDatabaseError(error: any, res: Response): void {
    console.error('❌ Database error in AgentController:', error.message);
    
    if (error.message.includes('Database connection unavailable') || 
        error.message.includes('No metadata for "Agent"') ||
        error.message.includes('RepositoryNotFoundError')) {
      res.status(503).json({
        success: false,
        error: "Database unavailable",
        message: "Service temporarily unavailable. Please try again later."
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Server error",
        message: error.message
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      console.log('📦 AgentController: Fetching ALL real agents from database');
      
      // Vérification explicite de la DB
      if (!AppDataSource.isInitialized) {
        console.log('❌ Database not initialized');
        this.handleDatabaseError(new Error('Database connection unavailable'), res);
        return; // Ajout du return
      }
      
      const agents = await this.agentService.getAllAgents();
      
      console.log(`✅ AgentController: Found ${agents.length} real agents`);
      
      res.json({
        success: true,
        message: "Real agents retrieved from database",
        timestamp: new Date().toISOString(),
        count: agents.length,
        data: agents
      });
    } catch (error: any) {
      this.handleDatabaseError(error, res);
    }
  }

  async getByMatricule(req: Request, res: Response): Promise<void> {
    try {
      const { matricule } = req.params;
      console.log('🔍 AgentController: Searching agent by matricule:', matricule);
      
      // Vérification explicite de la DB
      if (!AppDataSource.isInitialized) {
        this.handleDatabaseError(new Error('Database connection unavailable'), res);
        return; // Ajout du return
      }
      
      const agent = await this.agentService.getAgentByMatricule(matricule);
      
      if (!agent) {
        console.log('❌ AgentController: Agent not found for matricule:', matricule);
        res.status(404).json({ 
          success: false, 
          message: 'Agent non trouvé' 
        });
        return;
      }
      
      console.log('✅ AgentController: Agent found:', agent.matricule);
      res.json({ 
        success: true, 
        data: agent 
      });
    } catch (error: any) {
      this.handleDatabaseError(error, res);
    }
  }

  async getByNomPrenom(req: Request, res: Response): Promise<void> {
    try {
      const { nom, prenom } = req.params;
      console.log('🔍 AgentController: Searching agent by nom/prenom:', { nom, prenom });
      
      // Vérification explicite de la DB
      if (!AppDataSource.isInitialized) {
        this.handleDatabaseError(new Error('Database connection unavailable'), res);
        return; // Ajout du return
      }
      
      if (!nom || !prenom) {
        res.status(400).json({ 
          success: false, 
          message: 'Le nom et le prénom sont requis' 
        });
        return;
      }
      
      const agent = await this.agentService.findAgentByNomPrenom(nom, prenom);
      
      if (!agent) {
        console.log('❌ AgentController: Agent not found for nom/prenom:', { nom, prenom });
        res.status(404).json({ 
          success: false, 
          message: 'Agent non trouvé' 
        });
        return;
      }
      
      console.log('✅ AgentController: Agent found by nom/prenom:', agent.matricule);
      res.json({ 
        success: true, 
        data: agent 
      });
    } catch (error: any) {
      this.handleDatabaseError(error, res);
    }
  }

  async searchByNomPrenom(req: Request, res: Response): Promise<void> {
    try {
      const { nom, prenom, query } = req.query;
      
      console.log('🔍 AgentController: Searching agents by:', { nom, prenom, query });
      
      // Vérification explicite de la DB
      if (!AppDataSource.isInitialized) {
        this.handleDatabaseError(new Error('Database connection unavailable'), res);
        return; // Ajout du return
      }
      
      let agents;
      
      // Si un paramètre 'query' est fourni, l'utiliser pour la recherche
      if (query) {
        agents = await this.agentService.findAgentsByNomPrenom(
          query as string, 
          query as string
        );
      } else {
        // Sinon utiliser nom et prenom séparés
        agents = await this.agentService.findAgentsByNomPrenom(
          nom as string, 
          prenom as string
        );
      }
      
      console.log(`✅ AgentController: Found ${agents.length} agents for search`);
      
      res.json({ 
        success: true, 
        data: agents,
        count: agents.length
      });
    } catch (error: any) {
      this.handleDatabaseError(error, res);
    }
  }
}