// Ajoutez cette route dans api/vercel-app.js
app.get(`${API_PREFIX}/test-db`, async (req, res) => {
  try {
    // Test de connexion basique
    const dbConfig = {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DATABASE,
      // Ne logguez jamais le mot de passe!
      password: process.env.POSTGRES_PASSWORD ? '***' : 'NOT_SET'
    };
    
    res.json({
      success: true,
      message: "Database configuration check",
      db_config: dbConfig,
      env_loaded: !!process.env.POSTGRES_HOST,
      supabase_loaded: !!process.env.SUPABASE_URL,
      jwt_loaded: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});