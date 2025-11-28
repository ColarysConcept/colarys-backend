// src/routes/debugRoutes.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Route de debug Supabase
router.get('/debug-supabase', async (_req, res) => {
  try {
    console.log('🔍 Debug Supabase Vercel...');
    
    // Test connexion
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('count')
      .limit(1);

    // Compter les employés
    const { count: employeeCount, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    // Récupérer quelques employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('Matricule, Nom, Prénom, "Date d\'embauche"')
      .limit(5);

    res.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        supabase: {
          url: process.env.SUPABASE_URL ? '✅ Configurée' : '❌ Manquante',
          connected: !testError,
          testError: testError?.message,
          employeeCount: employeeCount || 0,
          countError: countError?.message,
          sampleEmployees: employees || [],
          employeeError: empError?.message
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;