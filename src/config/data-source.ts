import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { HistoAgents } from "../entities/HistoAgents";
import { Role } from "../entities/Role";
import { Presence } from "../entities/Presence";
import { DetailPresence } from "../entities/DetailPresence";
import { Trashpresence } from "../entities/Trashpresence";
import { AgentColarys } from "../entities/AgentColarys";

dotenv.config();

console.log('🔧 Database configuration check:', {
  host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER ? '***' : 'MISSING',
  database: process.env.POSTGRES_DB ? '***' : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
  vercel: !!process.env.VERCEL
});

// ✅ CONFIGURATION SPÉCIFIQUE POUR SUPABASE + VERCELL
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
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  migrations: [],
  subscribers: [],
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // ✅ CONFIGURATION POOL POUR SERVERLESS
  extra: {
    max: 1,
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

  if (isInitializing) {
    console.log('🔄 Database initialization already in progress...');
    return false;
  }

  isInitializing = true;

  try {
    console.log('🔄 Starting database initialization...');
    
    // Vérification des variables critiques
    const requiredVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    console.log('🔧 Attempting to connect to database...');
    await AppDataSource.initialize();
    
    console.log('✅ Database connected successfully!');
    
    // Test de la connexion avec une requête simple
    try {
      await AppDataSource.query('SELECT 1');
      console.log('✅ Database test query successful');
    } catch (testError) {
      console.warn('⚠️ Database test query failed, but connection established:', testError);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization FAILED:', error.message);
    console.error('❌ Error details:', error);
    
    // Log des informations de connexion (sans le mot de passe)
    console.log('🔧 Connection details:', {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      ssl: process.env.NODE_ENV === 'production'
    });
    
    return false;
  } finally {
    isInitializing = false;
  }
};

// ✅ FONCTION POUR OBTENIR LE STATUT
export const getDatabaseStatus = () => {
  return {
    initialized: AppDataSource.isInitialized,
    isInitializing: isInitializing
  };
};