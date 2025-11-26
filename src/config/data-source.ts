// src/config/data-source.ts - VERSION STABLE
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

console.log('🔧 Database config - Checking environment variables...');

// Configuration de base sans initialisation immédiate
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  
  // IMPORTANT: Utiliser le glob pattern pour les entités
  entities: [__dirname + "/../entities/*.js"],
  
  // DÉSACTIVER synchronize en production
  synchronize: false,
  logging: false,
  
  // SSL pour Supabase
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

// Initialisation sécurisée
export const initializeDatabase = async (): Promise<boolean> => {
  if (AppDataSource.isInitialized) {
    return true;
  }

  try {
    console.log('🔄 Initializing database...');
    
    // Vérification des variables critiques
    const required = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing);
      return false;
    }

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    return true;
    
  } catch (error: any) {
    console.error('❌ Database initialization failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    return false;
  }
};