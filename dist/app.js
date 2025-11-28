// dist/app.js - SERVEUR CORRIGÉ (email au lieu de username)
const express = require("express");
const cors = require("cors");

console.log('🚑 URGENCY: Starting Colarys API Server...');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.get('/', (_req, res) => {
  res.json({
    message: "🚑 URGENCY: Colarys API MINIMAL Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "URGENCY-1.0"
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: "HEALTHY",
    message: "🚑 URGENCY HEALTH CHECK - SERVER OPERATIONAL",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cors-test', (_req, res) => {
  res.json({
    success: true,
    message: "✅ CORS TEST SUCCESS - SERVER IS RUNNING",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/colarys/health', (_req, res) => {
  res.json({
    success: true,
    message: "✅ Colarys Service - URGENCY MODE",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/colarys/employees', (_req, res) => {
  const mockEmployees = [
    {
      Matricule: "EMP001",
      Nom: "TEST",
      Prénom: "Urgence",
      Fonction: "Test",
      "Salaire de base": 150000
    }
  ];
  res.json({
    success: true,
    data: mockEmployees,
    count: 1,
    message: "🚑 URGENCY MODE - MOCK DATA",
    timestamp: new Date().toISOString()
  });
});

// ✅✅✅ ROUTE LOGIN CORRIGÉE - ACCEPTE EMAIL ✅✅✅
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  
  // CORRECTION : Utiliser 'email' au lieu de 'username'
  const { email, password } = req.body;

  if ((email === 'admin' || email === 'ressource.prod@gmail.com') && password === 'admin') {
    res.json({
      success: true,
      message: "✅ Login successful",
      user: {
        id: 1,
        username: 'admin',
        email: 'ressource.prod@gmail.com',
        role: 'administrator'
      },
      token: 'mock-jwt-token-for-development-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      error: "❌ Invalid credentials"
    });
  }
});

app.get('/api/auth/verify', (_req, res) => {
  res.json({
    success: true,
    user: { id: 1, username: 'admin', role: 'administrator' },
    message: "✅ Token valid"
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: "✅ Logout successful" });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    requestedUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚑 SERVER: Running on port ${PORT}`);
});

module.exports = app;