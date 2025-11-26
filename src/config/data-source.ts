// src/config/data-source.ts - VERSION DEBUG
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

console.log('🔧 Database configuration check - VERCEL:', {
  host: process.env.POSTGRES_HOST ? '***' : 'MISSING',
  user: process.env.POSTGRES_USER ? '***' : 'MISSING',
  database: process.env.POSTGRES_DB ? '***' : 'MISSING',
  port: process.env.POSTGRES_PORT,
  nodeEnv: process.env.NODE_ENV,
  vercel: !!process.env.VERCEL
});

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [__dirname + "/../entities/*.{js,ts}"],
  synchronize: false, // ⚠️ IMPORTANT: false en production
  logging: false,
  ssl: true, // ✅ Supabase require SSL
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
    return true;
  }

  try {
    console.log('🔄 Starting database initialization on Vercel...');
    console.log('🔧 Connection details:', {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      ssl: true
    });

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully on Vercel!');
    
    // Test de la connexion
    try {
      const result = await AppDataSource.query('SELECT version()');
      console.log('✅ Database version test successful');
      return true;
    } catch (queryError) {
      console.error('❌ Database test query failed:', queryError);
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Database initialization FAILED on Vercel:');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    if (error.code === '28P01') {
      console.error('❌ AUTHENTICATION FAILED - Check username/password');
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ HOST NOT FOUND - Check POSTGRES_HOST');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ CONNECTION REFUSED - Check port/host');
    }
    
    return false;
  }
};