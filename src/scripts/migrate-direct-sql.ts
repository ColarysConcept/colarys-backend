// src/scripts/migrate-direct-sql.ts
import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function migrateWithDirectSQL() {
  console.log('🚀 Migration directe avec SQL...');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    // 1. Migrer les employés avec SQL direct
    const employesPath = path.join(dataDir, 'employes.json');
    if (fs.existsSync(employesPath)) {
      const employeesData = fs.readFileSync(employesPath, 'utf-8');
      const employees = JSON.parse(employeesData);
      console.log(`📊 Migration de ${employees.length} employés avec SQL direct...`);
      
      for (const emp of employees) {
        try {
          // Conversion des dates
          let dateEmbauche = emp["Date d'embauche"];
          if (dateEmbauche && dateEmbauche.includes('/')) {
            const [day, month, year] = dateEmbauche.split('/');
            dateEmbauche = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }

          const { error } = await supabase
            .from('employees')
            .insert({
              "Matricule": emp.Matricule,
              "Nom": emp.Nom,
              "Prénom": emp.Prénom,
              "Adresse": emp.Adresse,
              "N° Téléphone": emp["N° Téléphone"],
              "Fonction": emp.Fonction,
              "Mode de paiement": emp["Mode de paiement"],
              "Catégorie": emp.Catégorie,
              "Compagne": emp.Compagne,
              "Salaire de base": parseFloat(emp["Salaire de base"]?.replace(/\s/g, '') || '0'),
              "Solde initial congé": parseFloat(emp["Solde initial congé"]?.replace(',', '.') || '0'),
              "Solde de congé": parseFloat(emp["Solde de congé"]?.replace(',', '.') || '0'),
              "Date d'embauche": dateEmbauche,
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
            });

          if (error) {
            console.log(`❌ Erreur SQL sur ${emp.Matricule}:`, error.message);
          } else {
            console.log(`✅ Employé migré: ${emp.Matricule} - ${emp.Nom} ${emp.Prénom}`);
          }
        } catch (error) {
          console.log(`❌ Erreur sur ${emp.Matricule}:`, error);
        }
      }
    }

    // 2. Migrer les salaires
    const salairesPath = path.join(dataDir, 'salaires.json');
    if (fs.existsSync(salairesPath)) {
      const salairesData = fs.readFileSync(salairesPath, 'utf-8');
      const salaires = JSON.parse(salairesData);
      console.log(`📊 Migration de ${Object.keys(salaires).length} salaires...`);
      
      let count = 0;
      for (const [key, salaireData] of Object.entries(salaires as any)) {
        try {
          const [matricule, year, month] = key.split('_');
          
          const { error } = await supabase
            .from('salaires')
            .upsert({
              matricule,
              year: parseInt(year),
              month: parseInt(month),
              "Prime de production": salaireData["Prime de production"] || 0,
              "Prime d'assiduité": salaireData["Prime d’assiduité"] || 0,
              "Prime d'ancienneté": salaireData["Prime d’ancienneté"] || 0,
              "Prime élite": salaireData["Prime élite"] || 0,
              "Prime de responsabilité": salaireData["Prime de responsabilité"] || 0,
              "Social": salaireData["Social"] || 15000,
              "Avance sur salaire": salaireData["Avance sur salaire"] || 0
            });

          if (!error) {
            count++;
            if (count % 10 === 0) console.log(`📈 ${count} salaires migrés...`);
          }
        } catch (error) {
          console.log(`❌ Erreur sur salaire ${key}:`, error);
        }
      }
      console.log(`✅ ${count} salaires migrés au total`);
    }

    console.log('🎉 Migration SQL directe terminée!');
    
  } catch (error) {
    console.error('❌ Erreur migration SQL:', error);
  }
}

migrateWithDirectSQL();