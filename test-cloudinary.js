const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dmqcvee8v',
  api_key: '561123273342425',
  api_secret: 'cGd2WxDfnB3LEDpXcixqInxaaiY'
});

console.log('🔧 Testing Cloudinary configuration...');
console.log('Cloud Name:', 'dmqcvee8v');
console.log('API Key:', '561123273342425');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connecté avec succès!');
    console.log('Réponse:', result);
  })
  .catch(error => {
    console.error('❌ Erreur Cloudinary:');
    console.error('Message:', error.message);
    console.error('Code:', error.http_code);
    console.error('Détails:', error);
  });