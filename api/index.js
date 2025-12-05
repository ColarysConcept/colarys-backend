// api/index.js → CHARGE TON VRAI BACKEND COMPILÉ
console.log('Colarys API – Démarrage version complète (TypeScript → dist)')

const path = require('path')

module.exports = async (req, res) => {
  try {
    // Charge l'app Express compilée en TypeScript
    const appModule = require(path.join(process.cwd(), 'dist', 'app.js'))
    const app = appModule.default || appModule

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    return app(req, res)
  } catch (error) {
    console.error('Impossible de charger le backend:', error.message)
    res.status(500).json({
      error: 'Backend non démarré',
      message: error.message,
      details: 'Vérifie que "npm run build" a bien créé dist/app.js',
      timestamp: new Date().toISOString()
    })
  }
}