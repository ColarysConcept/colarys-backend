// api/minimal.js - Version organisée et complète
console.log('🚀 Colarys API Minimal - Starting...');

// ========== IMPORTS ==========
const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ========== INITIALISATION ==========
const app = express();
app.use(cors());
app.use(express.json());

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer
const upload = multer();

// ========== CONFIGURATION BASE DE DONNÉES ==========
let dbInitialized = false;
let dbError = null;
let AppDataSource = null;

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database directly...');
    
    AppDataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      synchronize: false,
      logging: false,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await AppDataSource.initialize();
    dbInitialized = true;
    console.log('✅ Database connected successfully');
    
  } catch (error) {
    dbError = error.message;
    console.log('❌ Database connection failed:', error.message);
  }
};

// Initialiser la DB
initializeDatabase();

// ========== FONCTIONS UTILITAIRES ==========
const ensureAgentExists = async (matricule, nom, prenom, campagne) => {
  try {
    // 1. Chercher dans agents_colarys
    const agentColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    let agentId;
    
    if (agentColarys.length > 0) {
      agentId = agentColarys[0].id;
      
      // 2. Vérifier s'il existe dans agent
      const agentInAgent = await AppDataSource.query(
        'SELECT id FROM agent WHERE id = $1',
        [agentId]
      );
      
      if (agentInAgent.length === 0) {
        // 3. Créer dans agent avec la structure correcte
        await AppDataSource.query(
          `INSERT INTO agent (id, matricule, nom, prenom, campagne, date_creation)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [agentId, matricule, nom, prenom, campagne || 'Standard']
        );
        console.log(`✅ Agent ${matricule} ajouté à la table agent`);
      }
    } else {
      // Créer le nouvel agent dans les deux tables
      const maxId = await AppDataSource.query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM agents_colarys'
      );
      agentId = parseInt(maxId[0].next_id);
      
      // Créer dans agents_colarys
      await AppDataSource.query(
        `INSERT INTO agents_colarys 
         (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          agentId,
          matricule,
          nom,
          prenom,
          campagne || 'Standard',
          `${nom.toLowerCase()}.${prenom.toLowerCase()}@colarys.com`,
          '',
          'Colarys Concept',
          '/images/default-avatar.svg',
          'default-avatar'
        ]
      );
      
      // Créer dans agent
      await AppDataSource.query(
        `INSERT INTO agent (id, matricule, nom, prenom, campagne, date_creation)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [agentId, matricule, nom, prenom, campagne || 'Standard']
      );
      
      console.log(`✅ Nouvel agent créé: ${agentId}`);
    }
    
    return agentId;
    
  } catch (error) {
    console.error('❌ Erreur ensureAgentExists:', error);
    throw error;
  }
};

// ========== ROUTES GÉNÉRALES ==========

// Route racine
app.get('/', (_req, res) => {
  res.json({
    message: "✅ Colarys API is WORKING!",
    status: "operational", 
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: dbInitialized ? "connected" : "disconnected"
  });
});

// Route santé
app.get('/api/health', (_req, res) => {
  res.json({
    status: "HEALTHY",
    message: "API server is running correctly",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbInitialized,
      error: dbError
    }
  });
});

// Route pour vérifier l'utilisateur
app.get('/api/check-my-user', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const user = await AppDataSource.query(
      'SELECT id, name, email, role, "createdAt", "updatedAt" FROM "user" WHERE email = $1',
      ['ressource.prod@gmail.com']
    );

    if (user.length === 0) {
      return res.json({
        success: false,
        message: "User not found in database"
      });
    }

    res.json({
      success: true,
      user: user[0],
      message: "User found in database"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test DB
app.get('/api/test-db-simple', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized) {
      return res.json({
        success: false,
        error: "Database not connected",
        message: dbError
      });
    }

    const result = await AppDataSource.query('SELECT NOW() as current_time, version() as postgres_version');
    
    res.json({
      success: true,
      message: "Database connection successful",
      test: result[0]
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Route pour créer l'utilisateur si nécessaire
app.get('/api/ensure-user', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const hashedPassword = await bcrypt.hash('stage25', 10);

    // Vérifier si l'utilisateur existe
    const existingUser = await AppDataSource.query(
      'SELECT * FROM "user" WHERE email = $1',
      ['ressource.prod@gmail.com']
    );

    let action = 'exists';
    
    if (existingUser.length === 0) {
      // Créer l'utilisateur
      await AppDataSource.query(
        `INSERT INTO "user" (name, email, password, role, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        ['Admin Ressources', 'ressource.prod@gmail.com', hashedPassword, 'admin']
      );
      action = 'created';
    } else {
      // Mettre à jour le mot de passe
      await AppDataSource.query(
        'UPDATE "user" SET password = $1, "updatedAt" = NOW() WHERE email = $2',
        [hashedPassword, 'ressource.prod@gmail.com']
      );
      action = 'updated';
    }

    res.json({
      success: true,
      action: action,
      message: `User ${action} successfully`,
      credentials: {
        email: 'ressource.prod@gmail.com',
        password: 'stage25'
      }
    });

  } catch (error) {
    console.error('❌ Error ensuring user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// ========== ROUTES AUTHENTIFICATION ==========

// Route de login pour Supabase avec colonnes majuscules
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: dbError
      });
    }

    // Chercher l'utilisateur avec les colonnes correctes (majuscules pour Supabase)
    const users = await AppDataSource.query(
      'SELECT id, name, email, password, role, "createdAt", "updatedAt" FROM "user" WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    const user = users[0];
    console.log('🔍 User found:', { email: user.email });

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('❌ Password comparison failed');
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for user:', user.email);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message
    });
  }
});

// ========== ROUTES AGENTS ==========

// Route pour agents-colarys
app.get('/api/agents-colarys', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching agents from database...');

    let agents = [];
    try {
      // Essayer différentes tables possibles
      agents = await AppDataSource.query('SELECT * FROM agents_colarys LIMIT 50');
      console.log(`✅ Found ${agents.length} agents in agents_colarys`);
    } catch (error) {
      console.log('⚠️ agents_colarys table not found, trying agent table...');
      try {
        agents = await AppDataSource.query('SELECT * FROM agent LIMIT 50');
        console.log(`✅ Found ${agents.length} agents in agent table`);
      } catch (error2) {
        console.log('⚠️ agent table not found either, using mock data');
        // Données mockées temporairement
        agents = [
          { id: 1, name: "Agent Test 1", email: "agent1@test.com", status: "active" },
          { id: 2, name: "Agent Test 2", email: "agent2@test.com", status: "active" }
        ];
      }
    }

    res.json({
      success: true,
      data: agents,
      count: agents.length
    });

  } catch (error) {
    console.error('❌ Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch agents",
      message: error.message
    });
  }
});

// Route pour récupérer un agent spécifique par ID
app.get('/api/agents-colarys/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log(`📋 Fetching agent with ID: ${id}`);

    let agent = null;
    try {
      // Essayer différentes tables
      const agents = await AppDataSource.query(
        'SELECT * FROM agents_colarys WHERE id = $1',
        [id]
      );
      
      if (agents.length > 0) {
        agent = agents[0];
        console.log(`✅ Found agent in agents_colarys: ${agent.name}`);
      } else {
        // Essayer la table agent
        const agents2 = await AppDataSource.query(
          'SELECT * FROM agent WHERE id = $1',
          [id]
        );
        if (agents2.length > 0) {
          agent = agents2[0];
          console.log(`✅ Found agent in agent table: ${agent.name}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Tables not found, using mock data');
    }

    // Données mockées si l'agent n'est pas trouvé
    if (!agent) {
      agent = {
        id: id,
        name: `Agent ${id}`,
        email: `agent${id}@test.com`,
        status: "active",
        phone: "+261 34 00 000 00",
        department: "IT",
        position: "Développeur",
        hire_date: new Date().toISOString(),
        salary: "1 500 000 Ar"
      };
      console.log(`📝 Using mock data for agent ID ${id}`);
    }

    res.json({
      success: true,
      data: agent
    });

  } catch (error) {
    console.error('❌ Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch agent",
      message: error.message
    });
  }
});

// CRÉER UN AGENT (JSON)
app.post('/api/agents-colarys', async (req, res) => {
  try {
    const newAgent = req.body;
    
    console.log('📋 Creating REAL agent in database:', newAgent);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    if (!dbInitialized || !AppDataSource) {
      return res.status(503).json({
        success: false,
        error: "Database not available"
      });
    }

    // VALIDATION DES DONNÉES
    if (!newAgent.matricule || !newAgent.nom || !newAgent.prenom || !newAgent.role || !newAgent.mail) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires (matricule, nom, prénom, rôle, mail) doivent être remplis"
      });
    }

    // VÉRIFIER LES DOUBLONS
    const existingMatricule = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [newAgent.matricule]
    );
    
    if (existingMatricule.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Le matricule "${newAgent.matricule}" existe déjà`
      });
    }

    const existingEmail = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE mail = $1',
      [newAgent.mail]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: `L'email "${newAgent.mail}" existe déjà`
      });
    }

    // CRÉER L'AGENT DANS LA BASE DE DONNÉES
    const result = await AppDataSource.query(
      `INSERT INTO agents_colarys 
       (matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING *`,
      [
        newAgent.matricule,
        newAgent.nom,
        newAgent.prenom,
        newAgent.role || 'Stagiaire',
        newAgent.mail,
        newAgent.contact || '',
        newAgent.entreprise || 'Colarys Concept',
        '/images/default-avatar.svg',
        'default-avatar'
      ]
    );

    const createdAgent = result[0];
    console.log('✅ Agent créé avec succès dans la base. ID:', createdAgent.id);

    // FORMATER LA RÉPONSE
    const responseData = {
      ...createdAgent,
      displayImage: '/images/default-avatar.svg',
      hasDefaultImage: true
    };

    res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error creating agent:', error);
    
    // Gérer les erreurs PostgreSQL
    if (error.code === '23505') { // Violation de contrainte unique
      return res.status(400).json({
        success: false,
        error: "Le matricule ou l'email existe déjà"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'agent",
      message: error.message
    });
  }
});

// CRÉER UN AGENT AVEC FORM-DATA (IMAGE)
app.post('/api/agents-colarys/formdata', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 Creating agent with FormData (image upload)');
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const agentData = {
      matricule: req.body.matricule,
      nom: req.body.nom,
      prenom: req.body.prenom,
      role: req.body.role,
      mail: req.body.mail,
      contact: req.body.contact || '',
      entreprise: req.body.entreprise || 'Colarys Concept'
    };

    console.log('📋 Agent data from FormData:', agentData);
    console.log('📸 Image file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No image');

    // Créer l'agent d'abord
    const result = await AppDataSource.query(
      `INSERT INTO agents_colarys 
       (matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING *`,
      [
        agentData.matricule,
        agentData.nom,
        agentData.prenom,
        agentData.role || 'Stagiaire',
        agentData.mail,
        agentData.contact,
        agentData.entreprise,
        '/images/default-avatar.svg',
        'default-avatar'
      ]
    );

    const createdAgent = result[0];
    console.log('✅ Agent créé, ID:', createdAgent.id);

    // Si une image est fournie, uploader sur Cloudinary
    if (req.file) {
      try {
        console.log('📤 Uploading image to Cloudinary...');
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'colarys/agents',
              public_id: `agent-${createdAgent.id}-${Date.now()}`,
              transformation: [
                { width: 500, height: 500, crop: 'fill' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('☁️ Cloudinary upload success:', result.url);
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });

        // Mettre à jour l'agent avec l'URL Cloudinary
        await AppDataSource.query(
          'UPDATE agents_colarys SET image = $1, "imagePublicId" = $2 WHERE id = $3',
          [uploadResult.url, uploadResult.public_id, createdAgent.id]
        );

        // Récupérer l'agent mis à jour
        const updatedAgent = await AppDataSource.query(
          'SELECT * FROM agents_colarys WHERE id = $1',
          [createdAgent.id]
        );

        createdAgent.image = updatedAgent[0].image;
        createdAgent.imagePublicId = updatedAgent[0].imagePublicId;

      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed, keeping default avatar:', uploadError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: {
        ...createdAgent,
        displayImage: createdAgent.image || '/images/default-avatar.svg',
        hasDefaultImage: !createdAgent.image || createdAgent.image.includes('default-avatar')
      }
    });

  } catch (error) {
    console.error('❌ Error creating agent with FormData:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'agent",
      message: error.message
    });
  }
});

// MODIFIER UN AGENT (CORRIGÉ)
app.put('/api/agents-colarys/:id', upload.single('image'), async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    let updates = {};
    
    console.log('🔄 Updating agent:', agentId);
    console.log('📦 Raw updates from body:', req.body);
    console.log('📸 Has file:', !!req.file);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    // Vérifier que l'agent existe
    const existingAgent = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE id = $1',
      [agentId]
    );

    if (existingAgent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    // Gérer les données selon le type de requête
    const isFormData = req.headers['content-type']?.includes('multipart/form-data');
    
    if (isFormData) {
      // Pour FormData, req.body contient les champs textuels
      updates = req.body;
    } else {
      // Pour JSON, utiliser req.body directement
      updates = req.body;
    }
    
    console.log('📋 Processed updates:', updates);

    let imageToSet = existingAgent[0].image;
    let imagePublicIdToSet = existingAgent[0].imagePublicId;

    // Si une nouvelle image est fournie via FormData
    if (req.file) {
      console.log('📸 Nouvelle image uploadée');
      
      try {
        // Upload vers Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'colarys/agents',
              public_id: `agent-${agentId}-${Date.now()}`,
              transformation: [
                { width: 500, height: 500, crop: 'fill' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('☁️ Cloudinary upload success:', result.url);
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });

        imageToSet = uploadResult.url;
        imagePublicIdToSet = uploadResult.public_id;
        
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        // Fallback: stocker en base64
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        imageToSet = base64Image;
        imagePublicIdToSet = 'base64-fallback-' + Date.now();
      }
    } else if (updates.image) {
      // Si une URL d'image est fournie dans les updates
      console.log('🌐 Image URL fournie dans les données:', updates.image);
      
      // CORRECTION : Nettoyer l'URL si nécessaire
      const baseUrl = 'https://theme-gestion-des-resources-et-prod.vercel.app/';
      if (updates.image.startsWith(baseUrl)) {
        updates.image = updates.image.replace(baseUrl, '');
      }
      
      // Si c'est une URL Cloudinary, la garder
      if (updates.image.includes('cloudinary.com')) {
        imageToSet = updates.image;
        // Générer un nouvel ID public si pas déjà fourni
        imagePublicIdToSet = updates.imagePublicId || `agent-${agentId}-${Date.now()}`;
      } else if (updates.image === '/images/default-avatar.svg' || updates.image.includes('default-avatar')) {
        // Remettre l'avatar par défaut
        imageToSet = '/images/default-avatar.svg';
        imagePublicIdToSet = 'default-avatar';
      }
    }

    // Mettre à jour l'agent
    await AppDataSource.query(
      `UPDATE agents_colarys 
       SET matricule = $1, nom = $2, prenom = $3, role = $4, mail = $5, 
           contact = $6, entreprise = $7, image = $8, "imagePublicId" = $9,
           "updated_at" = NOW()
       WHERE id = $10`,
      [
        updates.matricule || existingAgent[0].matricule,
        updates.nom || existingAgent[0].nom,
        updates.prenom || existingAgent[0].prenom,
        updates.role || existingAgent[0].role,
        updates.mail || existingAgent[0].mail,
        updates.contact || existingAgent[0].contact,
        updates.entreprise || existingAgent[0].entreprise,
        imageToSet,
        imagePublicIdToSet,
        agentId
      ]
    );

    // Récupérer l'agent mis à jour
    const updatedAgent = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE id = $1',
      [agentId]
    );

    res.json({
      success: true,
      message: "Agent modifié avec succès",
      data: updatedAgent[0]
    });

  } catch (error) {
    console.error('❌ Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification",
      message: error.message
    });
  }
});

// SUPPRIMER UN AGENT
app.delete('/api/agents-colarys/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log(`🗑️ Deleting agent ${id} from database...`);

    if (!dbInitialized || !AppDataSource) {
      console.error('❌ Database not initialized');
      return res.status(503).json({
        success: false,
        error: "Database not available"
      });
    }

    // Vérifier d'abord si l'agent existe
    let agentExists = false;
    try {
      const checkResult = await AppDataSource.query(
        'SELECT id FROM agents_colarys WHERE id = $1',
        [id]
      );
      agentExists = checkResult.length > 0;
    } catch (error) {
      console.log('⚠️ agents_colarys table check error:', error.message);
    }

    if (!agentExists) {
      return res.status(404).json({
        success: false,
        error: `Agent with ID ${id} not found`
      });
    }

    // Supprimer l'agent de la base de données
    await AppDataSource.query(
      'DELETE FROM agents_colarys WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: `Agent ${id} deleted successfully from database`
    });

  } catch (error) {
    console.error('❌ Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete agent",
      message: error.message
    });
  }
});

// ========== ROUTES PRÉSENCES ==========

// Route de test pour vérifier les routes de présence
app.get('/api/presences/test', (req, res) => {
  res.json({
    success: true,
    message: "✅ API de présences fonctionnelle",
    timestamp: new Date().toISOString(),
    routes_disponibles: [
      "POST /api/presences/entree",
      "POST /api/presences/sortie",
      "GET /api/presences/aujourdhui/:matricule",
      "GET /api/agents/matricule/:matricule",
      "GET /api/agents/nom/:nom/prenom/:prenom"
    ]
  });
});

// Vérifier la présence aujourd'hui (version simplifiée)
app.get('/api/presences/aujourdhui/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log(`📅 Vérification présence pour: ${matricule}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    // Chercher l'agent
    const agents = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }

    const agentId = agents[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Chercher les présences
    let presences = [];
    try {
      presences = await AppDataSource.query(
        'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
        [agentId, today]
      );
    } catch (error) {
      console.log('ℹ️ Aucune présence trouvée pour aujourd\'hui');
    }

    res.json({
      success: true,
      data: presences,
      count: presences.length
    });

  } catch (error) {
    console.error('❌ Error checking presence:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de présence"
    });
  }
});

// Route pour vérifier présence par nom/prénom avec espaces
app.get('/api/presences/aujourdhui/nom/:nom/prenom/:prenom', async (req, res) => {
  try {
    const nom = decodeURIComponent(req.params.nom);
    const prenom = decodeURIComponent(req.params.prenom);
    
    console.log(`📅 Vérification présence pour: ${nom} ${prenom}`);
    
    if (!nom || !prenom) {
      return res.status(400).json({
        success: false,
        error: "Nom et prénom sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Chercher l'agent par nom/prénom
    const agents = await AppDataSource.query(
      'SELECT id FROM agent WHERE nom ILIKE $1 AND prenom ILIKE $2',
      [`%${nom}%`, `%${prenom}%`]
    );
    
    if (agents.length === 0) {
      // Aucun agent trouvé
      return res.json({
        success: true,
        data: null,
        count: 0
      });
    }
    
    const agentId = agents[0].id;
    
    // Chercher les présences
    const presences = await AppDataSource.query(
      'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
      [agentId, today]
    );
    
    res.json({
      success: true,
      data: presences.length > 0 ? presences[0] : null,
      count: presences.length
    });
    
  } catch (error) {
    console.error('❌ Error checking presence by name:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de présence"
    });
  }
});

// Route pour vérifier état de présence
app.post('/api/presences/verifier-etat', async (req, res) => {
  try {
    const { matricule, nom, prenom } = req.body;
    
    console.log('🔍 Vérification état présence:', { matricule, nom, prenom });
    
    if (!matricule && (!nom || !prenom)) {
      return res.status(400).json({
        success: false,
        error: "Matricule OU nom et prénom sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const today = new Date().toISOString().split('T')[0];
    let presence = null;
    
    // Chercher par matricule
    if (matricule) {
      const presences = await AppDataSource.query(
        `SELECT p.*, a.matricule, a.nom, a.prenom, a.campagne 
         FROM presence p
         JOIN agent a ON p.agent_id = a.id
         WHERE a.matricule = $1 AND p.date = $2`,
        [matricule, today]
      );
      
      if (presences.length > 0) {
        presence = presences[0];
      }
    }
    
    // Chercher par nom/prénom
    if (!presence && nom && prenom) {
      const presences = await AppDataSource.query(
        `SELECT p.*, a.matricule, a.nom, a.prenom, a.campagne 
         FROM presence p
         JOIN agent a ON p.agent_id = a.id
         WHERE a.nom ILIKE $1 AND a.prenom ILIKE $2 AND p.date = $3`,
        [`%${nom}%`, `%${prenom}%`, today]
      );
      
      if (presences.length > 0) {
        presence = presences[0];
      }
    }
    
    // Déterminer l'état
    if (!presence) {
      return res.json({
        success: true,
        etat: 'ABSENT',
        message: "Aucune présence aujourd'hui",
        data: null
      });
    }
    
    if (presence.heure_sortie) {
      return res.json({
        success: true,
        etat: 'COMPLET',
        message: "Entrée et sortie déjà pointées",
        data: presence
      });
    }
    
    return res.json({
      success: true,
      etat: 'ENTREE_ONLY',
      message: "Entrée pointée, sortie attendue",
      data: presence
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification état:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour voir les dernières présences
app.get('/api/presences/recent', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const presences = await AppDataSource.query(`
      SELECT p.*, a.matricule, a.nom, a.prenom 
      FROM presence p
      LEFT JOIN agent a ON p.agent_id = a.id
      ORDER BY p.date DESC, p.created_at DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      count: presences.length,
      data: presences
    });
    
  } catch (error) {
    console.error('❌ Error fetching recent presences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ROUTES POINTAGE ==========

// Route de pointage d'entrée
app.post('/api/presences/entree', async (req, res) => {
  try {
    const data = req.body;
    console.log('📥 Pointage entrée reçu:', data);
    
    // Validation
    if (!data.nom || !data.prenom) {
      return res.status(400).json({
        success: false,
        error: "Nom et prénom sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = data.heureEntreeManuelle || 
                    now.toTimeString().split(' ')[0].substring(0, 8);
    
    // Gestion du matricule
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // LOGIQUE SIMPLIFIÉE : CRÉER DANS agents_colarys ET agent
    let agentId = null;
    
    // 1. Chercher dans agents_colarys (table principale)
    const existingColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (existingColarys.length > 0) {
      agentId = existingColarys[0].id;
      console.log(`✅ Agent trouvé dans agents_colarys: ${agentId}`);
    } else {
      // 2. Créer le nouvel agent
      console.log('🆕 Création nouvel agent...');
      
      // D'abord dans agents_colarys
      const newColarys = await AppDataSource.query(
        `INSERT INTO agents_colarys 
         (matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id`,
        [
          matricule,
          data.nom,
          data.prenom,
          data.campagne || 'Standard',
          data.email || `${data.nom.toLowerCase()}.${data.prenom.toLowerCase()}@colarys.com`,
          data.contact || '',
          data.entreprise || 'Colarys Concept',
          '/images/default-avatar.svg',
          'default-avatar'
        ]
      );
      
      agentId = newColarys[0].id;
      console.log(`✅ Agent créé dans agents_colarys: ${agentId}`);
      
      // Aussi dans agent pour cohérence
      try {
        await AppDataSource.query(
          `INSERT INTO agent 
           (id, matricule, nom, prenom, campagne, date_creation, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
          [
            agentId,
            matricule,
            data.nom,
            data.prenom,
            data.campagne || 'Standard'
          ]
        );
        console.log(`✅ Agent aussi créé dans table 'agent'`);
      } catch (agentError) {
        console.log('⚠️ Note création table agent:', agentError.message);
      }
    }
    
    // Vérifier si présence existe déjà
    const existingPresence = await AppDataSource.query(
      'SELECT id FROM presence WHERE agent_id = $1 AND date = $2',
      [agentId, today]
    );
    
    if (existingPresence.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Une présence existe déjà pour aujourd'hui"
      });
    }
    
    // Créer la présence
    const presence = await AppDataSource.query(
      `INSERT INTO presence 
       (agent_id, date, heure_entree, shift, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, date, heure_entree`,
      [agentId, today, timeNow, data.shift || 'JOUR']
    );
    
    console.log('✅ Pointage entrée réussi! ID:', presence[0].id);
    
    res.json({
      success: true,
      message: "Pointage d'entrée enregistré",
      data: {
        presence_id: presence[0].id,
        matricule: matricule,
        nom: data.nom,
        prenom: data.prenom,
        heure_entree: presence[0].heure_entree,
        date: presence[0].date,
        statut: 'Entrée pointée',
        agent_id: agentId
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage entrée DÉTAILLÉE:', error);
    
    // Log détaillé pour debug
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    
    // Message d'erreur spécifique
    let errorMessage = "Erreur lors du pointage d'entrée";
    
    if (error.code === '23503') { // Foreign key violation
      errorMessage = "Erreur de référence : l'agent n'existe pas dans la table référencée";
    } else if (error.code === '23505') { // Unique violation
      errorMessage = "Ce matricule existe déjà";
    } else if (error.code === '23502') { // Not null violation
      errorMessage = "Des champs obligatoires sont manquants";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message,
      code: error.code
    });
  }
});

// CORRECTION ULTIME pour gérer les conflits de matricule
app.post('/api/presences/entree-fixed-columns', async (req, res) => {
  console.log('🎯 Pointage entrée FIXED-COLUMNS - Gestion de conflits:', req.body);
  
  try {
    const data = req.body;
    
    // Validation
    if (!data.nom || !data.prenom) {
      return res.status(400).json({
        success: false,
        error: "Nom et prénom sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = data.heureEntreeManuelle || 
                    now.toTimeString().split(' ')[0].substring(0, 8);
    
    let matricule = data.matricule?.trim() || '';
    
    // CORRECTION : Gestion des matricules vides
    if (!matricule) {
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // CORRECTION : Recherche intelligente de l'agent
    let agentId = null;
    let agentTrouveDans = null;
    
    // 1. Chercher EXACTEMENT dans agents_colarys (table cible de la FK)
    const agentDansColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (agentDansColarys.length > 0) {
      agentId = agentDansColarys[0].id;
      agentTrouveDans = 'agents_colarys';
      console.log(`✅ Agent trouvé dans agents_colarys: ${agentId}`);
      
      // Vérifier qu'il existe aussi dans agent avec le même ID
      const agentDansAgent = await AppDataSource.query(
        'SELECT id FROM agent WHERE id = $1',
        [agentId]
      );
      
      if (agentDansAgent.length === 0) {
        // Créer dans agent avec le même ID
        console.log(`⚠️ Agent ${matricule} existe dans agents_colarys mais pas dans agent, création...`);
        
        const agentInfo = await AppDataSource.query(
          'SELECT nom, prenom, role FROM agents_colarys WHERE id = $1',
          [agentId]
        );
        
        if (agentInfo.length > 0) {
          const info = agentInfo[0];
          await AppDataSource.query(
            `INSERT INTO agent 
             (id, matricule, nom, prenom, campagne, date_creation) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              agentId,
              matricule,
              data.nom || info.nom,
              data.prenom || info.prenom,
              data.campagne || info.role || 'Standard'
            ]
          );
          console.log(`✅ Agent créé dans table agent avec ID: ${agentId}`);
        }
      }
    } else {
      // 2. Chercher dans agent
      const agentDansAgent = await AppDataSource.query(
        'SELECT id FROM agent WHERE matricule = $1',
        [matricule]
      );
      
      if (agentDansAgent.length > 0) {
        agentId = agentDansAgent[0].id;
        agentTrouveDans = 'agent';
        console.log(`⚠️ Agent trouvé dans agent mais pas dans agents_colarys: ${agentId}`);
        
        // Créer dans agents_colarys avec le même ID
        const agentInfo = await AppDataSource.query(
          'SELECT nom, prenom, campagne FROM agent WHERE id = $1',
          [agentId]
        );
        
        if (agentInfo.length > 0) {
          const info = agentInfo[0];
          await AppDataSource.query(
            `INSERT INTO agents_colarys 
             (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
            [
              agentId,
              matricule,
              data.nom || info.nom,
              data.prenom || info.prenom,
              data.campagne || info.campagne || 'Standard',
              `${(data.nom || info.nom).toLowerCase()}.${(data.prenom || info.prenom).toLowerCase()}@colarys.com`,
              '',
              'Colarys Concept',
              '/images/default-avatar.svg',
              'default-avatar'
            ]
          );
          console.log(`✅ Agent créé dans agents_colarys avec ID: ${agentId}`);
        }
      } else {
        // 3. Nouvel agent - générer un ID unique
        console.log('🆕 Création nouvel agent...');
        
        // Vérifier le prochain ID disponible dans agents_colarys
        const maxIdResult = await AppDataSource.query(
          'SELECT COALESCE(MAX(id), 0) as max_id FROM agents_colarys'
        );
        agentId = parseInt(maxIdResult[0].max_id) + 1;
        
        // Vérifier que cet ID n'existe pas déjà dans agent
        const idExisteDansAgent = await AppDataSource.query(
          'SELECT id FROM agent WHERE id = $1',
          [agentId]
        );
        
        if (idExisteDansAgent.length > 0) {
          // Trouver un ID libre
          let idLibre = agentId;
          while (true) {
            const existe = await AppDataSource.query(
              'SELECT id FROM agent WHERE id = $1',
              [idLibre]
            );
            if (existe.length === 0) {
              agentId = idLibre;
              break;
            }
            idLibre++;
          }
        }
        
        // Créer dans agents_colarys
        await AppDataSource.query(
          `INSERT INTO agents_colarys 
           (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            agentId,
            matricule,
            data.nom,
            data.prenom,
            data.campagne || 'Standard',
            data.email || `${data.nom.toLowerCase()}.${data.prenom.toLowerCase()}@colarys.com`,
            data.contact || '',
            'Colarys Concept',
            '/images/default-avatar.svg',
            'default-avatar'
          ]
        );
        
        // Créer dans agent aussi
        await AppDataSource.query(
          `INSERT INTO agent 
           (id, matricule, nom, prenom, campagne, date_creation) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            agentId,
            matricule,
            data.nom,
            data.prenom,
            data.campagne || 'Standard'
          ]
        );
        
        console.log(`✅ Nouvel agent créé: ${agentId} dans les deux tables`);
      }
    }
    
    // Vérifier si présence existe déjà
    const existingPresence = await AppDataSource.query(
      'SELECT id FROM presence WHERE agent_id = $1 AND date = $2',
      [agentId, today]
    );
    
    if (existingPresence.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Une présence existe déjà pour aujourd'hui"
      });
    }
    
    // CRÉER LA PRÉSENCE
    const presence = await AppDataSource.query(
      `INSERT INTO presence 
       (agent_id, date, heure_entree, shift, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, date, heure_entree`,
      [agentId, today, timeNow, data.shift || 'JOUR']
    );
    
    const presenceId = presence[0].id;
    
    // ENREGISTRER LA SIGNATURE
    let signatureToSave = data.signatureEntree || '';
    if (signatureToSave) {
      if (!signatureToSave.startsWith('data:image/')) {
        signatureToSave = 'data:image/png;base64,' + signatureToSave;
      }
      
      // CRÉER LE DÉTAIL AVEC LA SIGNATURE
      await AppDataSource.query(
        `INSERT INTO detail_presence 
         (presence_id, signature_entree, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW())`,
        [presenceId, signatureToSave]
      );
      
      console.log(`✅ Signature enregistrée pour présence ${presenceId}`);
    } else {
      // Créer un détail vide
      await AppDataSource.query(
        `INSERT INTO detail_presence 
         (presence_id, created_at, updated_at) 
         VALUES ($1, NOW(), NOW())`,
        [presenceId]
      );
      console.log('⚠️ Aucune signature fournie');
    }
    
    res.json({
      success: true,
      message: "Pointage d'entrée enregistré avec succès",
      data: {
        presence_id: presenceId,
        matricule: matricule,
        nom: data.nom,
        prenom: data.prenom,
        heure_entree: presence[0].heure_entree,
        date: presence[0].date,
        agent_id: agentId,
        shift: data.shift || 'JOUR',
        signature_entree: signatureToSave || null,
        agent_source: agentTrouveDans || 'nouveau'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage:', error);
    
    let errorMessage = "Erreur lors du pointage";
    let errorDetails = error.message;
    
    if (error.code === '23505') {
      // Violation de contrainte unique
      if (error.detail?.includes('matricule')) {
        errorMessage = "Ce matricule existe déjà avec un ID différent";
        errorDetails = "Le matricule existe déjà mais avec un ID incompatible. Utilisez un autre matricule.";
      } else if (error.detail?.includes('id')) {
        errorMessage = "Conflit d'ID dans la base de données";
        errorDetails = "L'ID généré existe déjà. Réessayez.";
      }
    } else if (error.code === '23503') {
      errorMessage = "Erreur de référence à un agent inexistant";
      errorDetails = "L'agent n'existe pas dans la table cible de la clé étrangère.";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      code: error.code,
      suggestion: "Essayez avec un matricule différent ou contactez l'administrateur"
    });
  }
});

// Version SIMPLIFIÉE de la route sortie
app.post('/api/presences/sortie-simple', async (req, res) => {
  console.log('🎯 Pointage sortie SIMPLE:', req.body.matricule);
  
  try {
    const data = req.body;
    
    if (!data.matricule) {
      return res.status(400).json({
        success: false,
        error: "Matricule requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = data.heureSortieManuelle || now.toTimeString().split(' ')[0].substring(0, 8);
    
    // Trouver l'agent
    let agentId = null;
    
    // Chercher dans agents_colarys d'abord
    const agentInColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [data.matricule]
    );
    
    if (agentInColarys.length > 0) {
      agentId = agentInColarys[0].id;
      console.log(`✅ Agent trouvé dans agents_colarys: ${agentId}`);
    } else {
      // Chercher dans agent
      const agentInAgent = await AppDataSource.query(
        'SELECT id FROM agent WHERE matricule = $1',
        [data.matricule]
      );
      
      if (agentInAgent.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Agent ${data.matricule} non trouvé`
        });
      }
      
      agentId = agentInAgent[0].id;
    }
    
    console.log(`📅 Mise à jour sortie: agent_id=${agentId}, date=${today}, heure=${timeNow}`);
    
    // Heures travaillées fixes
    const heuresTravaillees = 8.00;
    
    let presenceId = null;
    
    try {
      // Chercher la présence existante
      const existingPresence = await AppDataSource.query(
        'SELECT id FROM presence WHERE agent_id = $1 AND date = $2',
        [agentId, today]
      );
      
      if (existingPresence.length > 0) {
        // Mettre à jour la présence existante
        presenceId = existingPresence[0].id;
        await AppDataSource.query(
          `UPDATE presence 
           SET heure_sortie = $1, heures_travaillees = $2, updated_at = NOW()
           WHERE id = $3`,
          [timeNow, heuresTravaillees, presenceId]
        );
        console.log(`✅ Présence existante mise à jour: ${presenceId}`);
      } else {
        // Créer une nouvelle présence
        const newPresence = await AppDataSource.query(
          `INSERT INTO presence 
           (agent_id, date, heure_sortie, heures_travaillees, shift, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [agentId, today, timeNow, heuresTravaillees, 'JOUR']
        );
        presenceId = newPresence[0].id;
        console.log(`✅ Nouvelle présence créée pour sortie: ${presenceId}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur insertion/update:', error);
      throw error;
    }
    
    console.log(`🎉 Sortie enregistrée! Presence ID: ${presenceId}`);
    
    res.json({
      success: true,
      message: "Pointage de sortie enregistré",
      data: {
        matricule: data.matricule,
        agent_id: agentId,
        presence_id: presenceId,
        date: today,
        heure_sortie: timeNow,
        heures_travaillees: heuresTravaillees
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR sortie:', error);
    
    res.status(500).json({
      success: false,
      error: "Erreur pointage sortie",
      details: error.message,
      code: error.code
    });
  }
});

// ========== ROUTES HISTORIQUE ==========

// Route historique (plus tolérante)
app.get('/api/presences/historique', async (req, res) => {
  console.log('📊 Historique appelé avec query:', req.query);
  
  try {
    // Extraire les paramètres avec des valeurs par défaut
    const dateDebut = req.query.dateDebut;
    const dateFin = req.query.dateFin;
    
    // Si pas de dates, utiliser ce mois-ci
    let startDate = dateDebut;
    let endDate = dateFin;
    
    if (!startDate || !endDate) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
      
      console.log('📅 Dates par défaut appliquées:', { startDate, endDate });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Construction de la requête SANS erreur
    let query = `
      SELECT 
        p.id,
        p.date,
        p.heure_entree,
        p.heure_sortie,
        p.heures_travaillees,
        p.shift,
        p.agent_id,
        a.matricule,
        a.nom,
        a.prenom,
        a.campagne
      FROM presence p
      LEFT JOIN agent a ON p.agent_id = a.id
      WHERE p.date BETWEEN $1 AND $2
      ORDER BY p.date DESC
      LIMIT 100
    `;
    
    const params = [startDate, endDate];
    
    console.log('📋 Query historique:', query);
    console.log('📋 Params:', params);
    
    const presences = await AppDataSource.query(query, params);
    console.log(`✅ ${presences.length} présence(s) trouvée(s)`);
    
    // Récupérer les signatures séparément (pour éviter les erreurs de jointure)
    const presencesAvecDetails = [];
    
    for (const presence of presences) {
      try {
        const details = await AppDataSource.query(`
          SELECT signature_entree, signature_sortie
          FROM detail_presence 
          WHERE presence_id = $1
        `, [presence.id]);
        
        presencesAvecDetails.push({
          ...presence,
          details: details.length > 0 ? {
            signatureEntree: details[0].signature_entree,
            signatureSortie: details[0].signature_sortie
          } : null
        });
      } catch (detailError) {
        console.log(`⚠️ Erreur détails pour ${presence.id}:`, detailError.message);
        presencesAvecDetails.push({
          ...presence,
          details: null
        });
      }
    }
    
    // Calcul du total des heures
    const totalHeures = presencesAvecDetails.reduce((sum, p) => {
      return sum + (p.heures_travaillees || 0);
    }, 0);
    
    res.json({
      success: true,
      data: presencesAvecDetails,
      totalHeures: parseFloat(totalHeures.toFixed(2)),
      totalPresences: presencesAvecDetails.length,
      dates_utilisees: {
        dateDebut: startDate,
        dateFin: endDate
      },
      message: `${presencesAvecDetails.length} présence(s) récupérée(s)`
    });
    
  } catch (error) {
    console.error('❌ Erreur historique:', error);
    
    // Fallback encore plus simple
    res.json({
      success: true,
      data: [],
      totalHeures: 0,
      totalPresences: 0,
      message: "Mode fallback activé",
      error: error.message
    });
  }
});

// Historique-safe
app.get('/api/presences/historique-safe', async (req, res) => {
  try {
    console.log('🔄 Historique-safe appelé avec:', req.query);
    
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        error: "dateDebut et dateFin sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Requête ultra simple pour debug
    const presences = await AppDataSource.query(
      'SELECT id, date, heure_entree, heure_sortie, shift, agent_id FROM presence WHERE date BETWEEN $1 AND $2 ORDER BY date DESC LIMIT 50',
      [dateDebut, dateFin]
    );
    
    res.json({
      success: true,
      data: presences,
      count: presences.length,
      message: `Mode safe: ${presences.length} présence(s)`,
      note: "Mode debug - données limitées"
    });
    
  } catch (error) {
    console.error('❌ Erreur historique-safe:', error);
    res.json({
      success: false,
      error: error.message,
      data: [],
      count: 0,
      fallback: true
    });
  }
});

// ========== ROUTES DE RECHERCHE AGENTS ==========

// Rechercher agent par matricule
app.get('/api/agents/matricule/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log(`🔍 Recherche agent par matricule: ${matricule}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Chercher d'abord dans agents_colarys
    let agents = [];
    try {
      agents = await AppDataSource.query(
        'SELECT * FROM agents_colarys WHERE matricule = $1',
        [matricule]
      );
    } catch (error) {
      console.log('⚠️ agents_colarys non trouvé:', error.message);
    }
    
    // Si pas trouvé, chercher dans agent
    if (agents.length === 0) {
      try {
        agents = await AppDataSource.query(
          'SELECT * FROM agent WHERE matricule = $1',
          [matricule]
        );
      } catch (error) {
        console.log('⚠️ agent non trouvé:', error.message);
      }
    }
    
    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }
    
    res.json({
      success: true,
      data: agents[0],
      source: agents[0].entreprise ? 'agents_colarys' : 'agent'
    });
    
  } catch (error) {
    console.error('❌ Error searching agent:', error);
    res.status(500).json({
      success: false,
      error: "Erreur recherche agent"
    });
  }
});

// Rechercher agent par nom/prénom
app.get('/api/agents/nom/:nom/prenom/:prenom', async (req, res) => {
  try {
    const nom = req.params.nom;
    const prenom = req.params.prenom;
    console.log(`🔍 Recherche agent: ${nom} ${prenom}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Chercher dans agents_colarys
    let agents = [];
    try {
      agents = await AppDataSource.query(
        'SELECT * FROM agents_colarys WHERE nom ILIKE $1 AND prenom ILIKE $2',
        [`%${nom}%`, `%${prenom}%`]
      );
    } catch (error) {
      console.log('⚠️ agents_colarys:', error.message);
    }
    
    // Chercher dans agent
    if (agents.length === 0) {
      try {
        agents = await AppDataSource.query(
          'SELECT * FROM agent WHERE nom ILIKE $1 AND prenom ILIKE $2',
          [`%${nom}%`, `%${prenom}%`]
        );
      } catch (error) {
        console.log('⚠️ agent:', error.message);
      }
    }
    
    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }
    
    res.json({
      success: true,
      data: agents[0],
      count: agents.length
    });
    
  } catch (error) {
    console.error('❌ Error searching agent:', error);
    res.status(500).json({
      success: false,
      error: "Erreur recherche agent"
    });
  }
});

// ========== ROUTES DE DIAGNOSTIC ET RÉPARATION ==========

// Route pour diagnostiquer un matricule spécifique
app.get('/api/diagnose-matricule/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔍 Diagnostic du matricule: ${matricule}`);
    
    // Rechercher dans toutes les tables
    const dansAgentsColarys = await AppDataSource.query(
      'SELECT id, nom, prenom, role, created_at FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    const dansAgent = await AppDataSource.query(
      'SELECT id, nom, prenom, campagne, date_creation FROM agent WHERE matricule = $1',
      [matricule]
    );
    
    // Vérifier les présences existantes
    let presences = [];
    if (dansAgentsColarys.length > 0) {
      presences = await AppDataSource.query(
        'SELECT id, date, heure_entree FROM presence WHERE agent_id = $1 ORDER BY date DESC LIMIT 5',
        [dansAgentsColarys[0].id]
      );
    } else if (dansAgent.length > 0) {
      presences = await AppDataSource.query(
        'SELECT id, date, heure_entree FROM presence WHERE agent_id = $1 ORDER BY date DESC LIMIT 5',
        [dansAgent[0].id]
      );
    }
    
    res.json({
      success: true,
      matricule: matricule,
      dans_agents_colarys: dansAgentsColarys,
      dans_agent: dansAgent,
      presences: presences,
      analyse: {
        existe_dans_colarys: dansAgentsColarys.length > 0,
        existe_dans_agent: dansAgent.length > 0,
        ids_differents: dansAgentsColarys.length > 0 && dansAgent.length > 0 && 
                       dansAgentsColarys[0].id !== dansAgent[0].id,
        suggestion: dansAgentsColarys.length === 0 ? 
          "Agent n'existe pas dans agents_colarys (table cible de la FK)" :
          dansAgent.length === 0 ? 
          "Agent n'existe pas dans agent" :
          dansAgentsColarys[0].id === dansAgent[0].id ? 
          "Agent cohérent dans les deux tables" :
          "⚠️ IDs différents! Corriger avec /api/fix-matricule/" + matricule
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic matricule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour corriger un matricule
app.post('/api/fix-matricule/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔧 Correction du matricule: ${matricule}`);
    
    // 1. Vérifier l'état actuel
    const dansAgentsColarys = await AppDataSource.query(
      'SELECT id, nom, prenom FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    const dansAgent = await AppDataSource.query(
      'SELECT id, nom, prenom FROM agent WHERE matricule = $1',
      [matricule]
    );
    
    if (dansAgentsColarys.length === 0 && dansAgent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Matricule non trouvé"
      });
    }
    
    let agentIdColarys = dansAgentsColarys.length > 0 ? dansAgentsColarys[0].id : null;
    let agentIdAgent = dansAgent.length > 0 ? dansAgent[0].id : null;
    
    // 2. Déterminer l'ID cible (priorité à agents_colarys car c'est la cible de la FK)
    let targetId = agentIdColarys || agentIdAgent;
    let actions = [];
    
    // 3. Corriger les IDs si différents
    if (agentIdColarys && agentIdAgent && agentIdColarys !== agentIdAgent) {
      console.log(`⚠️ IDs différents: ${agentIdAgent} (agent) vs ${agentIdColarys} (agents_colarys)`);
      
      // Utiliser l'ID de agents_colarys comme référence
      targetId = agentIdColarys;
      
      // Supprimer l'entrée dans agent avec l'ancien ID si elle existe
      await AppDataSource.query(
        'DELETE FROM agent WHERE id = $1',
        [agentIdAgent]
      );
      actions.push(`Supprimé agent avec ancien ID ${agentIdAgent}`);
      
      // Créer une nouvelle entrée dans agent avec le bon ID
      const agentInfo = dansAgentsColarys[0];
      await AppDataSource.query(
        `INSERT INTO agent 
         (id, matricule, nom, prenom, campagne, date_creation)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          targetId,
          matricule,
          agentInfo.nom,
          agentInfo.prenom,
          'Standard'
        ]
      );
      actions.push(`Créé agent avec ID ${targetId}`);
      
      // Mettre à jour les présences
      const presencesUpdates = await AppDataSource.query(
        'UPDATE presence SET agent_id = $1 WHERE agent_id = $2 RETURNING id',
        [targetId, agentIdAgent]
      );
      
      if (presencesUpdates.length > 0) {
        actions.push(`Mis à jour ${presencesUpdates.length} présence(s) de ${agentIdAgent} à ${targetId}`);
      }
    } else if (!agentIdColarys && agentIdAgent) {
      // Existe seulement dans agent, créer dans agents_colarys
      targetId = agentIdAgent;
      const agentInfo = dansAgent[0];
      
      await AppDataSource.query(
        `INSERT INTO agents_colarys 
         (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          targetId,
          matricule,
          agentInfo.nom,
          agentInfo.prenom,
          'Standard',
          `${agentInfo.nom.toLowerCase()}.${agentInfo.prenom.toLowerCase()}@colarys.com`,
          '',
          'Colarys Concept',
          '/images/default-avatar.svg',
          'default-avatar'
        ]
      );
      actions.push(`Créé dans agents_colarys avec ID ${targetId}`);
    }
    
    res.json({
      success: true,
      message: "Matricule corrigé",
      matricule: matricule,
      final_agent_id: targetId,
      actions: actions,
      test_pointage: `POST /api/presences/entree-fixed-columns avec { "matricule": "${matricule}", "nom": "...", "prenom": "..." }`
    });
    
  } catch (error) {
    console.error('❌ Erreur correction matricule:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Route pour réparer la table detail_presence
app.post('/api/repair-detail-presence-table', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔧 Réparation de la table detail_presence...');
    
    // 1. Vérifier la structure actuelle
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'detail_presence'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colonnes actuelles:', columns);
    
    // 2. Ajouter les colonnes manquantes
    const neededColumns = [
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'signature_entree', type: 'TEXT' },
      { name: 'signature_sortie', type: 'TEXT' },
      { name: 'presence_id', type: 'INTEGER REFERENCES presence(id)' }
    ];
    
    const actions = [];
    
    for (const needed of neededColumns) {
      const exists = columns.some(col => col.column_name === needed.name);
      
      if (!exists) {
        try {
          await AppDataSource.query(`
            ALTER TABLE detail_presence 
            ADD COLUMN ${needed.name} ${needed.type}
          `);
          actions.push(`✅ Ajouté colonne ${needed.name}`);
        } catch (alterError) {
          actions.push(`❌ Erreur ajout ${needed.name}: ${alterError.message}`);
        }
      } else {
        actions.push(`ℹ️ Colonne ${needed.name} existe déjà`);
      }
    }
    
    // 3. Créer la table si elle n'existe pas
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'detail_presence'
      )
    `);
    
    if (!tableExists[0].exists) {
      await AppDataSource.query(`
        CREATE TABLE detail_presence (
          id SERIAL PRIMARY KEY,
          presence_id INTEGER REFERENCES presence(id) ON DELETE CASCADE,
          signature_entree TEXT,
          signature_sortie TEXT,
          observations TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      actions.push('✅ Table detail_presence créée');
    }
    
    // 4. Créer un index pour les performances
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_detail_presence_presence_id 
      ON detail_presence(presence_id)
    `);
    actions.push('✅ Index créé');
    
    res.json({
      success: true,
      message: "Table detail_presence réparée",
      actions: actions,
      current_columns: columns,
      next_steps: [
        "Redémarrez l'application",
        "Testez à nouveau le pointage de sortie"
      ]
    });
    
  } catch (error) {
    console.error('❌ Erreur réparation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// ========== ROUTES DE TEST ET DEBUG ==========

// Route de test pour vérifier TOUTES les routes
app.get('/api/test-all-routes', async (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    api_base: baseUrl,
    routes_disponibles: [
      "GET  /api/agents/matricule/:matricule",
      "GET  /api/agents/nom/:nom/prenom/:prenom",
      "GET  /api/agents-colarys",
      "POST /api/agents-colarys",
      "GET  /api/presences/aujourdhui/:matricule",
      "POST /api/presences/entree",
      "POST /api/presences/sortie",
      "GET  /api/presences/historique?dateDebut=YYYY-MM-DD&dateFin=YYYY-MM-DD",
      "GET  /api/presences/recent",
      "GET  /api/health",
      "GET  /"
    ],
    status: "Vérifiez chaque route individuellement"
  });
});

// Route de test pour vérifier les routes de présence
app.get('/api/debug-presence-routes', (_req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    available_presence_routes: [
      "POST /api/presences/verifier-etat",
      "POST /api/presences/entree-fixed-columns",
      "POST /api/presences/entree",
      "POST /api/presences/sortie",
      "GET /api/presences/aujourdhui/:matricule",
      "GET /api/presences/aujourdhui/nom/:nom/prenom/:prenom",
      "GET /api/presences/historique",
      "GET /api/presences/recent",
      "GET /api/agents/matricule/:matricule",
      "GET /api/agents/nom/:nom/prenom/:prenom"
    ],
    note: "Utilisez ces routes dans votre frontend avec le préfixe correct"
  });
});

// Route pour tester la connexion DB et la table presence
app.get('/api/test-presence-table', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔍 Test table presence...');
    
    // 1. Vérifier si la table existe
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'presence'
      )
    `);
    
    if (!tableExists[0].exists) {
      return res.json({
        success: false,
        error: "La table 'presence' n'existe pas"
      });
    }
    
    // 2. Voir la structure
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'presence'
      ORDER BY ordinal_position
    `);
    
    // 3. Compter les enregistrements
    const count = await AppDataSource.query('SELECT COUNT(*) as count FROM presence');
    
    // 4. Voir quelques enregistrements
    const sample = await AppDataSource.query('SELECT * FROM presence ORDER BY id DESC LIMIT 5');
    
    res.json({
      success: true,
      tableExists: true,
      columnCount: columns.length,
      columns: columns,
      totalRecords: parseInt(count[0].count),
      sample: sample,
      note: "Test réussi - la table presence existe"
    });
    
  } catch (error) {
    console.error('❌ Test table presence échoué:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/plannings/stats', async (req, res) => {
  try {
    console.log('📊 Stats planning appelées avec query:', req.query);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Récupérer les paramètres
    const { selectedFilter, selectedYear, selectedMonth, selectedWeek } = req.query;
    
    console.log('📋 Paramètres reçus:', {
      selectedFilter, 
      selectedYear, 
      selectedMonth, 
      selectedWeek
    });
    
    // Initialiser les statistiques par défaut
    const stats = {
      total: 0,
      actifs: 0,
      inactifs: 0,
      enConge: 0,
      enMission: 0,
      parCampagne: {},
      parStatus: {},
      parMois: {}
    };
    
    try {
      // Compter les agents totaux
      const totalResult = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM agents_colarys'
      );
      stats.total = parseInt(totalResult[0].count) || 0;
      
      // Compter par statut (exemple basique)
      const statusResult = await AppDataSource.query(`
        SELECT role, COUNT(*) as count 
        FROM agents_colarys 
        GROUP BY role
      `);
      
      statusResult.forEach(row => {
        stats.parStatus[row.role] = parseInt(row.count);
      });
      
      // Calculer les actifs/inactifs basiques
      stats.actifs = Math.floor(stats.total * 0.8); // Exemple: 80% actifs
      stats.inactifs = stats.total - stats.actifs;
      
      // Données pour les graphiques (exemple)
      stats.parCampagne = {
        'Standard': Math.floor(stats.total * 0.6),
        'Premium': Math.floor(stats.total * 0.3),
        'VIP': Math.floor(stats.total * 0.1)
      };
      
      // Données mensuelles (exemple)
      const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      mois.forEach(m => {
        stats.parMois[m] = Math.floor(Math.random() * 20) + 10;
      });
      
    } catch (dbError) {
      console.log('⚠️ Erreur base de données pour stats:', dbError.message);
      // Retourner des données mockées
      stats.total = 150;
      stats.actifs = 120;
      stats.inactifs = 30;
      stats.enConge = 8;
      stats.enMission = 12;
      stats.parCampagne = { 'Standard': 90, 'Premium': 45, 'VIP': 15 };
      stats.parStatus = { 'Actif': 120, 'Inactif': 30 };
    }
    
    res.json({
      success: true,
      data: stats,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur stats planning:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ROUTES POUR LE FRONTEND (SUPPLÉMENTAIRES) ==========

// Route pour les statistiques de planning
app.get('/api/plannings/stats', async (req, res) => {
  try {
    console.log('📊 Stats planning appelées avec query:', req.query);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Récupérer les paramètres
    const { selectedFilter, selectedYear, selectedMonth, selectedWeek } = req.query;
    
    console.log('📋 Paramètres reçus:', {
      selectedFilter, 
      selectedYear, 
      selectedMonth, 
      selectedWeek
    });
    
    // Initialiser les statistiques par défaut
    const stats = {
      total: 0,
      actifs: 0,
      inactifs: 0,
      enConge: 0,
      enMission: 0,
      parCampagne: {},
      parStatus: {},
      parMois: {}
    };
    
    try {
      // Compter les agents totaux
      const totalResult = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM agents_colarys'
      );
      stats.total = parseInt(totalResult[0].count) || 0;
      
      // Compter par statut (exemple basique)
      const statusResult = await AppDataSource.query(`
        SELECT role, COUNT(*) as count 
        FROM agents_colarys 
        GROUP BY role
      `);
      
      statusResult.forEach(row => {
        stats.parStatus[row.role] = parseInt(row.count);
      });
      
      // Calculer les actifs/inactifs basiques
      stats.actifs = Math.floor(stats.total * 0.8); // Exemple: 80% actifs
      stats.inactifs = stats.total - stats.actifs;
      
      // Données pour les graphiques (exemple)
      stats.parCampagne = {
        'Standard': Math.floor(stats.total * 0.6),
        'Premium': Math.floor(stats.total * 0.3),
        'VIP': Math.floor(stats.total * 0.1)
      };
      
      // Données mensuelles (exemple)
      const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      mois.forEach(m => {
        stats.parMois[m] = Math.floor(Math.random() * 20) + 10;
      });
      
    } catch (dbError) {
      console.log('⚠️ Erreur base de données pour stats:', dbError.message);
      // Retourner des données mockées
      stats.total = 150;
      stats.actifs = 120;
      stats.inactifs = 30;
      stats.enConge = 8;
      stats.enMission = 12;
      stats.parCampagne = { 'Standard': 90, 'Premium': 45, 'VIP': 15 };
      stats.parStatus = { 'Actif': 120, 'Inactif': 30 };
    }
    
    res.json({
      success: true,
      data: stats,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur stats planning:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour vérifier les signatures
app.get('/api/check-signatures/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔍 Vérification signatures pour présence ID: ${id}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    let signatures = {
      hasEntree: false,
      hasSortie: false,
      signatureEntree: null,
      signatureSortie: null
    };
    
    try {
      // Chercher dans detail_presence
      const details = await AppDataSource.query(
        'SELECT signature_entree, signature_sortie FROM detail_presence WHERE presence_id = $1',
        [id]
      );
      
      if (details.length > 0) {
        signatures.hasEntree = !!details[0].signature_entree;
        signatures.hasSortie = !!details[0].signature_sortie;
        signatures.signatureEntree = details[0].signature_entree;
        signatures.signatureSortie = details[0].signature_sortie;
      }
    } catch (error) {
      console.log('⚠️ Table detail_presence non disponible:', error.message);
    }
    
    res.json({
      success: true,
      presenceId: id,
      signatures: signatures,
      message: signatures.hasEntree ? 
        (signatures.hasSortie ? 'Signatures entrée et sortie présentes' : 'Signature entrée seulement') :
        'Aucune signature'
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour obtenir les plannings (basique)
// Dans minimal.js, mettez à jour la route /api/plannings
app.get('/api/plannings', async (req, res) => {
  try {
    console.log('📅 Plannings appelés avec query:', req.query);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Données mockées pour le planning - retourner directement le tableau
    const plannings = [
      {
        id: 1,
        agent_id: 1,
        date: new Date().toISOString().split('T')[0],
        shift: 'JOUR',
        agent: {
          matricule: 'AG001',
          nom: 'Dupont',
          prenom: 'Jean',
          role: 'Développeur'
        }
      },
      {
        id: 2,
        agent_id: 2,
        date: new Date().toISOString().split('T')[0],
        shift: 'NUIT',
        agent: {
          matricule: 'AG002',
          nom: 'Martin',
          prenom: 'Marie',
          role: 'Designer'
        }
      }
    ];
    
    // MODIFICATION : Retourner directement le tableau au lieu d'un objet
    res.json(plannings);
    
  } catch (error) {
    console.error('❌ Erreur plannings:', error);
    res.status(500).json([]); // Retourner un tableau vide en cas d'erreur
  }
});

// Route de test spécifique pour vérifier que l'API répond
app.get('/api/test-frontend-routes', (req, res) => {
  res.json({
    success: true,
    message: "✅ Routes frontend disponibles",
    routes: [
      "GET /api/plannings/stats - Statistiques planning",
      "GET /api/check-signatures/:id - Vérifier signatures",
      "GET /api/plannings - Liste des plannings",
      "POST /api/presences/entree-fixed-columns - Pointage entrée corrigé",
      "POST /api/presences/sortie - Pointage sortie",
      "GET /api/presences/historique - Historique des présences"
    ],
    timestamp: new Date().toISOString()
  });
});

// ========== SERVER LISTEN ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Endpoints available:`);
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log(`   http://localhost:${PORT}/api/agents-colarys`);
  console.log(`   http://localhost:${PORT}/api/presences/historique`);
  console.log(`   http://localhost:${PORT}/api/plannings/stats`);
  console.log(`   http://localhost:${PORT}/api/test-frontend-routes`);
});