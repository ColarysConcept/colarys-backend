"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
exports.testConnection = testConnection;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.handleSupabaseError = handleSupabaseError;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('SUPABASE_URL:', supabaseUrl || 'non défini');
    console.error('SUPABASE_KEY:', supabaseKey ? 'présent (longueur: ' + supabaseKey.length + ')' : 'manquant');
    throw new Error('Configuration Supabase incomplète. Vérifiez vos variables d\'environnement.');
}
console.log('✅ Configuration Supabase chargée - URL:', supabaseUrl);
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'x-application-name': 'gestion-planning-app'
        }
    }
});
exports.supabaseAdmin = supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: true
        }
    })
    : null;
async function testConnection() {
    try {
        const { data, error } = await exports.supabase
            .from('plannings')
            .select('id')
            .limit(1)
            .maybeSingle();
        if (error) {
            if (error.code === '42P01') {
                console.log('⚠️ Table plannings non trouvée, test avec une requête système');
                const { error: sysError } = await exports.supabase.rpc('version');
                if (sysError) {
                    console.error('❌ Erreur connexion Supabase:', error.message);
                    return false;
                }
                console.log('✅ Connexion Supabase réussie (via RPC)');
                return true;
            }
            console.error('❌ Erreur connexion Supabase:', error.message);
            return false;
        }
        console.log('✅ Connexion Supabase réussie');
        return true;
    }
    catch (error) {
        console.error('❌ Erreur connexion:', error);
        return false;
    }
}
async function checkDatabaseHealth() {
    try {
        const startTime = Date.now();
        const { error } = await exports.supabase.from('plannings').select('count').limit(1);
        const responseTime = Date.now() - startTime;
        return {
            connected: !error,
            responseTime: responseTime,
            error: error === null || error === void 0 ? void 0 : error.message,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
function handleSupabaseError(error) {
    if (!error)
        return 'Erreur inconnue';
    if (error.code) {
        switch (error.code) {
            case '23505': return 'Doublon détecté';
            case '23503': return 'Violation de clé étrangère';
            case '23502': return 'Valeur nulle non autorisée';
            case '42P01': return 'Table non trouvée';
            case '42703': return 'Colonne non trouvée';
            default: return `Erreur database: ${error.code} - ${error.message}`;
        }
    }
    return error.message || 'Erreur inconnue';
}
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Mode développement - Supabase config:');
    console.log('URL:', supabaseUrl);
    console.log('Key présent:', !!supabaseKey);
    console.log('Service Key présent:', !!supabaseServiceKey);
}
