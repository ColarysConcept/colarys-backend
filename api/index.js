// api/index.js - VERSION CORRIGÉE POUR VERCEL
console.log('🚀 Colarys API - Starting Vercel serverless function...');

// Configuration pour Vercel
process.env.NODE_ENV = 'production';

// Désactiver le stockage de fichiers sur Vercel
process.env.DISABLE_FILE_UPLOADS = 'true';

try {
  // Importer l'app compilée
  const app = require('../dist/app').default;
  console.log('✅ App imported successfully from dist/app');
  
  // Initialisation de la base de données
  const initDB = async () => {
    try {
      const { AppDataSource } = require('../dist/config/data-source');
      console.log('🔄 Initializing database connection...');
      
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        
        // Créer l'utilisateur par défaut
        await createDefaultUser();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      // Ne pas bloquer le démarrage si la DB échoue
    }
  };

  // Fonction pour créer l'utilisateur par défaut
  const createDefaultUser = async () => {
    try {
      const { AppDataSource } = require('../dist/config/data-source');
      const bcrypt = require('bcryptjs');
      const { User } = require('../dist/entities/User');
      
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ 
        where: { email: 'ressource.prod@gmail.com' } 
      });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('stage25', 10);
        const defaultUser = userRepository.create({
          name: 'Admin Ressources',
          email: 'ressource.prod@gmail.com',
          password: hashedPassword,
          role: 'admin'
        });
        await userRepository.save(defaultUser);
        console.log('✅ Default user created successfully');
      } else {
        console.log('✅ Default user already exists');
      }
    } catch (error) {
      console.log('⚠️ Note: User creation skipped:', error.message);
    }
  };

  // Initialiser la DB de manière asynchrone
  initDB().then(() => {
    console.log('🎉 Vercel serverless function ready');
  });

  module.exports = app;

} catch (error) {
  console.error('❌ CRITICAL ERROR:', error);
  
  // Fallback Express app en cas d'erreur
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Basic CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  app.get('/', (_req, res) => {
    res.json({ 
      status: 'ERROR', 
      message: 'Application failed to start',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ERROR',
      message: 'Application initialization failed',
      timestamp: new Date().toISOString()
    });
  });
  
  // Route fallback pour les agents
  app.get('/api/agents-colarys', (_req, res) => {
    res.status(500).json({
      success: false,
      error: 'Server initialization in progress',
      message: 'Please try again in a few moments'
    });
  });
  
  module.exports = app;
}