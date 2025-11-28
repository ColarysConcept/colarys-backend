// src/scripts/migrate-to-supabase.ts - AVEC DOTENV
import dotenv from 'dotenv';
import { colarysEmployeeService } from '../services/ColarysEmployeeService';
import fs from 'fs';
import path from 'path';

// ⚠️ CHARGEZ LES VARIABLES D'ENVIRONNEMENT
dotenv.config();

// Debug: Vérifiez que les variables sont chargées
console.log('🔍 Variables d\'environnement:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');

// Si les variables manquent, utilisez SUPABASE_SERVICE_KEY comme fallback
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_KEY) {
  console.log('🔄 Utilisation de SUPABASE_SERVICE_KEY comme fallback');
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;
}

async function migrateExistingData() {
  console.log('🚀 Début de la migration des données vers Supabase...');
  
  const dataDir = path.join(__dirname, '../data');
  console.log(`📁 Dossier des données: ${dataDir}`);
  
  try {
    // Migrer les employés
    const employesPath = path.join(dataDir, 'employes.json');
    if (fs.existsSync(employesPath)) {
      const employeesData = fs.readFileSync(employesPath, 'utf-8');
      const employees = JSON.parse(employeesData);
      console.log(`📊 Migration de ${employees.length} employés...`);
      
      for (const emp of employees) {
        try {
          const result = await colarysEmployeeService.createEmployee(emp);
          if (result.success) {
            console.log(`✅ Employé migré: ${emp.Matricule} - ${emp.Nom} ${emp.Prénom}`);
          } else {
            console.log(`⚠️ ${emp.Matricule}: ${result.message}`);
          }
        } catch (error) {
          console.log(`❌ Erreur sur ${emp.Matricule}:`, error);
        }
      }
    }
    
    // ... le reste de votre code de migration
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

migrateExistingData();