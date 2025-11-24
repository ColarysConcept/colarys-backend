// api/index.js - Point d'entrée Vercel
console.log('🚀 Colarys API - Starting Vercel serverless function...');

// Import de l'app compilée
const app = require('../dist/app').default;

// Initialisation asynchrone de la base de données
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection for Vercel...');
    const { AppDataSource } = require('../dist/config/data-source');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully on Vercel');
    }
  } catch (error) {
    console.warn('⚠️ Database connection warning (non-blocking):', error.message);
    // Ne pas bloquer le démarrage - la connexion peut se faire au premier appel
  }
};

// Démarrer l'initialisation (sans await pour ne pas bloquer)
initializeDatabase().then(() => {
  console.log('🎉 Vercel serverless function ready');
}).catch(err => {
  console.error('❌ Database init error:', err);
});

module.exports = app;