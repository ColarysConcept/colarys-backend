// api/index.js → Version finale qui charge TON vrai backend compilé
console.log('Starting Colarys API - Full Version (TypeScript compiled)');

const path = require('path');

module.exports = async (req, res) => {
  try {
    // Charge l'app compilée en TypeScript
    const app = require(path.join(process.cwd(), 'dist', 'app.js'));
    
    // Gestion CORS manuelle
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return app.default ? app.default(req, res) : app(req, res);
  } catch (error) {
    console.error('Failed to load app:', error);
    res.status(500).json({
      error: "Server failed to start",
      message: error.message,
      tip: "Check if 'npm run build' succeeded and dist/app.js exists"
    });
  }
};