// api/index.js
console.log('Colarys API – Démarrage version COMPLÈTE')

const path = require('path')

module.exports = async (req, res) => {
  try {
    const app = require(path.join(process.cwd(), 'dist', 'app.js'))
    const finalApp = app.default || app

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()

    return finalApp(req, res)
  } catch (error) {
    console.error('Backend échoué:', error.message)
    res.status(500).json({
      error: 'Backend non chargé',
      message: error.message,
      tip: 'Vérifie que npm run build a créé dist/app.js'
    })
  }
}