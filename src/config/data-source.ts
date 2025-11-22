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

// ✅ CONFIGURATION CORRIGÉE POUR TYPEORM
export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ CONNEXION DIRECTE SUPABASE (PORT 5432)
  host: process.env.POSTGRES_HOST?.replace('pooler', 'db') || process.env.POSTGRES_HOST,
  port: 5432, // Port direct
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
  
  // ✅ CONFIGURATION CONNEXION
  poolSize: 5,
  maxQueryExecutionTime: 10000,
  
  // ✅ CORRECTION : SSL DANS EXTRA SEULEMENT
  extra: {
    // ✅ CONFIGURATION SSL CORRECTE
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    
    // ✅ TIMEOUTS OPTIMISÉS
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
    query_timeout: 15000,
    statement_timeout: 15000,
    
    // ✅ POOL DE CONNEXIONS
    max: 5,
    min: 0,
  },
});

// ✅ FONCTION D'INITIALISATION SIMPLIFIÉE
export const initializeDatabase = async (maxRetries = 2): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (AppDataSource.isInitialized) {
        console.log('✅ Database already connected');
        return true;
      }

      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      console.log(`📍 Host: ${process.env.POSTGRES_HOST}`);
      console.log(`📍 Port: 5432`);
      console.log(`📍 User: ${process.env.POSTGRES_USER ? '***' : 'NOT SET'}`);
      
      // Vérification des variables
      const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing environment variables:', missingVars);
        return false;
      }

      // Tentative de connexion
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      
      // Test de la connexion
      const result = await AppDataSource.query('SELECT version() as version, NOW() as time');
      console.log('✅ Database connection verified');
      
      return true;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
      
      // Diagnostic
      if (errorMessage.includes('SSL')) {
        console.error('🔒 SSL Error detected');
      }
      if (errorMessage.includes('timeout')) {
        console.error('⏱️ Timeout Error detected');
      }
      
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