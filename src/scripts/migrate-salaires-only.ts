// src/scripts/migrate-salaires-only.ts
import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function migrateSalairesOnly() {
  console.log('🚀 MIGRATION DES SALAIRES SEULEMENT...');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    // Vérifier que la table salaires existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('salaires')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table salaires non accessible:', tableError.message);
      return;
    }
    console.log('✅ Table salaires accessible');

    // Migrer les salaires
    const salairesPath = path.join(dataDir, 'salaires.json');
    if (fs.existsSync(salairesPath)) {
      const salairesData = fs.readFileSync(salairesPath, 'utf-8');
      const salaires = JSON.parse(salairesData);
      console.log(`📊 Migration de ${Object.keys(salaires).length} enregistrements de salaire...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const [key, salaireData] of Object.entries(salaires as any)) {
        try {
          const [matricule, year, month] = key.split('_');
          
          // Nettoyer les noms de colonnes (corriger les apostrophes)
          const cleanedData = {
            "Prime de production": salaireData["Prime de production"] || 0,
            "Prime d'assiduité": salaireData["Prime d’assiduité"] || salaireData["Prime d'assiduité"] || 0,
            "Prime d'ancienneté": salaireData["Prime d’ancienneté"] || salaireData["Prime d'ancienneté"] || 0,
            "Prime élite": salaireData["Prime élite"] || 0,
            "Prime de responsabilité": salaireData["Prime de responsabilité"] || 0,
            "Social": salaireData["Social"] || 15000,
            "Avance sur salaire": salaireData["Avance sur salaire"] || 0
          };

          const { error } = await supabase
            .from('salaires')
            .upsert({
              matricule,
              year: parseInt(year),
              month: parseInt(month),
              ...cleanedData
            }, {
              onConflict: 'matricule,year,month'
            });

          if (error) {
            console.log(`❌ Erreur sur ${key}:`, error.message);
            errorCount++;
          } else {
            successCount++;
            if (successCount % 10 === 0) {
              console.log(`📈 ${successCount} salaires migrés...`);
            }
          }
        } catch (error) {
          console.log(`❌ Erreur sur salaire ${key}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎯 ${successCount} salaires migrés avec succès`);
      console.log(`❌ ${errorCount} erreurs`);
    } else {
      console.log('❌ Fichier salaires.json non trouvé');
    }

    console.log('🎉 MIGRATION DES SALAIRES TERMINÉE!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

migrateSalairesOnly();