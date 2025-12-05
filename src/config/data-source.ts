// src/config/data-source.ts - VERSION COMPLÈTE
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// IMPORTS EXPLICITES DE TOUTES LES ENTITÉS
import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { HistoAgents } from "../entities/HistoAgents";
import { Role } from "../entities/Role";
import { Presence } from "../entities/Presence";
import { DetailPresence } from "../entities/DetailPresence";
import { Trashpresence } from "../entities/Trashpresence";
import { AgentColarys } from "../entities/AgentColarys";

dotenv.config();

console.log('🔧 Database configuration - Loading entities...');

// ✅ CONFIGURATION AVEC ENTITÉS EXPLICITES POUR SUPABASE
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || undefined,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  
  // ✅ LISTE EXPLICITE DE TOUTES LES ENTITÉS
  entities: [
    User,
    Agent, 
    HistoAgents,
    Role,
    Presence,
    DetailPresence,
    Trashpresence,
    AgentColarys
  ],
  
 synchronize: false, // IMPORTANT: false en production
  logging: false,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      return true;
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};
// ✅ AJOUTEZ CETTE FONCTION À LA FIN DU FICHIER
export const ensureDatabaseConnection = async (): Promise<boolean> => {
  try {
    if (AppDataSource.isInitialized) {
      // Tester si la connexion est toujours active
      try {
        await AppDataSource.query('SELECT 1');
        console.log('✅ Database connection verified');
        return true;
      } catch (error) {
        console.log('🔄 Connection test failed, reconnecting...');
        await AppDataSource.destroy();
      }
    }
    
    // Se reconnecter
    console.log('🔄 Reconnecting to database...');
    return await initializeDatabase();
  } catch (error) {
    console.error('❌ ensureDatabaseConnection failed:', error);
    return false;
  }
};