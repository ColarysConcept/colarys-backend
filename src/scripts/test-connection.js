const { AppDataSource } = require('./dist/config/data-source');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const result = await AppDataSource.query('SELECT version()');
    console.log('✅ Connection successful!');
    console.log('Database version:', result[0].version);
    
    const entities = AppDataSource.entityMetadatas.map(e => e.name);
    console.log('Entities loaded:', entities);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();