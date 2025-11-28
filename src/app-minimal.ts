// src/app-minimal.ts - SERVEUR URGENCE FONCTIONNEL
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

console.log('🚑 URGENCY: Starting MINIMAL Colarys API Server...');

dotenv.config();

const app = express();

// 🔥 CORS ULTRA PERMISSIF
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// 🔥 MIDDLEWARE CORS MANUEL
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 🔥 ROUTES MINIMALES FONCTIONNELLES

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "🚑 URGENCY: Colarys API MINIMAL Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "URGENCY-1.0"
  });
});

// Test CORS
app.get('/api/cors-test', (_req, res) => {
  res.json({
    success: true,
    message: "✅ CORS TEST SUCCESS - SERVER IS RUNNING",
    timestamp: new Date().toISOString(),
    status: "URGENCY_MODE"
  });
});

// Santé
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: "HEALTHY",
    message: "🚑 URGENCY HEALTH CHECK - SERVER OPERATIONAL",
    timestamp: new Date().toISOString()
  });
});

// Routes Colarys minimales
app.get('/api/colarys/health', (_req, res) => {
  res.json({
    success: true,
    message: "✅ Colarys Service - URGENCY MODE",
    timestamp: new Date().toISOString(),
    service: "Colarys Minimal"
  });
});

app.get('/api/colarys/employees', async (_req, res) => {
  try {
    // Données mockées en urgence
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
  } catch (error) {
    res.json({
      success: true,
      data: [],
      count: 0,
      message: "Fallback mode active",
      timestamp: new Date().toISOString()
    });
  }
});

// Gestionnaire d'erreur global
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('❌ Minimal Server Error:', error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// ==================== ROUTES AUTHENTIFICATION ====================

// Route de login
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  
  const { username, password } = req.body;

  // Mock authentication - À REMPLACER par votre vraie logique
  if (username === 'admin' && password === 'admin') {
    res.json({
      success: true,
      message: "✅ Login successful",
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@colarys.com',
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

// Route de vérification de token
app.get('/api/auth/verify', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@colarys.com',
      role: 'administrator'
    },
    message: "✅ Token is valid"
  });
});

// Route de logout
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: "✅ Logout successful"
  });
});

// Route 404 - DOIT RESTER EN DERNIER
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    requestedUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Route 404
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
  console.log(`🚑 URGENCY SERVER: Running on port ${PORT}`);
  console.log(`✅ MINIMAL SERVER READY - NO CRASH`);
});

export default app;