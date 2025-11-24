// src/scripts/seedAgents.ts
import { AppDataSource } from "../config/data-source";
import { Agent } from "../entities/Agent";
import { AgentService } from "../services/AgentService";

async function seedAgents() {
  // ✅ Ne pas exécuter sur Vercel en production
  if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
    console.log('⏭️ Skipping seed on Vercel production');
    return;
  }

  try {
    console.log("🔄 Initializing database connection for seeding...");
    await AppDataSource.initialize();
    console.log("📦 Connected to database for seeding");

    const agentService = new AgentService();
    const agentRepository = AppDataSource.getRepository(Agent);

    // Vérifiez si des agents existent déjà
    const existingAgents = await agentRepository.find();
    if (existingAgents.length > 0) {
      console.log("✅ Agents already exist in database:", existingAgents.length);
      await AppDataSource.destroy();
      return;
    }

    // Données d'exemple réalistes
    const agentsData = [
      {
        matricule: "AGT001",
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@colarys.com",
        poste: "Développeur Full-Stack",
        salaire_base: 3500,
        solde_conge: 25,
        date_embauche: new Date("2023-01-15"),
        statut: "Actif"
      },
      {
        matricule: "AGT002", 
        nom: "Martin",
        prenom: "Marie",
        email: "marie.martin@colarys.com",
        poste: "Designer UI/UX",
        salaire_base: 3200,
        solde_conge: 22,
        date_embauche: new Date("2023-03-20"),
        statut: "Actif"
      },
      {
        matricule: "AGT003",
        nom: "Bernard",
        prenom: "Pierre", 
        email: "pierre.bernard@colarys.com",
        poste: "Chef de Projet",
        salaire_base: 4500,
        solde_conge: 30,
        date_embauche: new Date("2022-11-10"),
        statut: "Actif"
      }
    ];

    console.log("🌱 Seeding agents...");
    
    for (const agentData of agentsData) {
      try {
        const agent = agentRepository.create(agentData);
        await agentRepository.save(agent);
        console.log(`✅ Created agent: ${agent.prenom} ${agent.nom} (${agent.matricule})`);
      } catch (error) {
        console.error(`❌ Error creating agent ${agentData.matricule}:`, error);
      }
    }

    console.log("🎉 Seeding completed successfully");
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    // ✅ Ne pas quitter le processus sur Vercel
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Exécution conditionnelle
if (require.main === module) {
  seedAgents();
}

export { seedAgents };