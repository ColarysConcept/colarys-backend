// build-vercel.js - Script de build compatible Vercel
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

try {
  // 1. Build TypeScript
  console.log('📦 Building TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  // 2. Créer le dossier public s'il n'existe pas
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public directory');
  }
  
  // 3. Copier les fichiers statiques si ils existent
  const srcPublicDir = path.join(__dirname, 'src', 'public');
  if (fs.existsSync(srcPublicDir)) {
    console.log('📁 Copying static files...');
    copyFolderRecursiveSync(srcPublicDir, publicDir);
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursiveSync(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}