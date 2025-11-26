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

console.log('🔧 Database configuration:', {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  nodeEnv: process.env.NODE_ENV
});

// Vérification moins stricte pour Vercel
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars);
  // Ne pas throw en production - laisser l'app démarrer
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
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
  synchronize: process.env.NODE_ENV !== 'production', // false en production
  logging: process.env.NODE_ENV === 'development',
  migrations: [],
  subscribers: [],
  // ✅ CONFIGURATION AMÉLIORÉE POUR VERCELL
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  extra: {
    // ✅ CONFIGURATION POOL POUR SERVERLESS
    max: 1, // Une seule connexion pour serverless
    connectionTimeoutMillis: 10000, // 10 secondes timeout
    idleTimeoutMillis: 30000, // 30 secondes avant fermeture
    // ✅ SPÉCIFIQUE SUPABASE
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : undefined
  }
});

// ✅ GESTION ROBUSTE DES CONNEXIONS POUR VERCELL
let initializationPromise: Promise<DataSource> | null = null;

export const initializeDatabase = async (): Promise<DataSource> => {
  // Si déjà initialisé, retourner directement
  if (AppDataSource.isInitialized) {
    console.log('✅ Database already initialized');
    return AppDataSource;
  }

  // Si une initialisation est en cours, attendre qu'elle se termine
  if (initializationPromise) {
    console.log('🔄 Waiting for existing initialization...');
    return await initializationPromise;
  }

  // Démarrer une nouvelle initialisation
  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing database connection...');
      
      // Configuration spécifique pour Supabase
      const connectionOptions = {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      };

      console.log('🔧 Connection details:', {
        host: connectionOptions.host,
        port: connectionOptions.port,
        username: connectionOptions.username,
        database: connectionOptions.database,
        ssl: !!connectionOptions.ssl
      });

      await AppDataSource.initialize();
      
      console.log('✅ Database connection established successfully');
      
      // Tester la connexion avec une requête simple
      try {
        const result = await AppDataSource.query('SELECT 1 as test');
        console.log('✅ Database test query successful:', result);
      } catch (testError) {
        console.warn('⚠️ Database test query failed:', testError);
      }
      
      return AppDataSource;
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      console.error('❌ Error details:', error);
      
      // Réinitialiser la promesse pour permettre de réessayer
      initializationPromise = null;
      
      throw error;
    }
  })();

  return initializationPromise;
};

// ✅ FONCTION POUR OBTENIR UNE CONNEXION SÛRE
export const getDatabaseConnection = async (): Promise<DataSource> => {
  try {
    return await initializeDatabase();
  } catch (error) {
    console.error('❌ Failed to get database connection:', error);
    
    // En production, on relance l'erreur
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    // En développement, on peut retourner la DataSource même si non initialisée
    // pour éviter de bloquer l'application
    return AppDataSource;
  }
};

// ✅ MIDDLEWARE POUR VERIFIER LA CONNEXION BD
export const ensureDatabaseConnection = async (): Promise<boolean> => {
  try {
    await getDatabaseConnection();
    return true;
  } catch (error) {
    console.error('❌ Database connection check failed:', error);
    return false;
  }
};