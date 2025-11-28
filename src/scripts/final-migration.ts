// src/scripts/final-migration.ts
import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function finalMigration() {
  console.log('🚀 MIGRATION FINALE VERS SUPABASE...');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    // 1. Vérifier que la table employees existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table employees non accessible:', tableError.message);
      return;
    }
    console.log('✅ Table employees accessible');

    // 2. Migrer les employés
    const employesPath = path.join(dataDir, 'employes.json');
    if (fs.existsSync(employesPath)) {
      const employeesData = fs.readFileSync(employesPath, 'utf-8');
      const employees = JSON.parse(employeesData);
      console.log(`📊 Migration de ${employees.length} employés...`);
      
      let successCount = 0;
      for (const emp of employees) {
        try {
          // Préparer les données
          const employeeData = {
            "Matricule": emp.Matricule,
            "Nom": emp.Nom,
            "Prénom": emp.Prénom,
            "Adresse": emp.Adresse,
            "N° Téléphone": emp["N° Téléphone"],
            "Fonction": emp.Fonction,
            "Mode de paiement": emp["Mode de paiement"],
            "Catégorie": emp.Catégorie,
            "Compagne": emp.Compagne,
            "Salaire de base": parseFloat(String(emp["Salaire de base"]).replace(/\s/g, '').replace(',', '.') || '0'),
            "Solde initial congé": parseFloat(String(emp["Solde initial congé"]).replace(',', '.') || '0'),
            "Solde de congé": parseFloat(String(emp["Solde de congé"]).replace(',', '.') || '0'),
            "Date d'embauche": emp["Date d'embauche"]?.includes('/') 
              ? emp["Date d'embauche"].split('/').reverse().join('-')
              : emp["Date d'embauche"],
            "Ancienneté": emp.Ancienneté,
            "distance du lieu de travaille": emp["distance du lieu de travaille"],
            "droit ostie": emp["droit ostie"],
            "droit transport et repas": emp["droit transport et repas"],
            "Situation maritale": emp["Situation maritale"],
            "Nombre d'enfants": parseInt(emp["Nombre d'enfants"] || '0'),
            "Contact d'urgence - Nom et prénom": emp["Contact d'urgence - Nom et prénom"],
            "Relation": emp.Relation,
            "Adresse du contact d'urgence": emp["Adresse du contact d'urgence"],
            "Téléphone contact urgence": emp["Téléphone contact urgence"],
            "last_update": emp.last_update
          };

          const { error } = await supabase
            .from('employees')
            .insert(employeeData);

          if (error) {
            console.log(`❌ ${emp.Matricule}:`, error.message);
          } else {
            successCount++;
            console.log(`✅ ${emp.Matricule} - ${emp.Nom} ${emp.Prénom}`);
          }
        } catch (error) {
          console.log(`❌ Erreur sur ${emp.Matricule}:`, error);
        }
      }
      console.log(`🎯 ${successCount}/${employees.length} employés migrés avec succès`);
    }

    console.log('🎉 MIGRATION TERMINÉE!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

finalMigration();