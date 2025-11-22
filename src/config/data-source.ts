// src/config/data-source.ts - VERSION CORRIGÉE
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

console.log('🔧 Database configuration - Environment:', process.env.NODE_ENV);
console.log('🔧 Database host:', process.env.POSTGRES_HOST ? '***' : 'NOT SET');

export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ UTILISEZ L'URL COMPLÈTE SI DISPONIBLE
  url: process.env.POSTGRES_URL || process.env.SUPABASE_URL,
  
  // ✅ FALLBACK AVEC VARIABLES INDIVIDUELLES
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || "postgres",
  
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
  
  // ✅ CONFIGURATION VERCEL
  synchronize: false,
  logging: false,
  migrations: [],
  
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // 10 secondes timeout
    query_timeout: 10000,
    statement_timeout: 10000
  }
});

// ✅ FONCTION ROBUSTE POUR VERCEL - CORRIGÉE POUR TYPESCRIPT
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    if (AppDataSource.isInitialized) {
      console.log('✅ Database already connected');
      return true;
    }

    console.log('🔄 Initializing database connection...');
    
    // Vérifier que les variables requises existent
    const requiredVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing database variables:', missingVars);
      return false;
    }

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    return true;
    
  } catch (error: unknown) { // ✅ CORRECTION: error est de type 'unknown'
    // ✅ GESTION SÉCURISÉE DE L'ERREUR
    if (error instanceof Error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.error('❌ Database connection failed:', String(error));
    }
    return false;
  }
};