// src/config/data-source.ts - CONFIGURATION SUPABASE POOLER OPTIMISÉE
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
console.log('🔧 Database port:', process.env.POSTGRES_PORT);

// ✅ CONFIGURATION SUPABASE POOLER (PORT 6543)
export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ CONNEXION AVEC POOLER SUPABASE
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"), // IMPORTANT: 6543 pour pooler
  username: process.env.POSTGRES_USER,
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
  poolSize: 5,
  maxQueryExecutionTime: 10000,
  
  // ✅ CONFIGURATION SSL OBLIGATOIRE POUR SUPABASE POOLER
  ssl: true, // ← IMPORTANT: true au lieu d'un objet
  extra: {
    // ✅ CONFIGURATION POOLER SUPABASE
    ssl: {
      rejectUnauthorized: false,
      // Pas besoin de ca pour Supabase Pooler
    },
    
    // ✅ TIMEOUTS OPTIMISÉS
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    query_timeout: 10000,
    statement_timeout: 10000,
    
    // ✅ POOL DE CONNEXIONS
    max: 5,
    min: 0,
  },
});

// ✅ FONCTION D'INITIALISATION ROBUSTE
export const initializeDatabase = async (maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (AppDataSource.isInitialized) {
        console.log('✅ Database already connected');
        return true;
      }

      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      console.log(`📍 Connecting to: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
      
      // Vérification des variables critiques
      const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars);
        return false;
      }

      // Tentative de connexion
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      
      // Test de la connexion avec une requête simple
      const result = await AppDataSource.query('SELECT version() as version, NOW() as time');
      console.log('✅ Database connection verified:', result[0].version.split(',')[0]);
      
      return true;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
      
      // Log détaillé pour le débogage
      if (errorMessage.includes('SSL')) {
        console.error('🔒 SSL Error - Vérifiez la configuration SSL');
      }
      if (errorMessage.includes('password')) {
        console.error('🔑 Authentication Error - Vérifiez le mot de passe');
      }
      if (errorMessage.includes('timeout')) {
        console.error('⏱️ Timeout Error - Vérifiez le host et le port');
      }
      
      // Attente progressive avant retry
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
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