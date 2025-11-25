"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const initDatabase = async () => {
    try {
        console.log('🔄 Initialisation de la base de données...');
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Connexion à la base de données établie');
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const adminExists = await userRepository.findOne({ where: { email: 'ressource.prod@gmail.com' } });
        if (!adminExists) {
            const adminUser = userRepository.create({
                name: 'Stagiaire Vola',
                email: 'ressource.prod@gmail.com',
                password: 'stage25',
                role: 'admin'
            });
            await userRepository.save(adminUser);
            console.log('✅ Utilisateur admin créé');
        }
        console.log('✅ Base de données initialisée avec succès');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
};
initDatabase();
