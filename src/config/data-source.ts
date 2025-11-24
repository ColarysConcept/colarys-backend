// src/config/data-source.ts - VERSION VERCEL
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

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.POSTGRES_URL || process.env.SUPABASE_URL, // ✅ Utilisez l'URL complète
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
  synchronize: false,
  logging: false, // ✅ Désactive les logs en production
  migrations: [], // ✅ Désactive complètement les migrations
  extra: {
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    connectionTimeoutMillis: 10000, // ✅ Timeout de connexion
  }
});

// ✅ Fonction robuste pour Vercel
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      console.log('🔄 Initializing database connection...');
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