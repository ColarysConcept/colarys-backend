// src/scripts/initDatabase.ts
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

const initDatabase = async () => {
  try {
    console.log('🔄 Initialisation de la base de données...');
    
    await AppDataSource.initialize();
    console.log('✅ Connexion à la base de données établie');
    
    // Créer un utilisateur admin par défaut si nécessaire
    const userRepository = AppDataSource.getRepository(User);
    const adminExists = await userRepository.findOne({ where: { email: 'ressource.prod@gmail.com' } });
    
    if (!adminExists) {
      const adminUser = userRepository.create({
        name: 'Admin',
        email: 'ressource.prod@gmail.com',
        password: 'password123', // ⚠️ À changer après
        role: 'admin'
      });
      
      await userRepository.save(adminUser);
      console.log('✅ Utilisateur admin créé');
    }
    
    console.log('✅ Base de données initialisée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
};

initDatabase();