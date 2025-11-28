const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build output...');

const distPath = path.join(__dirname, '..', 'dist');

// Vérifier si dist existe
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ directory does not exist!');
  process.exit(1);
}

// Lister les fichiers
console.log('📁 Contents of dist/:');
const files = fs.readdirSync(distPath, { recursive: true });
files.forEach(file => {
  const filePath = path.join(distPath, file);
  const stat = fs.statSync(filePath);
  console.log(`   ${stat.isDirectory() ? '📁' : '📄'} ${file} (${stat.size} bytes)`);
});

// Vérifier les fichiers essentiels
const essentialFiles = [
  'app.js',
  'config/data-source.js',
  'entities/User.js'
];

essentialFiles.forEach(file => {
  const fullPath = path.join(distPath, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} missing!`);
  }
});