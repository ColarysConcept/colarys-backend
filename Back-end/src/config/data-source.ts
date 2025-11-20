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

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production" || isVercel;

const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && !isVercel) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars);
  throw new Error('Configuration de base de données incomplète');
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
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
  logging: !isProduction,
  migrations: isProduction ? [] : ["src/migrations/*.ts"],
  subscribers: [],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

export const initializeDatabase = async (): Promise<DataSource | null> => {
  try {
    if (!AppDataSource.isInitialized) {
      if (isProduction) {
        try {
          await AppDataSource.initialize();
          console.log('✅ Database connection established in production');
        } catch (error) {
          console.error('❌ Database connection failed in production:', (error as Error).message);
          console.log('⚠️ Continuing without database connection...');
          return null;
        }
      } else {
        await AppDataSource.initialize();
        console.log('✅ Database connection established in development');
        
        try {
          await AppDataSource.runMigrations();
          console.log('🔄 Migrations executed successfully');
        } catch (migrationError) {
          console.error('❌ Migrations failed:', (migrationError as Error).message);
        }
      }
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database initialization failed:', (error as Error).message);
    
    if (isProduction) {
      console.log('⚠️ Continuing application without database...');
      return null;
    } else {
      throw error;
    }
  }
};