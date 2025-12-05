// src/config/data-source.ts
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

console.log('🔧 Configuring database with SSL fix for Supabase Pooler...');

// IMPORTANT: Désactiver la vérification SSL pour Supabase Pooler
// Nécessaire car Supabase utilise un certificat self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Construction de l'URL de connexion
const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.POSTGRES_USER}:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '')}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || '6543'}/${process.env.POSTGRES_DB}?sslmode=require&ssl=true`;

console.log('🔗 Database URL configured (masked):', 
  databaseUrl.replace(/:[^:@]+@/, ':****@'));

export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ Utilisez l'URL complète (la plus fiable)
  url: databaseUrl,
  
  // ❌ NE PAS spécifier host/port/user séparément quand on utilise url
  
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
  
  // IMPORTANT pour Supabase
  synchronize: false,
  migrationsRun: false,
  
  // Logging
  logging: ["error", "warn"],
  
  // ✅ CONFIGURATION SSL SPÉCIALE POUR SUPABASE POOLER
  ssl: true, // Force SSL
  
  // ✅ CONFIGURATION CRITIQUE POUR DÉSACTIVER LA VÉRIFICATION SSL
  extra: {
    ssl: {
      rejectUnauthorized: false, // ⚠️ Désactive la vérification du certificat
      require: true
    },
    // Configuration du pool
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    // Timeouts
    statement_timeout: 30000,
    query_timeout: 30000
  }
});

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing database with SSL bypass...');
    
    if (AppDataSource.isInitialized) {
      console.log('✅ Database already initialized');
      return true;
    }
    
    // Forcer la désactivation de la vérification SSL au niveau Node.js
    const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    try {
      console.log('🔧 SSL verification disabled for connection attempt');
      
      // Debug info
      console.log('📊 Connection details:', {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER?.substring(0, 10) + '...',
        hasSSL: true,
        sslRejectUnauthorized: false
      });
      
      await AppDataSource.initialize();
      
      // Test query
      const result = await AppDataSource.query(`
        SELECT 
          current_database() as db,
          current_user as user,
          version() as version,
          now() as server_time
      `);
      
      console.log('✅ Database connected successfully!');
      console.log('📊 Connection info:', {
        database: result[0].db,
        user: result[0].user,
        version: result[0].version.split(',')[0],
        time: result[0].server_time
      });
      
      // Restaurer le paramètre SSL
      if (originalReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      
      return true;
      
    } catch (initError: any) {
      // Restaurer même en cas d'erreur
      if (originalReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      }
      throw initError;
    }
    
  } catch (error: any) {
    console.error('❌ Database initialization failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    // Diagnostic spécifique SSL
    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.log('\n🔧 SSL FIX REQUIRED:');
      console.log('1. Supabase Pooler uses self-signed certificates');
      console.log('2. Node.js rejects them by default');
      console.log('3. Solution: rejectUnauthorized: false in SSL config');
    }
    
    return false;
  }
};