// api/debug-db.js - VERSION ULTRA-SIMPLE
module.exports = async (req, res) => {
  console.log('🔧 Debug DB endpoint called - SIMPLE VERSION');
  
  try {
    // Juste retourner les variables d'environnement sans toucher à la DB
    const envInfo = {
      POSTGRES_HOST: process.env.POSTGRES_HOST ? 'SET' : 'MISSING',
      POSTGRES_USER: process.env.POSTGRES_USER ? 'SET' : 'MISSING',
      POSTGRES_DB: process.env.POSTGRES_DB ? 'SET' : 'MISSING',
      POSTGRES_PORT: process.env.POSTGRES_PORT || '6543 (default)',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    };

    console.log('📋 Environment check:', envInfo);

    res.json({
      success: true,
      message: "Debug endpoint working - Environment variables check",
      environment: envInfo,
      nextSteps: [
        "1. Check if all environment variables are set in Vercel",
        "2. Verify Supabase database is running",
        "3. Check database credentials"
      ]
    });

  } catch (error) {
    console.error('💥 Simple debug failed:', error);
    res.json({
      success: false,
      error: "Even simple debug failed",
      message: error.message
    });
  }
};