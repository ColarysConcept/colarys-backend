// preinstall.js - Empˆche l'installation de libpq 
const fs = require('fs'); 
const path = require('path'); 
 
console.log('?? Checking for libpq...'); 
 
// Empˆche l'installation de libpq 
if (process.env.npm_config_argv) { 
  if (npmArgs.some(arg = { 
    console.error('? libpq is blocked for Vercel compatibility'); 
    process.exit(1); 
  } 
} 
 
console.log('? libpq check passed'); 
