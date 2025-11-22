// src/server.ts - DÉMARREUR SERVEUR LOCAL
import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Starting Colarys API Server...');

    // ✅ INITIALISATION BASE DE DONNÉES
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // ✅ DÉMARRAGE SERVEUR
    app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();