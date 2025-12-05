// src/config/data-source.ts
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Importez TOUTES vos entités
import { User } from "../entities/User";
import { Agent } from "../entities/Agent";
import { Presence } from "../entities/Presence";
import { DetailPresence } from "../entities/DetailPresence";
import { HistoAgents } from "../entities/HistoAgents";
import { Role } from "../entities/Role";
import { Trashpresence } from "../entities/Trashpresence";
import { AgentColarys } from "../entities/AgentColarys";

dotenv.config();

console.log('🔧 Loading database configuration for Supabase Pooler...');

// Configuration spécifique pour Supabase Pooler
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: "postgres",
  
  // ✅ UTILISEZ DATABASE_URL (obligatoire avec le pooler)
  url: databaseUrl,
  
  // Fallback (ne sera pas utilisé si DATABASE_URL est défini)
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"), // Note: 6543 pour le pooler
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  
  // ENTITÉS - Toutes vos entités
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
  
  // IMPORTANT: FALSE en production avec des tables existantes
  synchronize: false,
  migrationsRun: false,
  
  // Logging pour debug
  logging: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
  
  // SSL OBLIGATOIRE avec Supabase Pooler
  ssl: true, // Toujours true avec le pooler
  
  // Configuration du pool de connexions
  extra: {
    max: 20, // Augmentez pour le pooler
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: {
      rejectUnauthorized: false, // IMPORTANT pour Supabase
      require: true
    }
  },
  
  // Schéma
  schema: "public"
});

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing database connection to Supabase Pooler...');
    console.log('📊 Using Pooler host:', process.env.POSTGRES_HOST);
    
    if (AppDataSource.isInitialized) {
      console.log('✅ Database already connected');
      return true;
    }
    
    // Debug info (sans mot de passe)
    console.log('🔍 Connection details:', {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER?.substring(0, 15) + '...',
      database: process.env.POSTGRES_DB,
      hasURL: !!databaseUrl,
      ssl: 'enabled'
    });
    
    // Initialisation
    await AppDataSource.initialize();
    
    // Test de connexion
    const result = await AppDataSource.query(`
      SELECT 
        current_database() as db,
        current_user as user,
        inet_client_addr() as client_ip,
        version() as pg_version
    `);
    
    console.log('✅ Database connected successfully:', {
      database: result[0]?.db,
      user: result[0]?.user,
      clientIP: result[0]?.client_ip,
      version: result[0]?.pg_version?.split(',')[0]
    });
    
    // Vérifier les tables
    const tables = await AppDataSource.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${tables.length} tables in database`);
    
    // Afficher les tables importantes
    const importantTables = tables.filter((t: any) => 
      ['users', 'agents', 'presences', 'roles', 'agents_colarys'].includes(t.table_name)
    );
    
    if (importantTables.length > 0) {
      console.log('✅ Important tables found:', importantTables.map((t: any) => t.table_name));
    } else {
      console.warn('⚠️ Important tables not found - database might be empty');
    }
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    // Diagnostic spécifique pour le pooler
    console.log('\n🔧 TROUBLESHOOTING SUPABASE POOLER:');
    console.log('1. Vérifiez que DATABASE_URL est défini dans Vercel');
    console.log('2. Le pooler utilise le port 6543 (pas 5432)');
    console.log('3. SSL est obligatoire: sslmode=require');
    console.log('4. Vérifiez les permissions dans Supabase Dashboard');
    console.log('5. Vérifiez que le compte a accès à la base de données');
    
    // Afficher l'URL (masquée) pour debug
    if (databaseUrl) {
      const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':***@');
      console.log('🔗 DATABASE_URL (masked):', maskedUrl);
    }
    
    return false;
  }
};