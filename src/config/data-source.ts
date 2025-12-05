// src/config/data-source.ts
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Imports de vos entités
import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { Presence } from "../entities/Presence";
import { DetailPresence } from "../entities/DetailPresence";
import { HistoAgents } from "../entities/HistoAgents";
import { Role } from "../entities/Role";
import { Trashpresence } from "../entities/Trashpresence";
import { AgentColarys } from "../entities/AgentColarys";

dotenv.config();

console.log('🔧 Loading database config for Vercel + Supabase...');

// Désactiver la vérification SSL pour Supabase (nécessaire)
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Construction de l'URL de connexion
const getDatabaseUrl = () => {
  // Priorité 1: DATABASE_URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Priorité 2: Construction à partir des variables
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT || '6543';
  const user = process.env.POSTGRES_USER;
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD || '');
  const database = process.env.POSTGRES_DB || 'postgres';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
};

const databaseUrl = getDatabaseUrl();

export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ Utilisez SEULEMENT l'URL (évite les problèmes de compatibilité)
  url: databaseUrl,
  
  // Entités
  entities: [
    User,
    Agent,
    Presence,
    DetailPresence,
    HistoAgents,
    Role,
    Trashpresence,
    AgentColarys
  ],
  
  // Configuration critique pour Vercel
  synchronize: false,
  migrationsRun: false,
  
  // Logging minimal en production
  logging: process.env.NODE_ENV === 'production' ? ["error"] : ["error", "query"],
  
  // Configuration SSL simplifiée mais efficace
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    connectionTimeoutMillis: 10000
  }
});

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Attempting database connection...');
    
    if (AppDataSource.isInitialized) {
      console.log('✅ Already connected');
      return true;
    }
    
    console.log('📊 Using URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
    
    // Forcer désactivation SSL pour cette tentative
    const originalSSLSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    try {
      await AppDataSource.initialize();
      
      // Test simple
      const result = await AppDataSource.query('SELECT 1 as test, NOW() as time');
      console.log('✅ Connection successful! Test query:', result[0].test);
      
      // Restaurer le paramètre SSL
      if (originalSSLSetting !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalSSLSetting;
      }
      
      return true;
    } catch (initError) {
      // Restaurer même en cas d'erreur
      if (originalSSLSetting !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalSSLSetting;
      }
      throw initError;
    }
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    return false;
  }
};