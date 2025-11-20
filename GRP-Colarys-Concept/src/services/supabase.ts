// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Remplacez avec vos vraies valeurs de Supabase
const supabaseUrl = 'https://votre-projet.supabase.co';
const supabaseAnonKey = 'votre-anon-key-ici';

// Créez et exportez le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;