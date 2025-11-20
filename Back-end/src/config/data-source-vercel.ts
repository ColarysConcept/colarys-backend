// src/config/data-source-vercel.ts
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "6543"),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || "postgres",
  synchronize: false, // IMPORTANT: false en production
  logging: process.env.NODE_ENV === 'development',
  entities: [
    process.env.NODE_ENV === 'production' 
      ? "dist/entities/*.js" 
      : "src/entities/*.ts"
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? "dist/migrations/*.js"
      : "src/migrations/*.ts"
  ],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  },
  extra: {
    connectionLimit: 5,
    acquireTimeout: 60000,
    timeout: 60000,
  }
});