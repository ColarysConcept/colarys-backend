// src/lib/supabase.ts - VERSION PRODUCTION
import { createClient } from '@supabase/supabase-js'

console.log('🔧 Initialisation Supabase...');

// Configuration pour production
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VARIABLES SUPABASE MANQUANTES:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  
  // En production, on ne crash pas mais on log l'erreur
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  Supabase non configuré, mais continuation en mode dégradé');
  } else {
    throw new Error('Variables Supabase manquantes');
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Test de connexion au démarrage
async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase non configuré - skip connection test');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
  }
}

// Exécuter le test au chargement
testSupabaseConnection();