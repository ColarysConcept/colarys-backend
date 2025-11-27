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
  
  // ⚠️ IMPORTANT: synchronize false en production
  synchronize: false,
  logging: false, // ✅ DÉSACTIVER LES LOGS EN PROD
  
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  }
});

export const initializeDatabase = async (): Promise<boolean> => {
  if (AppDataSource.isInitialized) {
    console.log('✅ Database already initialized');
    return true;
  }

  try {
    console.log('🔄 Starting database initialization...');
    
    // Vérification des variables critiques
    const requiredVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      return false;
    }

    console.log('🔧 Attempting to connect to database...');
    await AppDataSource.initialize();
    
    console.log('✅ Database connected successfully!');
    
    // Vérifier que toutes les entités sont chargées
    const entityNames = AppDataSource.entityMetadatas.map(meta => meta.name);
    console.log('📋 Successfully loaded entities:', entityNames);
    
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization FAILED:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
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