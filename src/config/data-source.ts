// src/config/data-source.ts - VERSION COMPLÈTEMENT CORRIGÉE
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
import { AgentColarys } from "../entities/AgentColarys"; // 👈 IMPORT EXPLICITE

dotenv.config();

console.log('🔧 Database configuration - Loading entities...');

// ✅ CONFIGURATION AVEC ENTITÉS EXPLICITES
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"),
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
    AgentColarys // 👈 DOIT ÊTRE INCLUS ICI
  ],
  
  // ⚠️ IMPORTANT: synchronize true pour créer les tables manquantes
  synchronize: true, // ✅ TEMPORAIREMENT TRUE POUR CRÉER LA TABLE
  logging: true, // ✅ ACTIVER LES LOGS POUR LE DEBUG
  
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: process.env.NODE_ENV === 'production',
  extra: {
    ssl: {
      rejectUnauthorized: false
    },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  }
});

export const initializeDatabase = async (): Promise<boolean> => {
  if (AppDataSource.isInitialized) {
    console.log('✅ Database already initialized');
    
    // Log des entités chargées
    const entityNames = AppDataSource.entityMetadatas.map(meta => meta.name);
    console.log('📋 Currently loaded entities:', entityNames);
    
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
    
    // Vérifier spécifiquement AgentColarys
    const agentColarysMeta = AppDataSource.entityMetadatas.find(
      meta => meta.name === 'AgentColarys' || meta.tableName === 'agents_colarys'
    );
    
    if (agentColarysMeta) {
      console.log('✅ AgentColarys entity loaded successfully:', {
        name: agentColarysMeta.name,
        tableName: agentColarysMeta.tableName,
        columns: agentColarysMeta.columns.map(col => col.propertyName)
      });
    } else {
      console.error('❌ AgentColarys entity NOT found in metadata');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization FAILED:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    return false;
  }
};