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
import { AgentColarys } from "../entities/AgentColarys";

dotenv.config();

console.log('🔧 Database configuration - Loading entities...');

// ✅ CONFIGURATION AVEC ENTITÉS EXPLICITES POUR SUPABASE
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
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
    AgentColarys
  ],
  
  // ⚠️ IMPORTANT: synchronize false en production
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  
  // ✅ CONFIGURATION SSL POUR SUPABASE
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 10,
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

    console.log('🔧 Database configuration:', {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER ? '***' : 'MISSING',
      ssl: process.env.NODE_ENV === 'production'
    });

    console.log('🔌 Attempting to connect to database...');
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
    
    // Test de connexion avec une requête simple
    try {
      const result = await AppDataSource.query('SELECT version() as version');
      console.log('✅ Database version:', result[0]?.version);
    } catch (queryError) {
      console.warn('⚠️ Database query test failed:', queryError.message);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization FAILED:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Logs détaillés pour le debug
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - Check host/port');
    } else if (error.code === '28P01') {
      console.error('🔑 Authentication failed - Check username/password');
    } else if (error.code === '3D000') {
      console.error('🗄️ Database does not exist - Check database name');
    }
    
    console.error('Full error:', error);
    return false;
  }
};