"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAgents = seedAgents;
const data_source_1 = require("../config/data-source");
const Agent_1 = require("../entities/Agent");
const AgentService_1 = require("../services/AgentService");
async function seedAgents() {
    if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
        console.log('⏭️ Skipping seed on Vercel production');
        return;
    }
    try {
        console.log("🔄 Initializing database connection for seeding...");
        await data_source_1.AppDataSource.initialize();
        console.log("📦 Connected to database for seeding");
        const agentService = new AgentService_1.AgentService();
        const agentRepository = data_source_1.AppDataSource.getRepository(Agent_1.Agent);
        const existingAgents = await agentRepository.find();
        if (existingAgents.length > 0) {
            console.log("✅ Agents already exist in database:", existingAgents.length);
            await data_source_1.AppDataSource.destroy();
            return;
        }
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
            }
            catch (error) {
                console.error(`❌ Error creating agent ${agentData.matricule}:`, error);
            }
        }
        console.log("🎉 Seeding completed successfully");
        await data_source_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error("❌ Seeding failed:", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
}
if (require.main === module) {
    seedAgents();
}
