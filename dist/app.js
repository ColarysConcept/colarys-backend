// dist/app.js - BACKEND ULTRA PERMISSIF
const express = require("express");
const cors = require("cors");

console.log('🚑 URGENCY: Starting Colarys API Server...');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ✅✅✅ ROUTE LOGIN ULTRA PERMISSIVE ✅✅✅
app.post("/api/auth/login", (req, res) => {
  console.log("🔐 Login attempt - Full body:", JSON.stringify(req.body));
  
  // ✅ ACCEPTE username OU email
  const { username, email, password } = req.body;
  
  const userIdentifier = username || email;
  console.log("User identifier:", userIdentifier, "Password:", password);

  // ✅ ACCEPTE multiple combinations
  if (
    (userIdentifier === "ressource.prod@gmail.com" && password === "admin") ||
    (userIdentifier === "admin" && password === "admin") ||
    (userIdentifier === "test" && password === "test")
  ) {
    console.log("✅ Login SUCCESS for:", userIdentifier);
    res.json({
      success: true,
      message: "✅ Login successful",
      user: {
        id: 1,
        username: "admin",
        email: "ressource.prod@gmail.com",
        role: "administrator"
      },
      token: "mock-jwt-token-" + Date.now()
    });
  } else {
    console.log("❌ Login FAILED for:", userIdentifier);
    res.status(401).json({ 
      success: false, 
      error: "❌ Invalid credentials",
      hint: "Try: email: 'ressource.prod@gmail.com' + password: 'admin'"
    });
  }
});

// Routes minimales
app.get("/", (req, res) => {
  res.json({ message: "🚑 Colarys API Server", status: "OK" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "HEALTHY" });
});

app.get("/api/colarys/employees", (req, res) => {
  res.json({ 
    success: true, 
    data: [{ Matricule: "EMP001", Nom: "TEST", Prénom: "User" }]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚑 SERVER: Running on port ${PORT}`);
});

module.exports = app;