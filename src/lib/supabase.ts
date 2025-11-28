// src/lib/supabase.ts - VERSION VERCEL
import { createClient } from '@supabase/supabase-js'

// Configuration pour Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Configuration Supabase Vercel:');
console.log('URL:', supabaseUrl ? '✅ Trouvée' : '❌ Manquante');
console.log('Clé:', supabaseKey ? '✅ Trouvée' : '❌ Manquante');

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    ❌ Variables Supabase manquantes sur Vercel!
    
    Vérifiez dans Vercel Dashboard > Settings > Environment Variables:
    
    SUPABASE_URL=https://wmfwddpqlwmhmbgbpigb.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZndkZHBxbHdtaG1iZ2JwaWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU5NjU4NCwiZXhwIjoyMDY4MTcyNTg0fQ.mTxHqa4E2abbWDaaWv_MXOys1bl-0oatAOKrpKT1nkY
    
    Obtenez ces valeurs dans Supabase Dashboard > Settings > API
  `);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});