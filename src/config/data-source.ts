import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Import des entités avec chemins absolus
import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { HistoAgents } from "../entities/HistoAgents";
import { Role } from "../entities/Role";
import { Presence } from "../entities/Presence";
import { DetailPresence } from "../entities/DetailPresence";
import { Trashpresence } from "../entities/Trashpresence";
import { AgentColarys } from "../entities/AgentColarys";

import * as entities from "../entities";

dotenv.config();

console.log('🔧 Database configuration check:', {
  host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER ? '***' : 'MISSING',
  database: process.env.POSTGRES_DB ? '***' : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
  vercel: !!process.env.VERCEL
});

// ✅ CONFIGURATION AMÉLIORÉE POUR VERCELL + SUPABASE
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    User, 
    HistoAgents, 
    Agent, 
    Role, 
    Presence, 
    DetailPresence, 
    Trashpresence,
    AgentColarys
  ],
  // ⚠️ IMPORTANT: Désactiver synchronize en production
   synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // ✅ CONFIGURATION POOL POUR SERVERLESS
  extra: {
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  }
});
// ✅ INITIALISATION SIMPLIFIÉE ET ROBUSTE
let isInitializing = false;

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
    
    // Test de la connexion
    try {
      await AppDataSource.query('SELECT 1');
      console.log('✅ Database test query successful');
    } catch (testError) {
      console.warn('⚠️ Database test query failed:', testError);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization FAILED:', error.message);
    console.error('❌ Error details:', error);
    return false;
  }
};