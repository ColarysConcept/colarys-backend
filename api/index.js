// api/index.js - VERSION SANS DB
const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')());

app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "API without database", timestamp: new Date().toISOString() });
});

app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    message: "Sample data - Database unavailable",
    data: [
      { id: 1, matricule: "SAMPLE001", nom: "Test", prenom: "Agent", poste: "Developer" },
      { id: 2, matricule: "SAMPLE002", nom: "Demo", prenom: "User", poste: "Designer" }
    ]
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    message: "Sample data - Database unavailable",
    data: [
      { id: 1, name: "Admin", email: "admin@colarys.com", role: "admin" },
      { id: 2, name: "User", email: "user@colarys.com", role: "user" }
    ]
  });
});

console.log('✅ No-DB API deployed');
module.exports = app;