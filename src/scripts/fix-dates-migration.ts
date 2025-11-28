// src/scripts/fix-dates-migration.ts
import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Format "25-08-12" → "2025-08-12"
  if (dateStr.match(/^\d{2}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `20${year}-${month}-${day}`;
  }
  
  // Format "12/08/25" → "2025-08-12"
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
    const [day, month, year] = dateStr.split('/');
    return `20${year}-${month}-${day}`;
  }
  
  // Format "01/07/2021" → "2021-07-01"
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  
  return dateStr; // Retourne tel quel si déjà bon format
}

async function fixDatesMigration() {
  console.log('🚀 CORRECTION DES DATES ET MIGRATION FINALE...');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    // Migrer les employés avec dates corrigées
    const employesPath = path.join(dataDir, 'employes.json');
    if (fs.existsSync(employesPath)) {
      const employeesData = fs.readFileSync(employesPath, 'utf-8');
      const employees = JSON.parse(employeesData);
      console.log(`📊 Migration des ${employees.length} employés avec dates corrigées...`);
      
      let successCount = 0;
      for (const emp of employees) {
        try {
          // Corriger la date d'embauche
          const dateEmbaucheCorrigee = parseDate(emp["Date d'embauche"]);
          
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
            "Date d'embauche": dateEmbaucheCorrigee,
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

          console.log(`📅 ${emp.Matricule}: "${emp["Date d'embauche"]}" → "${dateEmbaucheCorrigee}"`);

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

    console.log('🎉 MIGRATION AVEC DATES CORRIGÉES TERMINÉE!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

fixDatesMigration();