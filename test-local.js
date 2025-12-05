const { Client } = require('pg'); 
 
async function test() { 
  try { 
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
 
    const client = new Client({ 
      connectionString: "postgresql://postgres.wmfwddpqlwmhmbgbpigb:Lyp6iCFltNLE93O1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require", 
      ssl: { rejectUnauthorized: false } 
    }); 
 
    await client.connect(); 
    console.log('? Local: Connected to Supabase!'); 
 
    const result = await client.query('SELECT NOW()'); 
    console.log('Time:', result.rows[0].now); 
 
    await client.end(); 
    console.log('? Test completed successfully!'); 
  } catch (error) { 
    console.error('? Local failed:', error.message); 
  } 
} 
 
test(); 
