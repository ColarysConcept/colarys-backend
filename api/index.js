// api/index.js - Version avec build automatique
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Vérifier si dist existe, sinon builder
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building TypeScript...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Importer l'app compilée
const app = require('../dist/app').default;
module.exports = app;