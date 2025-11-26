// api/debug-db.js
const { AppDataSource } = require('./dist/config/data-source');

module.exports = async (req, res) => {
  console.log('🔧 Debug DB endpoint called');
  
  const envVars = {
    POSTGRES_HOST: process.env.POSTGRES_HOST ? '***' : 'MISSING',
    POSTGRES_USER: process.env.POSTGRES_USER ? '***' : 'MISSING', 
    POSTGRES_DB: process.env.POSTGRES_DB ? '***' : 'MISSING',
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL
  };

  try {
    console.log('🔄 Testing database connection...');
    
    let connectionStatus = 'UNKNOWN';
    let dbVersion = null;
    let errorDetails = null;

    // Test 1: Vérifier si la DB est déjà initialisée
    if (AppDataSource.isInitialized) {
      console.log('✅ DB already initialized');
      connectionStatus = 'ALREADY_CONNECTED';
    } else {
      console.log('🔄 Initializing database...');
      try {
        await AppDataSource.initialize();
        connectionStatus = 'NEW_CONNECTION';
        console.log('✅ DB initialized successfully');
      } catch (initError) {
        connectionStatus = 'INIT_FAILED';
        errorDetails = {
          name: initError.name,
          code: initError.code,
          message: initError.message,
          stack: process.env.NODE_ENV === 'development' ? initError.stack : undefined
        };
        console.error('❌ DB initialization failed:', initError.message);
      }
    }

    // Test 2: Exécuter une requête si connecté
    if (AppDataSource.isInitialized) {
      try {
        const result = await AppDataSource.query('SELECT version()');
        dbVersion = result[0]?.version;
        console.log('✅ DB query successful');
      } catch (queryError) {
        connectionStatus = 'QUERY_FAILED';
        errorDetails = {
          name: queryError.name,
          code: queryError.code, 
          message: queryError.message
        };
        console.error('❌ DB query failed:', queryError.message);
      }
    }

    res.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        connectionStatus: connectionStatus,
        environment: envVars,
        database: {
          isInitialized: AppDataSource.isInitialized,
          version: dbVersion,
          error: errorDetails
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug endpoint crashed:', error);
    res.status(500).json({
      success: false,
      error: "Debug endpoint failed",
      message: error.message,
      environment: envVars
    });
  }
};