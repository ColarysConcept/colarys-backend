"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ SUPABASE_URL:', process.env.SUPABASE_URL);
    console.error('❌ SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
    throw new Error('Missing Supabase environment variables. Please check your .env file');
}
console.log('✅ Supabase configured successfully');
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
exports.default = supabase;
