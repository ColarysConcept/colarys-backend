// api/minimal.js - VERSION ULTIMA : AUCUNE SIGNATURE
console.log('COLARYS API - Mode Ultra Simple & Stable');

const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion DB
let AppDataSource = null;
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return;
  try {
    AppDataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: { rejectUnauthorized: false },
      logging: false
    });
    await AppDataSource.initialize();
    dbConnected = true;
    console.log('DB connectée');
  } catch (err) {
    console.log('DB non disponible (mode dégradé OK)');
  }
};
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: "COLARYS API - Ultra Simple",
    status: "OK",
    db: dbConnected ? "connectée" : "déconnectée",
    version: "v3.0-no-signature"
  });
});

app.get('/api/health', (req, res) => res.json({ status: "OK", db: dbConnected }));

// POINTAGE ENTRÉE
app.post('/api/presences/entree', async (req, res) => {
  const { matricule, nom, prenom, shift = "JOUR" } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ success: false, error: "Nom et prénom requis" });
  }

  try {
    if (!dbConnected) await connectDB();

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 8);

    // Vérifier doublon
    const exist = await AppDataSource.query(
      `SELECT id FROM presence 
       WHERE date = $1 
       AND agent_id IN (SELECT id FROM agents_colarys WHERE LOWER(nom) = LOWER($2) AND LOWER(prenom) = LOWER($3))`,
      [today, nom.trim(), prenom.trim()]
    );

    if (exist.length > 0) {
      return res.json({ success: true, message: "Déjà pointé aujourd'hui" });
    }

    // Créer ou récupérer agent
    let agent = await AppDataSource.query(
      `SELECT id FROM agents_colarys WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2)`,
      [nom.trim(), prenom.trim()]
    );

    let agentId;
    if (agent.length === 0) {
      const result = await AppDataSource.query(
        `INSERT INTO agents_colarys (matricule, nom, prenom, campagne, date_creation) 
         VALUES ($1, $2, $3, 'Standard', NOW()) RETURNING id`,
        [matricule || null, nom.trim(), prenom.trim()]
      );
      agentId = result[0].id;
    } else {
      agentId = agent[0].id;
    }

    // Créer présence
    await AppDataSource.query(
      `INSERT INTO presence (agent_id, date, heure_entree, shift, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [agentId, today, now, shift]
    );

    res.json({
      success: true,
      message: "Entrée pointée",
      heure: now
    });

  } catch (err) {
    console.error('Erreur entrée:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// POINTAGE SORTIE
app.post('/api/presences/sortie', async (req, res) => {
  const { nom, prenom } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ success: false, error: "Nom et prénom requis" });
  }

  try {
    if (!dbConnected) await connectDB();

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 8);

    const result = await AppDataSource.query(
      `UPDATE presence SET heure_sortie = $1, heures_travaillees = 8.00
       WHERE date = $2 AND heure_sortie IS NULL
       AND agent_id IN (SELECT id FROM agents_colarys WHERE LOWER(nom) = LOWER($3) AND LOWER(prenom) = LOWER($4))
       RETURNING id`,
      [now, today, nom.trim(), prenom.trim()]
    );

    if (result.length === 0) {
      return res.status(400).json({ success: false, error: "Aucune entrée aujourd'hui" });
    }

    res.json({ success: true, message: "Sortie pointée", heure: now });

  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// HISTORIQUE
app.get('/api/presences/historique', async (req, res) => {
  const { dateDebut, dateFin, matricule, nom, prenom } = req.query;

  try {
    if (!dbConnected) await connectDB();

    let sql = `
      SELECT p.date, p.heure_entree, p.heure_sortie, p.shift,
             a.matricule, a.nom, a.prenom
      FROM presence p
      JOIN agents_colarys a ON p.agent_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (dateDebut) { sql += ` AND p.date >= $${params.length + 1}`; params.push(dateDebut); }
    if (dateFin) { sql += ` AND p.date <= $${params.length + 1}`; params.push(dateFin); }
    if (matricule) { sql += ` AND a.matricule ILIKE $${params.length + 1}`; params.push(`%${matricule}%`); }
    if (nom) { sql += ` AND a.nom ILIKE $${params.length + 1}`; params.push(`%${nom}%`); }
    if (prenom) { sql += ` AND a.prenom ILIKE $${params.length + 1}`; params.push(`%${prenom}%`); }

    sql += ` ORDER BY p.date DESC, p.heure_entree DESC`;

    const data = await AppDataSource.query(sql, params);

    res.json({
      success: true,
      data,
      total: data.length
    });

  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = app;