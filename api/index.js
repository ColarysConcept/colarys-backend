// api/index.js - VERSION FINALE
console.log('🚀 Colarys API - Starting Vercel serverless function...');

const app = require('../dist/app').default;

// Initialisation sécurisée
const initializeApp = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    const { AppDataSource } = require('../dist/config/data-source');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed (non-blocking):', error.message);
  }
};

initializeApp();

module.exports = app;