// src/controllers/debugController.ts
import { Request, Response } from 'express';

export function debugEnv(req: Request, res: Response) {
  // NE montrez PAS les clés complètes en production
  res.json({
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ? '✅' : '❌',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌',
    supabaseKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    port: process.env.PORT,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('POSTGRES') || key.includes('VERCEL')
    )
  });
}

export function debugSimple(req: Request, res: Response) {
  res.json({ 
    message: 'API fonctionne - debug mode',
    timestamp: new Date().toISOString()
  });
}