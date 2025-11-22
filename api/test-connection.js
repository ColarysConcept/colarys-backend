// api/test-connection.js - TEST DE CONNEXION SIMPLE
const { Client } = require('pg');

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🔧 Testing database connection...');
    console.log('Host:', process.env.POSTGRES_HOST ? '***' : 'NOT SET');
    console.log('User:', process.env.POSTGRES_USER ? '***' : 'NOT SET');
    
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      port: 5432,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      query_timeout: 10000
    });
    
    await client.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    await client.end();
    
    const responseTime = Date.now() - startTime;
    
    res.json({ 
      status: 'SUCCESS',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      time: result.rows[0].time,
      version: result.rows[0].version.split(' ').slice(0, 3).join(' ')
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(500).json({ 
      status: 'ERROR',
      database: 'connection_failed',
      responseTime: `${responseTime}ms`,
      error: error.message,
      environment: {
        hasHost: !!process.env.POSTGRES_HOST,
        hasUser: !!process.env.POSTGRES_USER,
        hasPassword: !!process.env.POSTGRES_PASSWORD,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
};