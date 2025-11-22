// api/test-db-simple.js - TEST DE CONNEXION SIMPLE
const { Client } = require('pg');

module.exports = async (req, res) => {
  try {
    console.log('🔧 Testing Supabase Pooler connection...');
    
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT || 6543,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000
    });

    await client.connect();
    const result = await client.query('SELECT version(), NOW() as time');
    await client.end();

    res.json({
      success: true,
      message: "✅ Database connected via Pooler",
      version: result.rows[0].version,
      time: result.rows[0].time,
      connection: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER ? '***' : 'NOT SET',
        database: process.env.POSTGRES_DATABASE
      }
    });

  } catch (error) {
    console.error('❌ Simple connection test failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      details: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER ? '***' : 'NOT SET',
        suggestion: "Check SSL configuration and credentials"
      }
    });
  }
};