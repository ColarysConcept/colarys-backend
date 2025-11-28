// src/scripts/test-supabase-vercel.ts
import { supabase } from '../lib/supabase';

async function testSupabaseConnection() {
  console.log('🔗 Test connexion Supabase Vercel...');
  
  try {
    // Test simple de connexion
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }

    console.log('✅ Connexion Supabase réussie!');
    
    // Test de lecture des employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('Matricule, Nom, Prénom')
      .limit(5);

    if (empError) {
      console.error('❌ Erreur lecture employés:', empError);
      return false;
    }

    console.log(`📊 ${employees?.length || 0} employés trouvés`);
    console.log('👥 Exemple employés:', employees);
    
    return true;
  } catch (error) {
    console.error('💥 Erreur test Supabase:', error);
    return false;
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  testSupabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testSupabaseConnection };