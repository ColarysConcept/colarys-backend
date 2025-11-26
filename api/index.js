// api/index.js - Point d'entrée Vercel
console.log('🚀 Colarys API - Vercel Serverless Function Starting...');

// Import de l'app compilée
const app = require('../dist/app').default;

// Initialisation asynchrone
const initializeApp = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    
    const { initializeDatabase } = require('../dist/config/data-source');
    const dbConnected = await initializeDatabase();
    
    if (dbConnected) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('⚠️ Database connection failed, but continuing...');
    }
    
    console.log('🎉 Vercel serverless function ready');
    return app;
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    return app;
  }
};

// Export pour Vercel
module.exports = async (req, res) => {
  try {
    const initializedApp = await initializeApp();
    return initializedApp(req, res);
  } catch (error) {
    console.error('❌ Request handler error:', error);
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message 
    });
  }
};