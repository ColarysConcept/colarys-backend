// api/index.js - Point d'entrée pour Vercel
console.log('🚀 Colarys API - Starting Vercel serverless function...');

const app = require('../dist/app').default;

// Initialisation asynchrone de la base de données pour Vercel
const initializeVercelDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection for Vercel...');
    const { AppDataSource } = require('../dist/config/data-source');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully on Vercel');
    }
  } catch (error) {
    console.error('❌ Database connection failed on Vercel:', error);
    // Ne pas bloquer le démarrage même si la DB échoue
  }
};

// Démarrer l'initialisation
initializeVercelDatabase();

module.exports = app;