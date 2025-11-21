// api/index.js - VERSION SIMPLIFIÉE
console.log('🚀 Colarys API - Starting from compiled TypeScript...');

// Utilisez directement dist/app.js puisque c'est le vrai point d'entrée
const app = require('../dist/app').default;
module.exports = app;