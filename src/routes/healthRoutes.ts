// src/routes/healthRoutes.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Route de santé simple et robuste
router.get('/health', async (_req, res) => {
  try {
    console.log('🔍 Health check called');
    
    // Test simple de Supabase
    let dbStatus = 'unknown';
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('count')
        .limit(1);
      
      dbStatus = error ? 'error' : 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('❌ Database health check failed:', dbError);
    }

    res.json({
      success: true,
      message: 'API Colarys is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      version: '2.0.0'
    });
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;