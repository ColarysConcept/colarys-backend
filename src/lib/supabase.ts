// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Initialisation Supabase...');
console.log(`SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅' : '❌'}`);

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Supabase client créé avec succès');
  } catch (error) {
    console.error('❌ Erreur création client Supabase:', error);
    supabase = null;
  }
} else {
  console.log('⚠️ Supabase non configuré, continuation sans Supabase');
  supabase = null;
}

export { supabase };