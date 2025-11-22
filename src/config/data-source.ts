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

// ✅ CONFIGURATION SUPABASE CORRIGÉE
export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ URL DE CONNEXION COMPLÈTE (PRIORITAIRE)
  url: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  
  // ✅ FALLBACK AVEC VARIABLES INDIVIDUELLES
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || "postgres",
  
  // ✅ ENTITÉS
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
  
  // ✅ CONFIGURATION PERFORMANCE
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrations: [],
  subscribers: [],
  
  // ✅ CONFIGURATION CONNEXION AVEC POOL
  poolSize: 3, // Réduit pour Vercel
  maxQueryExecutionTime: 10000, // 10s max par requête
  
  // ✅ CONFIGURATION SSL ET TIMEOUTS (CORRIGÉ)
  extra: {
    // SSL obligatoire pour Supabase
    ssl: {
      rejectUnauthorized: false
    },
    
    // ✅ TIMEOUTS OPTIMISÉS POUR VERCELL (PROPRIÉTÉS CORRECTES)
    connectionTimeoutMillis: 10000, // 10s max pour connexion
    idleTimeoutMillis: 20000, // 20s avant fermeture connexion idle
    query_timeout: 10000, // 10s max par requête
    statement_timeout: 10000, // 10s max par statement
    
    // ✅ POOL DE CONNEXIONS (PROPRIÉTÉS CORRECTES)
    max: 3, // Maximum de connexions
    min: 0, // Minimum de connexions
    
    // ✅ CORRECTION : acquireTimeoutMillis au lieu de acquireTimeout
    acquireTimeoutMillis: 10000, // 10s pour acquérir une connexion
  },
});

// ✅ FONCTION D'INITIALISATION ROBUSTE (IDENTIQUE)
export const initializeDatabase = async (maxRetries = 2): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Vérifier si déjà initialisé
      if (AppDataSource.isInitialized) {
        console.log('✅ Database already connected');
        return true;
      }

      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      
      // Vérification des variables critiques
      const requiredEnvVars = [
        'POSTGRES_HOST', 
        'POSTGRES_USER', 
        'POSTGRES_PASSWORD'
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0 && !process.env.POSTGRES_URL) {
        console.error('❌ Missing required environment variables:', missingVars);
        return false;
      }

      // Tentative de connexion
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      
      // Test de la connexion avec une requête simple
      await AppDataSource.query('SELECT 1 as test');
      console.log('✅ Database connection verified');
      
      return true;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
      
      // Attente progressive avant retry
      if (attempt < maxRetries) {
        const waitTime = attempt * 1000; // 1s, 2s
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('❌ All database connection attempts failed');
  return false;
};

// ✅ FERMETURE PROPRE
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};