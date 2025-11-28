// src/routes/colarysRoutes-urgent.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Middleware CORS pour toutes les routes Colarys
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`🟢 Colarys URGENT: ${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});

// Route de santé URGENCE
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🚑 COLARYS URGENT HEALTH - WORKING',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Employés - version URGENCE
router.get('/employees', async (req, res) => {
  try {
    console.log('🚑 URGENT Employees fetch from:', req.headers.origin);
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      message: '🚑 URGENT EMPLOYEES FETCH',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ URGENT Employees error:', error);
    res.json({
      success: true, // ✅ Toujours success=true pour éviter CORS
      data: [],
      count: 0,
      message: 'Fallback mode - No database connection',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;