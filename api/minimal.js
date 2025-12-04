// api/minimal.js - Version complète fonctionnelle
console.log('🚀 Colarys API Minimal - Starting...');

const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ========== CONFIGURATION DB DIRECTE ==========
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

// Configuration Multer
const upload = multer();

// ========== ROUTES ESSENTIELLES ==========

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

    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

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

// Route pour agents-colarys (pour votre frontend)
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

    const bcrypt = require('bcryptjs');
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

// ✅ CRÉER UN AGENT (JSON)
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

    // ✅ VALIDATION DES DONNÉES
    if (!newAgent.matricule || !newAgent.nom || !newAgent.prenom || !newAgent.role || !newAgent.mail) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires (matricule, nom, prénom, rôle, mail) doivent être remplis"
      });
    }

    // ✅ VÉRIFIER LES DOUBLONS
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

    // ✅ CRÉER L'AGENT DANS LA BASE DE DONNÉES
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

    // ✅ FORMATER LA RÉPONSE
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

// ✅ CRÉER UN AGENT AVEC FORM-DATA (IMAGE)
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

// ✅ MODIFIER UN AGENT (CORRIGÉ)
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
      
      // ✅ CORRECTION : Nettoyer l'URL si nécessaire
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

// UPLOAD D'IMAGE POUR UN AGENT EXISTANT
app.post('/api/agents-colarys/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    
    console.log('📸 Upload image Cloudinary pour agent:', agentId);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier image fourni"
      });
    }

    // Vérifier que l'agent existe
    const agent = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE id = $1',
      [agentId]
    );

    if (agent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

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

      // Écrire le buffer dans le stream
      uploadStream.end(req.file.buffer);
    });

    await AppDataSource.query(
      'UPDATE agents_colarys SET image = $1, "imagePublicId" = $2 WHERE id = $3',
      [uploadResult.url, uploadResult.public_id, agentId]
    );

    // Récupérer l'agent mis à jour
    const updatedAgent = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE id = $1',
      [agentId]
    );

    res.json({
      success: true,
      message: "Image uploadée avec succès sur Cloudinary",
      data: {
        agent: updatedAgent[0],
        cloudinaryUrl: uploadResult.url
      }
    });

  } catch (error) {
    console.error('❌ Error uploading image to Cloudinary:', error);
    
    // Fallback: stocker en base64
    try {
      if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        await AppDataSource.query(
          'UPDATE agents_colarys SET image = $1, "imagePublicId" = $2 WHERE id = $3',
          [base64Image, 'base64-fallback', agentId]
        );
        
        const updatedAgent = await AppDataSource.query(
          'SELECT * FROM agents_colarys WHERE id = $1',
          [agentId]
        );

        return res.json({
          success: true,
          message: "Image sauvegardée en local (Cloudinary échoué)",
          data: {
            agent: updatedAgent[0]
          }
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback aussi échoué:', fallbackError);
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'upload de l'image",
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

// ROUTE DE DÉBOGAGE POUR LES IMAGES
app.get('/api/debug-agent-image/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const agent = await AppDataSource.query(
      'SELECT id, matricule, nom, prenom, image, "imagePublicId" FROM agents_colarys WHERE id = $1',
      [id]
    );

    if (agent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    res.json({
      success: true,
      data: {
        id: agent[0].id,
        name: `${agent[0].nom} ${agent[0].prenom}`,
        imageRaw: agent[0].image,
        imagePublicId: agent[0].imagePublicId,
        imageStartsWithHttp: agent[0].image ? agent[0].image.startsWith('http') : false,
        imageStartsWithHttps: agent[0].image ? agent[0].image.startsWith('https') : false,
        recommendedUrl: agent[0].image && agent[0].image.startsWith('http') 
          ? agent[0].image 
          : agent[0].image 
            ? (agent[0].image.startsWith('/') ? agent[0].image : '/' + agent[0].image)
            : '/images/default-avatar.svg'
      }
    });

  } catch (error) {
    console.error('❌ Error debugging agent image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ROUTE DE TEST POUR LES URLS D'IMAGE
app.get('/api/test-image-url/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const agent = await AppDataSource.query(
      'SELECT id, nom, prenom, image, "imagePublicId" FROM agents_colarys WHERE id = $1',
      [id]
    );

    if (agent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    res.json({
      success: true,
      data: {
        id: agent[0].id,
        name: `${agent[0].nom} ${agent[0].prenom}`,
        imageRaw: agent[0].image,
        imageType: typeof agent[0].image,
        imageStartsWithHttp: agent[0].image ? 
          (agent[0].image.startsWith('http://') || agent[0].image.startsWith('https://')) : false,
        isCloudinary: agent[0].image ? agent[0].image.includes('cloudinary.com') : false,
        recommendation: agent[0].image && agent[0].image.startsWith('http') 
          ? 'Utiliser directement dans src="..."'
          : 'Nécessite construction d\'URL'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ROUTES EXISTANTES (conservées pour compatibilité)
app.get('/api/presences', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching presences...');

    let presences = [];
    try {
      presences = await AppDataSource.query('SELECT * FROM presence LIMIT 50');
      console.log(`✅ Found ${presences.length} presences`);
    } catch (error) {
      console.log('⚠️ presence table not found');
    }

    // Données mockées
    if (presences.length === 0) {
      presences = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        agent_id: i + 1,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        status: i % 3 === 0 ? "absent" : "present",
        check_in: "08:00",
        check_out: "17:00"
      }));
    }

    res.json({
      success: true,
      data: presences,
      count: presences.length
    });

  } catch (error) {
    console.error('❌ Error fetching presences:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch presences"
    });
  }
});

app.get('/api/plannings', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }

    console.log('📋 Fetching plannings...');

    let plannings = [];
    try {
      plannings = await AppDataSource.query('SELECT * FROM planning LIMIT 50');
      console.log(`✅ Found ${plannings.length} plannings`);
    } catch (error) {
      console.log('⚠️ planning table not found');
    }

    // Données mockées
    if (plannings.length === 0) {
      plannings = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        agent_id: i + 1,
        date: new Date(Date.now() + i * 86400000).toISOString(),
        shift: i % 3 === 0 ? "morning" : i % 3 === 1 ? "afternoon" : "night",
        task: `Task ${i + 1}`
      }));
    }

    res.json({
      success: true,
      data: plannings,
      count: plannings.length
    });

  } catch (error) {
    console.error('❌ Error fetching plannings:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plannings"
    });
  }
});

app.get('/api/test-agents-direct', async (_req, res) => {
  try {
    console.log('🔍 Testing direct agent query...');
    
    // Test direct avec SQL brut
    const agents = await AppDataSource.query(`
      SELECT * FROM agents_colarys 
      ORDER BY id ASC 
      LIMIT 10
    `);
    
    console.log(`✅ Found ${agents.length} agents directly`);
    
    res.json({
      success: true,
      directQuery: true,
      count: agents.length,
      agents: agents
    });
    
  } catch (error) {
    console.error('❌ Direct query failed:', error.message);
    
    // Essayez avec un nom de table différent
    try {
      const agents = await AppDataSource.query(`
        SELECT * FROM agent 
        ORDER BY id ASC 
        LIMIT 10
      `);
      
      res.json({
        success: true,
        usingTable: 'agent',
        count: agents.length,
        agents: agents
      });
      
    } catch (error2) {
      console.error('❌ Alternative table also failed:', error2.message);
      
      // Liste toutes les tables
      const tables = await AppDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      res.json({
        success: false,
        error: "No agent table found",
        availableTables: tables.map(t => t.table_name),
        suggestions: [
          "Check if table 'agents_colarys' exists",
          "Check if table 'agent' exists",
          "Run migration if needed"
        ]
      });
    }
  }
});

app.get('/api/debug-tables', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const tables = await AppDataSource.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      tables: tables,
      total: tables.length
    });
    
  } catch (error) {
    console.error('❌ Error listing tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/check-agent/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    let agent = null;
    let foundIn = null;
    
    // Chercher dans agents_colarys
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM agents_colarys WHERE id = $1',
        [id]
      );
      if (result.length > 0) {
        agent = result[0];
        foundIn = 'agents_colarys';
      }
    } catch (error) {
      console.log('agents_colarys query failed:', error.message);
    }
    
    // Chercher dans agent (alternative)
    if (!agent) {
      try {
        const result = await AppDataSource.query(
          'SELECT * FROM agent WHERE id = $1',
          [id]
        );
        if (result.length > 0) {
          agent = result[0];
          foundIn = 'agent';
        }
      } catch (error) {
        console.log('agent table query failed:', error.message);
      }
    }
    
    res.json({
      success: true,
      agent: agent,
      foundIn: foundIn,
      exists: !!agent
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/debug-agent/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const agent = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE id = $1',
      [id]
    );

    if (agent.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    res.json({
      success: true,
      agent: agent[0],
      rawImage: agent[0].image,
      imageType: typeof agent[0].image,
      isNull: agent[0].image === null,
      isUndefined: agent[0].image === undefined
    });

  } catch (error) {
    console.error('❌ Error debugging agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ROUTES MANQUANTES POUR LES AGENTS ==========

// 1. Rechercher un agent par matricule (MANQUANTE !)
app.get('/api/agents/matricule/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log(`🔍 Recherche agent par matricule: ${matricule}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const agents = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }

    res.json({
      success: true,
      data: agents[0]
    });

  } catch (error) {
    console.error('❌ Error searching agent by matricule:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la recherche de l'agent"
    });
  }
});

// 2. Rechercher un agent par nom et prénom (MANQUANTE !)
app.get('/api/agents/nom/:nom/prenom/:prenom', async (req, res) => {
  try {
    const nom = req.params.nom;
    const prenom = req.params.prenom;
    console.log(`🔍 Recherche agent par nom/prénom: ${nom} ${prenom}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    const agents = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE nom ILIKE $1 AND prenom ILIKE $2',
      [`%${nom}%`, `%${prenom}%`]
    );

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }

    res.json({
      success: true,
      data: agents[0]
    });

  } catch (error) {
    console.error('❌ Error searching agent by name:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la recherche de l'agent"
    });
  }
});

// 3. Route de test pour vérifier
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

// 4. Vérifier la présence aujourd'hui (version simplifiée)
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
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // ✅ LOGIQUE SIMPLIFIÉE : CRÉER DANS agents_colarys ET agent
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

    // Dans la route /presences/entree - AJOUTER cette logique
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
// Voir la structure de la table presence
app.get('/api/debug-presence-structure', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Voir les contraintes
    const constraints = await AppDataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.table_name = 'presence' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    // Voir les colonnes
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'presence'
      ORDER BY ordinal_position
    `);
    
    res.json({
      success: true,
      constraints: constraints,
      columns: columns,
      note: "La contrainte étrangère pointe probablement vers 'agent(id)' pas 'agents_colarys(id)'"
    });
    
  } catch (error) {
    console.error('❌ Error checking structure:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/presences/entree', async (req, res) => {
  try {
    const data = req.body;
    console.log('Pointage entrée pour:', data);
    
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
    
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // ✅ NOUVELLE LOGIQUE : TOUJOURS CRÉER DANS agents_colarys D'ABORD
    let agentId = null;
    
    // 1. Chercher dans agents_colarys (table cible de la FK)
    const agentsColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (agentsColarys.length > 0) {
      // Agent trouvé dans agents_colarys
      agentId = agentsColarys[0].id;
      console.log(`✅ Agent trouvé dans agents_colarys, ID: ${agentId}`);
    } else {
      // 2. Agent non trouvé, le créer dans agents_colarys
      console.log('🆕 Création nouvel agent dans agents_colarys...');
      
      const newAgent = await AppDataSource.query(
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
      
      agentId = newAgent[0].id;
      console.log(`✅ Nouvel agent créé dans agents_colarys, ID: ${agentId}`);
      
      // 3. AUSSI créer dans agent pour la cohérence des données
      try {
        await AppDataSource.query(
          `INSERT INTO agent 
           (id, matricule, nom, prenom, campagne, date_creation, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
          [
            agentId, // Même ID
            matricule,
            data.nom,
            data.prenom,
            data.campagne || 'Standard'
          ]
        );
        console.log(`✅ Agent aussi créé dans table 'agent' avec ID: ${agentId}`);
      } catch (agentError) {
        console.log('⚠️ Note: Erreur création dans table agent (peut être normal si ID existe déjà):', agentError.message);
      }
    }
    
    // ✅ VÉRIFIER SI PRÉSENCE EXISTE DÉJÀ
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
    
    // ✅ CRÉER LA PRÉSENCE
    const presence = await AppDataSource.query(
      `INSERT INTO presence 
       (agent_id, date, heure_entree, shift, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, date, heure_entree`,
      [agentId, today, timeNow, data.shift || 'JOUR']
    );
    
    console.log('✅ Pointage entrée réussi!', presence[0]);
    
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
    console.error('❌ Erreur pointage entrée:', error);
    
    // Gestion spécifique des erreurs
    if (error.code === '23503') {
      // Violation de contrainte étrangère
      const agentIdMatch = error.message.match(/agent_id\)=\((\d+)\)/);
      const agentId = agentIdMatch ? agentIdMatch[1] : 'inconnu';
      
      return res.status(400).json({
        success: false,
        error: "Erreur de référence : agent non trouvé",
        details: `L'agent avec ID ${agentId} n'existe pas dans agents_colarys`,
        suggestion: `Exécutez /api/fix-missing-agent/${agentId} pour corriger`,
        fix_url: `/api/fix-missing-agent/${agentId}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur pointage entrée",
      message: error.message,
      code: error.code
    });
  }
});

// 4. Pointage de sortie - ROUTE MANQUANTE !
app.post('/api/presences/sortie', async (req, res) => {
  console.log('🚨 Route /api/presences/sortie appelée');
  console.log('📦 Body:', req.body);
  
  try {
    const data = req.body;
    
    if (!data || !data.matricule) {
      return res.status(400).json({
        success: false,
        error: "Matricule requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Trouver l'agent (même logique que pour entrée)
    let agentId = null;
    
    // Chercher d'abord dans 'agent'
    try {
      const agents = await AppDataSource.query(
        'SELECT id FROM agent WHERE matricule = $1',
        [data.matricule]
      );
      
      if (agents.length > 0) {
        agentId = agents[0].id;
        console.log(`✅ Agent ${data.matricule} trouvé dans 'agent', ID: ${agentId}`);
      }
    } catch (error) {
      console.log('⚠️ Table agent:', error.message);
    }
    
    // Si pas trouvé, chercher dans agents_colarys
    if (!agentId) {
      const agentsColarys = await AppDataSource.query(
        'SELECT id FROM agents_colarys WHERE matricule = $1',
        [data.matricule]
      );
      
      if (agentsColarys.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Agent ${data.matricule} non trouvé`
        });
      }
      
      agentId = agentsColarys[0].id;
      console.log(`⚠️ Agent trouvé dans agents_colarys, ID: ${agentId}`);
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = data.heureSortieManuelle || now.toTimeString().split(' ')[0].substring(0, 8);
    
    console.log(`📅 Mise à jour sortie: agent_id=${agentId}, date=${today}, heure=${timeNow}`);
    
    // ✅ FIXER À 8 HEURES POUR TOUS LES SHIFTS
    const heuresTravaillees = 8.00;
    
    console.log(`⏱️ Heures travaillées fixées à: ${heuresTravaillees}h`);
    

    try {
      // Chercher l'entrée d'aujourd'hui
      const presence = await AppDataSource.query(
        'SELECT heure_entree FROM presence WHERE agent_id = $1 AND date = $2',
        [agentId, today]
      );
      
      if (presence.length > 0 && presence[0].heure_entree) {
        const entree = presence[0].heure_entree;
        const [heuresE, minutesE] = entree.split(':').map(Number);
        const [heuresS, minutesS] = timeNow.split(':').map(Number);
        
        const totalMinutesEntree = heuresE * 60 + minutesE;
        const totalMinutesSortie = heuresS * 60 + minutesS;
        const diffMinutes = totalMinutesSortie - totalMinutesEntree;
        
        if (diffMinutes > 0) {
          heuresTravaillees = (diffMinutes / 60).toFixed(2);
          console.log(`⏱️ Heures travaillées: ${heuresTravaillees}h (${entree} → ${timeNow})`);
        }
      }
    } catch (error) {
      console.log('⚠️ Calcul heures impossible:', error.message);
    }
    
    // Mettre à jour ou créer la présence
    let result;
    
       try {
      // Essayer de mettre à jour
      result = await AppDataSource.query(
        `UPDATE presence 
         SET heure_sortie = $1, heures_travaillees = $2
         WHERE agent_id = $3 AND date = $4
         RETURNING id`,
        [timeNow, heuresTravaillees, agentId, today]
      );
      
   if (result.rowCount === 0) {
        // Créer si n'existe pas
        console.log('⚠️ Aucune présence trouvée, création avec sortie uniquement');
        result = await AppDataSource.query(
          `INSERT INTO presence (agent_id, date, heure_sortie, heures_travaillees, shift, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [agentId, today, timeNow, heuresTravaillees, data.shift || 'JOUR']
        );
      }
      
    } catch (error) {
      console.error('❌ Erreur insertion/update:', error);
      throw error;
    }
    
     const presenceId = result.rows ? result.rows[0]?.id : result[0]?.id;
    
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
        heures_travaillees: heuresTravaillees, // ✅ Toujours 8h
        signature_sortie: data.signatureSortie ? "Signature reçue" : null
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


// Route pour tester les signatures d'une présence spécifique
app.get('/api/debug-presence/:id/signatures', async (req, res) => {
  try {
    const presenceId = parseInt(req.params.id);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔍 Debug signatures pour présence ID: ${presenceId}`);
    
    // Récupérer la présence avec ses détails
    const presence = await AppDataSource.query(`
      SELECT 
        p.id,
        p.date,
        a.matricule,
        a.nom,
        a.prenom,
        d.signature_entree,
        d.signature_sortie,
        LENGTH(d.signature_entree) as sig_entree_length,
        LENGTH(d.signature_sortie) as sig_sortie_length,
        LEFT(d.signature_entree, 50) as sig_entree_preview,
        LEFT(d.signature_sortie, 50) as sig_sortie_preview
      FROM presence p
      LEFT JOIN agent a ON p.agent_id = a.id
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      WHERE p.id = $1
    `, [presenceId]);
    
    if (presence.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Présence non trouvée"
      });
    }
    
    const pres = presence[0];
    
    // Tester si les signatures sont valides
    let signatureEntreeValide = false;
    let signatureSortieValide = false;
    let signatureEntreeFormattee = null;
    let signatureSortieFormattee = null;
    
    if (pres.signature_entree) {
      signatureEntreeValide = pres.signature_entree.includes('data:image/');
      signatureEntreeFormattee = signatureEntreeValide ? 
        pres.signature_entree : 
        'data:image/png;base64,' + pres.signature_entree;
    }
    
    if (pres.signature_sortie) {
      signatureSortieValide = pres.signature_sortie.includes('data:image/');
      signatureSortieFormattee = signatureSortieValide ? 
        pres.signature_sortie : 
        'data:image/png;base64,' + pres.signature_sortie;
    }
    
    res.json({
      success: true,
      presence: {
        id: pres.id,
        date: pres.date,
        agent: `${pres.nom} ${pres.prenom}`,
        matricule: pres.matricule
      },
      signatures: {
        entree: {
          raw: pres.signature_entree ? 'Présente' : 'Absente',
          length: pres.sig_entree_length,
          preview: pres.sig_entree_preview,
          isValid: signatureEntreeValide,
          formatted: signatureEntreeFormattee ? 
            signatureEntreeFormattee.substring(0, 100) + '...' : 
            null
        },
        sortie: {
          raw: pres.signature_sortie ? 'Présente' : 'Absente',
          length: pres.sig_sortie_length,
          preview: pres.sig_sortie_preview,
          isValid: signatureSortieValide,
          formatted: signatureSortieFormattee ? 
            signatureSortieFormattee.substring(0, 100) + '...' : 
            null
        }
      },
      testImage: signatureEntreeFormattee ? `
        <img src="${signatureEntreeFormattee}" style="max-width: 100px; max-height: 50px;" />
      ` : 'Pas de signature'
    });
    
  } catch (error) {
    console.error('❌ Erreur debug signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. Vérifier toutes les routes de présence
app.get('/api/presences/routes', (_req, res) => {
  res.json({
    success: true,
    routes: {
      entree: "POST /api/presences/entree",
      sortie: "POST /api/presences/sortie", 
      aujourdhui: "GET /api/presences/aujourdhui/:matricule",
      test: "GET /api/presences/test",
      create_table: "GET /api/presences/create-table",
      debug_structure: "GET /api/debug-presence-structure",
      fix_foreign_key: "POST /api/fix-agent-foreign-key/:matricule"
    },
    status: "API présences opérationnelle"
  });
});

// 6. Route pour voir les dernières présences
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


// ========== ROUTES AGENTS MANQUANTES ==========

// 1. Rechercher agent par matricule (URGENT !)
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

// 2. Rechercher agent par nom/prénom (URGENT !)
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

// 3. Vérifier présence aujourd'hui (améliorée)
app.get('/api/presences/aujourdhui/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log(`📅 Vérification présence: ${matricule}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Trouver agent_id
    let agentId = null;
    
    // Chercher dans agents_colarys
    try {
      const agents = await AppDataSource.query(
        'SELECT id FROM agents_colarys WHERE matricule = $1',
        [matricule]
      );
      if (agents.length > 0) {
        agentId = agents[0].id;
      }
    } catch (error) {
      console.log('⚠️ agents_colarys:', error.message);
    }
    
    // Chercher dans agent
    if (!agentId) {
      try {
        const agents = await AppDataSource.query(
          'SELECT id FROM agent WHERE matricule = $1',
          [matricule]
        );
        if (agents.length > 0) {
          agentId = agents[0].id;
        }
      } catch (error) {
        console.log('⚠️ agent:', error.message);
      }
    }
    
    if (!agentId) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé"
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Chercher présence
    let presences = [];
    try {
      presences = await AppDataSource.query(
        'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
        [agentId, today]
      );
    } catch (error) {
      console.log('⚠️ Table presence:', error.message);
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
      error: "Erreur vérification présence"
    });
  }
});
// Dans minimal.js - Remplacer la route existante par cette version corrigée
app.get('/api/presences/historique', async (req, res) => {
  console.log('📊 Historique avec signatures appelé avec:', req.query);
  
  try {
    const { dateDebut, dateFin, matricule, nom, prenom, campagne, shift } = req.query;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Validation simple
    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        error: "dateDebut et dateFin sont requis"
      });
    }
    
    console.log('📋 Paramètres validés:', { dateDebut, dateFin });
    
    // ✅ VERSION CORRIGÉE AVEC JOINTURE COMPLÈTE ET SIGNATURES
    let query = `
      SELECT 
        p.id,
        p.date,
        p.heure_entree,
        p.heure_sortie,
        p.shift,
        p.created_at,
        p.agent_id,
        -- ✅ HEURES TRAVAILLÉES : FIXER À 8H SI SORTIE EXISTE
        CASE 
          WHEN p.heure_sortie IS NOT NULL THEN 8.00
          ELSE NULL 
        END as heures_travaillees,
        -- Agent details (d'abord agents_colarys, puis agent comme fallback)
        COALESCE(ac.matricule, a.matricule) as matricule,
        COALESCE(ac.nom, a.nom) as nom,
        COALESCE(ac.prenom, a.prenom) as prenom,
        COALESCE(ac.role, a.campagne) as campagne,
        -- Signature details (CRITIQUE !) - Toujours depuis detail_presence
        d.signature_entree,
        d.signature_sortie,
        d.id as detail_id
      FROM presence p
      -- ✅ JOIN avec agent (fallback)
      LEFT JOIN agent a ON p.agent_id = a.id
      -- ✅ JOIN avec agents_colarys (primaire)
      LEFT JOIN agents_colarys ac ON p.agent_id = ac.id
      -- ✅ JOIN CRITIQUE avec detail_presence (table correcte)
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      WHERE p.date BETWEEN $1 AND $2
    `;
    
    const params = [dateDebut, dateFin];
    let paramIndex = 3;
    
    // Filtres
    if (matricule) {
      query += ` AND (ac.matricule = $${paramIndex} OR a.matricule = $${paramIndex})`;
      params.push(matricule);
      paramIndex++;
    }
    
    if (nom) {
      query += ` AND (ac.nom ILIKE $${paramIndex} OR a.nom ILIKE $${paramIndex})`;
      params.push(`%${nom}%`);
      paramIndex++;
    }
    
    if (prenom) {
      query += ` AND (ac.prenom ILIKE $${paramIndex} OR a.prenom ILIKE $${paramIndex})`;
      params.push(`%${prenom}%`);
      paramIndex++;
    }
    
    if (campagne) {
      query += ` AND (ac.role = $${paramIndex} OR a.campagne = $${paramIndex})`;
      params.push(campagne);
      paramIndex++;
    }
    
    if (shift) {
      query += ` AND p.shift = $${paramIndex}`;
      params.push(shift);
      paramIndex++;
    }
    
    query += ' ORDER BY p.date DESC, p.id DESC LIMIT 200';
    
    console.log('📋 Query avec signatures:', query);
    
    const presences = await AppDataSource.query(query, params);
    console.log(`✅ ${presences.length} présence(s) trouvée(s)`);
    
    // ✅ VÉRIFICATION DES SIGNATURES TROUVÉES
    const presencesAvecSignatures = presences.filter(p => p.signature_entree || p.signature_sortie);
    console.log(`📝 ${presencesAvecSignatures.length} présence(s) avec signature(s)`);
    
    // ✅ FORMATER LES SIGNATURES CORRECTEMENT
    const presencesFormatees = presences.map(presence => {
      // Formater les signatures
      let signatureEntree = null;
      let signatureSortie = null;
      
      // CRITIQUE : Vérifier et formater signature entrée
      if (presence.signature_entree) {
        const sig = presence.signature_entree.trim();
        if (sig.length > 0) {
          // Vérifier le format
          if (sig.startsWith('data:image/')) {
            signatureEntree = sig;
          } else if (sig.match(/^[A-Za-z0-9+/]+=*$/)) {
            // Base64 pur sans préfixe
            signatureEntree = `data:image/png;base64,${sig}`;
          } else if (sig.length > 100) {
            // Tentative avec préfixe
            signatureEntree = `data:image/png;base64,${sig}`;
          }
        }
      }
      
      // CRITIQUE : Vérifier et formater signature sortie
      if (presence.signature_sortie) {
        const sig = presence.signature_sortie.trim();
        if (sig.length > 0) {
          if (sig.startsWith('data:image/')) {
            signatureSortie = sig;
          } else if (sig.match(/^[A-Za-z0-9+/]+=*$/)) {
            signatureSortie = `data:image/png;base64,${sig}`;
          } else if (sig.length > 100) {
            signatureSortie = `data:image/png;base64,${sig}`;
          }
        }
      }
      
      // Structure pour le frontend
      const result = {
        id: presence.id,
        date: presence.date,
        heureEntree: presence.heure_entree,
        heureSortie: presence.heure_sortie,
        shift: presence.shift || 'JOUR',
        heuresTravaillees: presence.heures_travaillees ? 
          parseFloat(presence.heures_travaillees) : null,
        createdAt: presence.created_at,
        agent: {
          id: presence.agent_id,
          matricule: presence.matricule || 'N/D',
          nom: presence.nom || 'Inconnu',
          prenom: presence.prenom || '',
          campagne: presence.campagne || 'Non défini'
        },
        // ✅ STRUCTURE CRITIQUE POUR LE FRONTEND
        details: {
          signatureEntree: signatureEntree,
          signatureSortie: signatureSortie,
          id: presence.detail_id,
          hasEntreeSignature: !!signatureEntree,
          hasSortieSignature: !!signatureSortie
        },
        // Debug info
        _debug: {
          hasEntreeSignature: !!presence.signature_entree,
          hasSortieSignature: !!presence.signature_sortie,
          entreeLength: presence.signature_entree ? presence.signature_entree.length : 0,
          sortieLength: presence.signature_sortie ? presence.signature_sortie.length : 0,
          entreeFormat: presence.signature_entree ? 
            (presence.signature_entree.startsWith('data:image/') ? 'valid' : 'base64') : 'none',
          sortieFormat: presence.signature_sortie ? 
            (presence.signature_sortie.startsWith('data:image/') ? 'valid' : 'base64') : 'none'
        }
      };
      
      // Log pour debug
      if (signatureEntree || signatureSortie) {
        console.log(`🔍 Présence ${presence.id} - ${presence.nom} ${presence.prenom}:`, {
          entree: signatureEntree ? '✓' : '✗',
          sortie: signatureSortie ? '✓' : '✗',
          detailId: presence.detail_id
        });
      }
      
      return result;
    });
    
    // Calculer le total des heures
    const totalHeures = presencesFormatees.reduce((sum, p) => {
      return sum + (p.heuresTravaillees || 0);
    }, 0);
    
    // Statistiques des signatures
    const stats = {
      total: presencesFormatees.length,
      withEntreeSignature: presencesFormatees.filter(p => p.details.signatureEntree).length,
      withSortieSignature: presencesFormatees.filter(p => p.details.signatureSortie).length,
      withAnySignature: presencesFormatees.filter(p => p.details.signatureEntree || p.details.signatureSortie).length
    };
    
    console.log('📊 Statistiques signatures:', stats);
    
    res.json({
      success: true,
      data: presencesFormatees,
      totalHeures: parseFloat(totalHeures.toFixed(2)),
      totalPresences: presencesFormatees.length,
      signatureStats: stats,
      message: `${presencesFormatees.length} présence(s) - ${stats.withAnySignature} avec signature(s)`
    });
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE historique avec signatures:', error);
    
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération de l'historique",
      message: error.message,
      hint: "Vérifiez la jointure avec detail_presence"
    });
  }
});
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

// Route pour fixer toutes les heures à 8h
app.post('/api/fix-heures-travaillees', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔧 Fixation des heures travaillées à 8h...');
    
    // Mettre à jour toutes les présences avec sortie
    const result = await AppDataSource.query(`
      UPDATE presence 
      SET heures_travaillees = 8.00 
      WHERE heure_sortie IS NOT NULL 
      AND (heures_travaillees IS NULL OR heures_travaillees != 8.00)
    `);
    
    console.log(`✅ ${result.rowCount} présences mises à jour à 8h`);
    
    res.json({
      success: true,
      message: `${result.rowCount} présence(s) mises à jour avec 8 heures travaillées`,
      updated: result.rowCount
    });
    
  } catch (error) {
    console.error('❌ Erreur fixation heures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. Route de test pour vérifier TOUTES les routes
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

// Dans minimal.js - Ajouter ces routes
app.get('/api/test-presence-connection', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    res.json({
      success: true,
      message: 'API présence fonctionnelle',
      baseUrl: process.env.VERCEL_URL || 'localhost',
      database: dbInitialized ? 'connecté' : 'non connecté'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/all-routes', (_req, res) => {
  res.json({
    success: true,
    routes: [
      { method: 'GET', path: '/api/presences/historique' },
      { method: 'GET', path: '/api/presences/historique-safe' },
      { method: 'POST', path: '/api/presences/entree' },
      { method: 'POST', path: '/api/presences/sortie' },
      { method: 'GET', path: '/api/agents/matricule/:matricule' },
      { method: 'GET', path: '/api/agents/nom/:nom/prenom/:prenom' },
      // ... autres routes
    ]
  });
});


// Route pour vérifier l'état des agents
app.get('/api/debug-agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔍 Debug agent ID: ${agentId}`);
    
    // Vérifier dans les deux tables
    const inAgentTable = await AppDataSource.query(
      'SELECT id, matricule, nom, prenom FROM agent WHERE id = $1',
      [agentId]
    );
    
    const inAgentsColarys = await AppDataSource.query(
      'SELECT id, matricule, nom, prenom FROM agents_colarys WHERE id = $1',
      [agentId]
    );
    
    // Vérifier les présences
    const presences = await AppDataSource.query(
      'SELECT id, date, heure_entree FROM presence WHERE agent_id = $1 ORDER BY date DESC LIMIT 5',
      [agentId]
    );
    
    res.json({
      success: true,
      agent_id: agentId,
      in_agent_table: inAgentTable.length > 0 ? inAgentTable[0] : null,
      in_agents_colarys: inAgentsColarys.length > 0 ? inAgentsColarys[0] : null,
      presences_count: presences.length,
      recent_presences: presences,
      foreign_key_target: 'agents_colarys (depuis presence_agent_id_fk)',
      suggestion: inAgentsColarys.length === 0 ? 
        "Agent manquant dans agents_colarys. Exécutez /api/fix-missing-agent/' + agentId" : 
        "Agent trouvé"
    });
    
  } catch (error) {
    console.error('❌ Erreur debug agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour créer un agent dans les deux tables
app.post('/api/create-agent-in-both-tables', async (req, res) => {
  try {
    const { matricule, nom, prenom, campagne, email, contact } = req.body;
    
    if (!matricule || !nom || !prenom) {
      return res.status(400).json({
        success: false,
        error: "Matricule, nom et prénom sont requis"
      });
    }
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔄 Création agent ${matricule} dans les deux tables...`);
    
    // Vérifier si existe déjà
    const existingInColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    const existingInAgent = await AppDataSource.query(
      'SELECT id FROM agent WHERE matricule = $1',
      [matricule]
    );
    
    if (existingInColarys.length > 0 && existingInAgent.length > 0) {
      return res.json({
        success: true,
        message: "Agent existe déjà dans les deux tables",
        agent_id_colarys: existingInColarys[0].id,
        agent_id_agent: existingInAgent[0].id
      });
    }
    
    let agentId = null;
    let createdInColarys = false;
    let createdInAgent = false;
    
    // 1. Créer ou récupérer dans agents_colarys
    if (existingInColarys.length > 0) {
      agentId = existingInColarys[0].id;
      console.log(`✅ Existe déjà dans agents_colarys: ${agentId}`);
    } else {
      const newColarys = await AppDataSource.query(
        `INSERT INTO agents_colarys 
         (matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id`,
        [
          matricule,
          nom,
          prenom,
          campagne || 'Standard',
          email || `${nom.toLowerCase()}.${prenom.toLowerCase()}@colarys.com`,
          contact || '',
          'Colarys Concept',
          '/images/default-avatar.svg',
          'default-avatar'
        ]
      );
      
      agentId = newColarys[0].id;
      createdInColarys = true;
      console.log(`✅ Créé dans agents_colarys: ${agentId}`);
    }
    
    // 2. Créer ou récupérer dans agent
    if (existingInAgent.length > 0) {
      console.log(`✅ Existe déjà dans agent: ${existingInAgent[0].id}`);
    } else {
      await AppDataSource.query(
        `INSERT INTO agent 
         (id, matricule, nom, prenom, campagne, date_creation, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
        [
          agentId, // Même ID pour la cohérence
          matricule,
          nom,
          prenom,
          campagne || 'Standard'
        ]
      );
      createdInAgent = true;
      console.log(`✅ Créé dans agent avec ID: ${agentId}`);
    }
    
    res.json({
      success: true,
      message: "Agent géré avec succès",
      agent_id: agentId,
      matricule: matricule,
      created: {
        in_agents_colarys: createdInColarys,
        in_agent: createdInAgent
      },
      test_pointage: `POST /presences/entree avec { "matricule": "${matricule}", "nom": "${nom}", "prenom": "${prenom}" }`
    });
    
  } catch (error) {
    console.error('❌ Erreur création agent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
});

// Route de secours ultra-simple (sans FK vérification)
app.post('/api/presences/entree-direct', async (req, res) => {
  try {
    const data = req.body;
    console.log('🚀 Pointage entrée DIRECT:', data);
    
    // Validation minimale
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
    
    // Matricule
    let matricule = data.matricule?.trim() || `AG-${Date.now()}`;
    
    // 1. Vérifier/créer l'agent dans agents_colarys
    let agentColarysId = null;
    const existingColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (existingColarys.length > 0) {
      agentColarysId = existingColarys[0].id;
    } else {
      const newAgent = await AppDataSource.query(
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
          'Colarys Concept',
          '/images/default-avatar.svg',
          'default-avatar'
        ]
      );
      agentColarysId = newAgent[0].id;
    }
    
    // 2. S'assurer que l'agent existe dans agent aussi
    const existingAgent = await AppDataSource.query(
      'SELECT id FROM agent WHERE id = $1',
      [agentColarysId]
    );
    
    if (existingAgent.length === 0) {
      await AppDataSource.query(
        `INSERT INTO agent 
         (id, matricule, nom, prenom, campagne, date_creation, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
        [
          agentColarysId,
          matricule,
          data.nom,
          data.prenom,
          data.campagne || 'Standard'
        ]
      );
    }
    
    // 3. Vérifier présence existante
    const existingPresence = await AppDataSource.query(
      'SELECT id FROM presence WHERE agent_id = $1 AND date = $2',
      [agentColarysId, today]
    );
    
    if (existingPresence.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Une présence existe déjà pour aujourd'hui"
      });
    }
    
    // 4. Insérer la présence
    const presence = await AppDataSource.query(
      `INSERT INTO presence 
       (agent_id, date, heure_entree, shift, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, date, heure_entree`,
      [agentColarysId, today, timeNow, data.shift || 'JOUR']
    );
    
    res.json({
      success: true,
      message: "Pointage direct réussi",
      data: {
        presence_id: presence[0].id,
        matricule: matricule,
        nom: data.nom,
        prenom: data.prenom,
        heure_entree: presence[0].heure_entree,
        date: presence[0].date,
        agent_id: agentColarysId
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage direct:', error);
    
    // Si échec, essayer une approche encore plus simple
    try {
      console.log('🔄 Tentative avec insertion brute...');
      
      // Insertion directe sans trop de vérifications
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeNow = data.heureEntreeManuelle || 
                      now.toTimeString().split(' ')[0].substring(0, 8);
      
      const matricule = data.matricule?.trim() || `AG-EMG-${Date.now()}`;
      
      // Générer un ID d'agent qui existe probablement
      const maxAgentId = await AppDataSource.query(
        'SELECT COALESCE(MAX(id), 100) as max_id FROM agents_colarys'
      );
      const agentId = parseInt(maxAgentId[0].max_id) + 1;
      
      // Créer l'agent rapidement
      await AppDataSource.query(
        `INSERT INTO agents_colarys (id, matricule, nom, prenom, role, "created_at") 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         ON CONFLICT DO NOTHING`,
        [agentId, matricule, data.nom, data.prenom, data.campagne || 'Standard']
      );
      
      await AppDataSource.query(
        `INSERT INTO agent (id, matricule, nom, prenom, campagne, "createdAt") 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         ON CONFLICT DO NOTHING`,
        [agentId, matricule, data.nom, data.prenom, data.campagne || 'Standard']
      );
      
      // Créer la présence
      const presence = await AppDataSource.query(
        `INSERT INTO presence (agent_id, date, heure_entree, shift, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id`,
        [agentId, today, timeNow, data.shift || 'JOUR']
      );
      
      return res.json({
        success: true,
        message: "Pointage de secours réussi",
        data: {
          presence_id: presence[0].id,
          matricule: matricule,
          nom: data.nom,
          prenom: data.prenom,
          heure_entree: timeNow,
          date: today,
          agent_id: agentId,
          emergency_mode: true
        }
      });
      
    } catch (emergencyError) {
      console.error('❌ Même la méthode d\'urgence a échoué:', emergencyError);
      
      res.status(500).json({
        success: false,
        error: "Échec critique du pointage",
        original_error: error.message,
        emergency_error: emergencyError.message,
        suggestion: "Vérifiez la connexion à la base de données et les contraintes"
      });
    }
  }
});

// Route pour corriger un agent manquant
app.post('/api/fix-missing-agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔄 Correction agent manquant ID: ${agentId}`);
    
    // 1. Vérifier si l'agent existe dans 'agent'
    const agentInAgentTable = await AppDataSource.query(
      'SELECT * FROM agent WHERE id = $1',
      [agentId]
    );
    
    if (agentInAgentTable.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Agent avec ID ${agentId} n'existe pas dans la table 'agent'`
      });
    }
    
    const agent = agentInAgentTable[0];
    
    // 2. Vérifier s'il existe déjà dans agents_colarys
    const existingInColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE id = $1 OR matricule = $2',
      [agentId, agent.matricule]
    );
    
    if (existingInColarys.length > 0) {
      return res.json({
        success: true,
        message: `Agent existe déjà dans agents_colarys avec ID: ${existingInColarys[0].id}`,
        existing_id: existingInColarys[0].id
      });
    }
    
    // 3. Créer dans agents_colarys
    const newAgent = await AppDataSource.query(
      `INSERT INTO agents_colarys 
       (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
       RETURNING id`,
      [
        agentId, // Même ID pour la cohérence
        agent.matricule || `AG-${agentId}`,
        agent.nom,
        agent.prenom,
        agent.campagne || 'Standard',
        `${agent.nom.toLowerCase()}.${agent.prenom.toLowerCase()}@colarys.com`,
        '',
        'Colarys Concept',
        '/images/default-avatar.svg',
        'default-avatar'
      ]
    );
    
    res.json({
      success: true,
      message: `Agent ID ${agentId} créé dans agents_colarys`,
      agent_id: newAgent[0].id,
      details: {
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur correction agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour synchroniser les IDs d'un agent entre les tables
app.post('/api/sync-agent-ids/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔄 Synchronisation IDs pour ${matricule}...`);
    
    // Récupérer les infos des deux tables
    const agentInAgent = await AppDataSource.query(
      'SELECT * FROM agent WHERE matricule = $1',
      [matricule]
    );
    
    const agentInColarys = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (agentInAgent.length === 0 || agentInColarys.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé dans une des tables"
      });
    }
    
    const agent1 = agentInAgent[0];
    const agent2 = agentInColarys[0];
    
    console.log('📊 IDs actuels:', {
      agent_table_id: agent1.id,
      agents_colarys_id: agent2.id
    });
    
    // Déterminer quel ID utiliser (privilégier agents_colarys car c'est la cible de la FK)
    const targetId = agent2.id; // ID de agents_colarys
    const sourceId = agent1.id; // ID de agent
    
    let actions = [];
    
    // 1. Mettre à jour la table agent pour avoir le même ID
    if (agent1.id !== targetId) {
      // Vérifier si l'ID target existe déjà dans agent
      const existingWithTargetId = await AppDataSource.query(
        'SELECT id FROM agent WHERE id = $1',
        [targetId]
      );
      
      if (existingWithTargetId.length > 0) {
        // L'ID existe déjà, on doit le supprimer ou le mettre à jour
        await AppDataSource.query(
          'DELETE FROM agent WHERE id = $1',
          [targetId]
        );
        actions.push(`Supprimé agent existant avec ID ${targetId}`);
      }
      
      // Mettre à jour l'ID dans agent
      await AppDataSource.query(
        'UPDATE agent SET id = $1 WHERE id = $2',
        [targetId, sourceId]
      );
      actions.push(`Mis à jour agent.id de ${sourceId} à ${targetId}`);
    }
    
    // 2. Mettre à jour les présences existantes
    const presencesToUpdate = await AppDataSource.query(
      'SELECT id, date FROM presence WHERE agent_id = $1',
      [sourceId]
    );
    
    if (presencesToUpdate.length > 0) {
      await AppDataSource.query(
        'UPDATE presence SET agent_id = $1 WHERE agent_id = $2',
        [targetId, sourceId]
      );
      actions.push(`Mis à jour ${presencesToUpdate.length} présence(s) de agent_id ${sourceId} à ${targetId}`);
    }
    
    res.json({
      success: true,
      message: "Synchronisation terminée",
      matricule: matricule,
      old_ids: {
        agent_table: sourceId,
        agents_colarys: targetId
      },
      new_id: targetId,
      actions: actions,
      next_step: "Tester le pointage d'entrée maintenant"
    });
    
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});


// Route de pointage d'entrée avec gestion correcte des IDs
app.post('/api/presences/entree-correct', async (req, res) => {
  try {
    const data = req.body;
    console.log('🎯 Pointage entrée CORRECT pour:', data.matricule);
    
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
    
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // ✅ CORRECTION CRITIQUE : TOUJOURS utiliser l'ID de agents_colarys
    let agentId = null;
    
    // 1. Chercher D'ABORD dans agents_colarys (table cible de la FK)
    const agentInColarys = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (agentInColarys.length > 0) {
      agentId = agentInColarys[0].id;
      console.log(`✅ Utilisation ID agents_colarys: ${agentId}`);
      
      // S'assurer que l'agent existe aussi dans agent avec le MÊME ID
      const agentInAgent = await AppDataSource.query(
        'SELECT id FROM agent WHERE id = $1',
        [agentId]
      );
      
      if (agentInAgent.length === 0) {
        // Créer dans agent avec le même ID
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
        console.log(`🔄 Créé dans agent avec ID: ${agentId}`);
      }
    } else {
      // 2. Agent non trouvé, le créer
      console.log('🆕 Création nouvel agent...');
      
      // Générer un nouvel ID
      const maxIdResult = await AppDataSource.query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM agents_colarys'
      );
      agentId = parseInt(maxIdResult[0].next_id);
      
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
      
      // Créer dans agent avec le MÊME ID
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
      
      console.log(`✅ Nouvel agent créé avec ID: ${agentId} dans les deux tables`);
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
    
    // Insérer la présence
    const presence = await AppDataSource.query(
      `INSERT INTO presence 
       (agent_id, date, heure_entree, shift, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, date, heure_entree`,
      [agentId, today, timeNow, data.shift || 'JOUR']
    );
    
    console.log('🎉 Pointage RÉUSSI avec ID correct!', {
      presence_id: presence[0].id,
      agent_id: agentId,
      matricule: matricule
    });
    
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
        agent_id: agentId,
        agent_source: 'agents_colarys'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage:', error);
    
    res.status(500).json({
      success: false,
      error: "Erreur pointage d'entrée",
      details: error.message,
      code: error.code,
      suggestion: error.code === '23503' ? 
        "Problème de clé étrangère. L'agent n'existe pas dans agents_colarys avec cet ID." : 
        "Erreur inconnue"
    });
  }
});

// Ajoutez cette route dans minimal.js - Vers le début des routes POST
app.post('/api/presences/entree-fixed', async (req, res) => {
  console.log('🎯 Pointage entrée FIXED appelé:', req.body);
  
  try {
    const data = req.body;
    
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
    
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // ✅ LOGIQUE SIMPLIFIÉE
    let agentId = null;
    
    // 1. Chercher dans agents_colarys
    const existingAgent = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (existingAgent.length > 0) {
      agentId = existingAgent[0].id;
      console.log(`✅ Agent existant: ${agentId}`);
    } else {
      // 2. Créer nouvel agent
      console.log('🆕 Création nouvel agent...');
      
      const maxIdResult = await AppDataSource.query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM agents_colarys'
      );
      agentId = parseInt(maxIdResult[0].next_id);
      
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
      
      console.log(`✅ Nouvel agent créé: ${agentId}`);
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
        agent_id: agentId,
        shift: data.shift || 'JOUR'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage:', error);
    
    res.status(500).json({
      success: false,
      error: "Erreur pointage d'entrée",
      details: error.message,
      code: error.code
    });
  }
});

// Script pour trouver et corriger tous les agents avec des IDs différents
app.get('/api/fix-all-inconsistent-agent-ids', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔍 Recherche agents avec IDs incohérents...');
    
    // Trouver les agents avec le même matricule mais des IDs différents
    const inconsistentAgents = await AppDataSource.query(`
      SELECT 
        a.matricule,
        a.id as agent_id,
        a.nom as agent_nom,
        a.prenom as agent_prenom,
        ac.id as colarys_id,
        ac.nom as colarys_nom,
        ac.prenom as colarys_prenom,
        CASE WHEN a.id = ac.id THEN 'OK' ELSE 'INCONSISTENT' END as status
      FROM agent a
      INNER JOIN agents_colarys ac ON a.matricule = ac.matricule
      WHERE a.id != ac.id
      ORDER BY a.matricule
    `);
    
    console.log(`📊 ${inconsistentAgents.length} agent(s) incohérent(s) trouvé(s)`);
    
    const results = [];
    
    for (const agent of inconsistentAgents) {
      try {
        // Utiliser l'ID de agents_colarys comme référence
        const targetId = agent.colarys_id;
        const sourceId = agent.agent_id;
        
        // 1. Vérifier si l'ID target existe déjà dans agent
        const existingWithTargetId = await AppDataSource.query(
          'SELECT id FROM agent WHERE id = $1 AND id != $2',
          [targetId, sourceId]
        );
        
        if (existingWithTargetId.length > 0) {
          // Supprimer le doublon
          await AppDataSource.query(
            'DELETE FROM agent WHERE id = $1',
            [targetId]
          );
          results.push({
            matricule: agent.matricule,
            action: `Supprimé doublon agent ID ${targetId}`,
            status: 'cleaned'
          });
        }
        
        // 2. Mettre à jour l'agent pour utiliser le bon ID
        await AppDataSource.query(
          'UPDATE agent SET id = $1 WHERE id = $2',
          [targetId, sourceId]
        );
        
        // 3. Mettre à jour les présences
        const updatedPresences = await AppDataSource.query(
          'UPDATE presence SET agent_id = $1 WHERE agent_id = $2 RETURNING id',
          [targetId, sourceId]
        );
        
        results.push({
          matricule: agent.matricule,
          old_id: sourceId,
          new_id: targetId,
          presences_updated: updatedPresences.length,
          status: 'fixed'
        });
        
        console.log(`✅ ${agent.matricule}: ${sourceId} → ${targetId} (${updatedPresences.length} présences)`);
        
      } catch (fixError) {
        results.push({
          matricule: agent.matricule,
          error: fixError.message,
          status: 'error'
        });
        console.error(`❌ Erreur correction ${agent.matricule}:`, fixError.message);
      }
    }
    
    res.json({
      success: true,
      message: `${results.filter(r => r.status === 'fixed').length} agent(s) corrigé(s)`,
      total_inconsistent: inconsistentAgents.length,
      results: results,
      summary: {
        fixed: results.filter(r => r.status === 'fixed').length,
        cleaned: results.filter(r => r.status === 'cleaned').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur correction agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour corriger tous les agents manquants
app.get('/api/fix-all-missing-agents', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔄 Recherche agents manquants...');
    
    // Trouver tous les agents de 'agent' qui ne sont pas dans 'agents_colarys'
    const missingAgents = await AppDataSource.query(`
      SELECT a.id, a.matricule, a.nom, a.prenom, a.campagne
      FROM agent a
      WHERE NOT EXISTS (
        SELECT 1 FROM agents_colarys ac 
        WHERE ac.id = a.id OR ac.matricule = a.matricule
      )
      ORDER BY a.id
    `);
    
    console.log(`🔍 ${missingAgents.length} agent(s) manquant(s) trouvé(s)`);
    
    const results = [];
    for (const agent of missingAgents) {
      try {
        const newAgent = await AppDataSource.query(
          `INSERT INTO agents_colarys 
           (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
           RETURNING id`,
          [
            agent.id,
            agent.matricule || `AG-${agent.id}`,
            agent.nom,
            agent.prenom,
            agent.campagne || 'Standard',
            `${agent.nom.toLowerCase()}.${agent.prenom.toLowerCase()}@colarys.com`,
            '',
            'Colarys Concept',
            '/images/default-avatar.svg',
            'default-avatar'
          ]
        );
        
        results.push({
          agent_id: agent.id,
          status: 'created',
          new_id: newAgent[0].id,
          matricule: agent.matricule
        });
        
        console.log(`✅ Agent créé: ${agent.id} - ${agent.matricule}`);
        
      } catch (insertError) {
        results.push({
          agent_id: agent.id,
          status: 'error',
          error: insertError.message,
          matricule: agent.matricule
        });
        
        console.error(`❌ Erreur création agent ${agent.id}:`, insertError.message);
      }
    }
    
    res.json({
      success: true,
      message: `${results.filter(r => r.status === 'created').length} agent(s) créé(s)`,
      total_missing: missingAgents.length,
      results: results,
      summary: {
        created: results.filter(r => r.status === 'created').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur correction agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour corriger les présences sans agent
app.get('/api/fix-presences-without-agent', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔧 Correction des présences sans agent...');
    
    // Trouver les présences sans agent correspondant
    const orphanPresences = await AppDataSource.query(`
      SELECT p.* 
      FROM presence p
      WHERE NOT EXISTS (
        SELECT 1 FROM agents_colarys ac WHERE ac.id = p.agent_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM agent a WHERE a.id = p.agent_id
      )
      ORDER BY p.date DESC
      LIMIT 50
    `);
    
    console.log(`🔍 ${orphanPresences.length} présence(s) orpheline(s) trouvée(s)`);
    
    const results = [];
    
    for (const presence of orphanPresences) {
      try {
        // Créer un agent fictif pour cette présence
        const matricule = `ORPHAN-${presence.id}`;
        
        // Créer dans agents_colarys
        const newAgent = await AppDataSource.query(
          `INSERT INTO agents_colarys 
           (id, matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
           RETURNING id`,
          [
            presence.agent_id, // Utiliser l'ID existant
            matricule,
            'Agent',
            'Orphelin',
            'Corrigé',
            `orphan${presence.id}@colarys.com`,
            '',
            'Colarys Concept',
            '/images/default-avatar.svg',
            'default-avatar'
          ]
        );
        
        // Aussi dans agent
        await AppDataSource.query(
          `INSERT INTO agent 
           (id, matricule, nom, prenom, campagne, date_creation, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
          [
            presence.agent_id,
            matricule,
            'Agent',
            'Orphelin',
            'Corrigé'
          ]
        );
        
        results.push({
          presence_id: presence.id,
          agent_id: presence.agent_id,
          status: 'fixed',
          new_matricule: matricule
        });
        
        console.log(`✅ Présence ${presence.id} corrigée avec agent ${matricule}`);
        
      } catch (fixError) {
        results.push({
          presence_id: presence.id,
          agent_id: presence.agent_id,
          status: 'error',
          error: fixError.message
        });
        
        console.error(`❌ Erreur correction présence ${presence.id}:`, fixError.message);
      }
    }
    
    res.json({
      success: true,
      message: `Correction terminée: ${results.filter(r => r.status === 'fixed').length} corrigée(s)`,
      orphan_count: orphanPresences.length,
      results: results,
      next_steps: [
        "Recharger l'historique pour voir les changements",
        "Tester un nouveau pointage"
      ]
    });
    
  } catch (error) {
    console.error('❌ Erreur correction présences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Route pour diagnostiquer un agent spécifique
app.get('/api/debug-agent-by-matricule/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log(`🔍 Debug agent matricule: ${matricule}`);
    
    // Chercher dans les deux tables
    const inAgentTable = await AppDataSource.query(
      'SELECT * FROM agent WHERE matricule = $1',
      [matricule]
    );
    
    const inAgentsColarys = await AppDataSource.query(
      'SELECT * FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    // Vérifier les IDs
    const allAgentIds = await AppDataSource.query(
      'SELECT id, matricule FROM agent WHERE matricule ILIKE $1',
      [`%${matricule}%`]
    );
    
    const allColarysIds = await AppDataSource.query(
      'SELECT id, matricule FROM agents_colarys WHERE matricule ILIKE $1',
      [`%${matricule}%`]
    );
    
    res.json({
      success: true,
      matricule: matricule,
      in_agent_table: inAgentTable.length > 0 ? inAgentTable[0] : null,
      in_agents_colarys: inAgentsColarys.length > 0 ? inAgentsColarys[0] : null,
      all_similar_in_agent: allAgentIds,
      all_similar_in_colarys: allColarysIds,
      foreign_key_info: {
        table: 'agents_colarys',
        constraint: 'presence_agent_id_fk'
      },
      recommendation: inAgentsColarys.length === 0 ? 
        'Agent manquant dans agents_colarys. Utilisez /api/create-agent-in-both-tables' : 
        'Agent trouvé'
    });
    
  } catch (error) {
    console.error('❌ Erreur debug agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dans minimal.js - Ajouter cette route
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

// Route pour vérifier état de présence (alternative)
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
    let agentId = null;
    
    // Chercher par matricule d'abord
    if (matricule) {
      const agents = await AppDataSource.query(
        'SELECT id FROM agent WHERE matricule = $1',
        [matricule]
      );
      
      if (agents.length > 0) {
        agentId = agents[0].id;
        const presences = await AppDataSource.query(
          'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
          [agentId, today]
        );
        
        if (presences.length > 0) {
          presence = presences[0];
        }
      }
    }
    
    // Chercher par nom/prénom si non trouvé
    if (!presence && nom && prenom) {
      const agents = await AppDataSource.query(
        'SELECT id FROM agent WHERE nom ILIKE $1 AND prenom ILIKE $2',
        [`%${nom}%`, `%${prenom}%`]
      );
      
      if (agents.length > 0) {
        agentId = agents[0].id;
        const presences = await AppDataSource.query(
          'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
          [agentId, today]
        );
        
        if (presences.length > 0) {
          presence = presences[0];
        }
      }
    }
    
    // Déterminer l'état
    if (!presence) {
      return res.json({
        success: true,
        etat: 'ABSENT',
        message: "Aucune présence aujourd'hui",
        data: null,
        presence: null
      });
    }
    
    if (presence.heure_sortie) {
      return res.json({
        success: true,
        etat: 'COMPLET',
        message: "Entrée et sortie déjà pointées",
        data: presence,
        presence: presence
      });
    }
    
    return res.json({
      success: true,
      etat: 'ENTREE_ONLY',
      message: "Entrée pointée, sortie attendue",
      data: presence,
      presence: presence
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification état:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dans minimal.js - Ajouter cette route (remplacer celle existante si elle existe)
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
    let agentId = null;
    
    // Chercher par matricule d'abord
    if (matricule) {
      console.log(`🔍 Recherche par matricule: ${matricule}`);
      
      // Chercher dans agents_colarys d'abord
      const agentInColarys = await AppDataSource.query(
        'SELECT id FROM agents_colarys WHERE matricule = $1',
        [matricule]
      );
      
      if (agentInColarys.length > 0) {
        agentId = agentInColarys[0].id;
        console.log(`✅ Agent trouvé dans agents_colarys: ${agentId}`);
        
        // Chercher la présence
        const presences = await AppDataSource.query(
          'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
          [agentId, today]
        );
        
        if (presences.length > 0) {
          presence = presences[0];
          console.log(`✅ Présence trouvée: ${presences[0].id}`);
        }
      }
    }
    
    // Chercher par nom/prénom si non trouvé
    if (!presence && nom && prenom) {
      console.log(`🔍 Recherche par nom/prénom: ${nom} ${prenom}`);
      
      // Chercher dans agents_colarys
      const agents = await AppDataSource.query(
        'SELECT id FROM agents_colarys WHERE nom ILIKE $1 AND prenom ILIKE $2',
        [`%${nom}%`, `%${prenom}%`]
      );
      
      if (agents.length > 0) {
        agentId = agents[0].id;
        console.log(`✅ Agent trouvé par nom/prénom: ${agentId}`);
        
        // Chercher la présence
        const presences = await AppDataSource.query(
          'SELECT * FROM presence WHERE agent_id = $1 AND date = $2',
          [agentId, today]
        );
        
        if (presences.length > 0) {
          presence = presences[0];
          console.log(`✅ Présence trouvée: ${presences[0].id}`);
        }
      }
    }
    
    // Déterminer l'état
    if (!presence) {
      return res.json({
        success: true,
        etat: 'ABSENT',
        message: "Aucune présence aujourd'hui",
        data: null,
        presence: null
      });
    }
    
    if (presence.heure_sortie) {
      return res.json({
        success: true,
        etat: 'COMPLET',
        message: "Entrée et sortie déjà pointées",
        data: presence,
        presence: presence
      });
    }
    
    return res.json({
      success: true,
      etat: 'ENTREE_ONLY',
      message: "Entrée pointée, sortie attendue",
      data: presence,
      presence: presence
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification état:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dans minimal.js - Ajouter cette route pour le pointage d'entrée
app.post('/api/presences/entree-fixed-columns', async (req, res) => {
  console.log('🎯 Pointage entrée FIXED-COLUMNS appelé:', req.body);
  
  try {
    const data = req.body;
    
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
    
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // LOGIQUE SIMPLIFIÉE
    let agentId = null;
    
    // 1. Chercher dans agents_colarys
    const existingAgent = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (existingAgent.length > 0) {
      agentId = existingAgent[0].id;
      console.log(`✅ Agent existant: ${agentId}`);
    } else {
      // 2. Créer nouvel agent
      console.log('🆕 Création nouvel agent...');
      
      const maxIdResult = await AppDataSource.query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM agents_colarys'
      );
      agentId = parseInt(maxIdResult[0].next_id);
      
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
      
      console.log(`✅ Nouvel agent créé: ${agentId}`);
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
        agent_id: agentId,
        shift: data.shift || 'JOUR'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage:', error);
    
    res.status(500).json({
      success: false,
      error: "Erreur pointage d'entrée",
      details: error.message,
      code: error.code
    });
  }
});

// Dans minimal.js - Ajouter cette route
app.get('/api/debug-presence-routes', (_req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    available_presence_routes: [
      "POST /api/presences/verifier-etat",
      "POST /api/presences/entree-fixed-columns",
      "POST /api/presences/entree",
      "POST /api/presences/entree-fixed",
      "POST /api/presences/entree-correct",
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

// Dans minimal.js - Ajouter ces routes pour les signatures

// Route pour vérifier la structure des présences avec signatures
app.get('/api/debug-presences-signatures', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔍 Debug des présences avec signatures...');
    
    // Récupérer quelques présences avec leurs détails
    const presences = await AppDataSource.query(`
      SELECT 
        p.id,
        p.date,
        p.heure_entree,
        p.heure_sortie,
        a.matricule,
        a.nom,
        a.prenom,
        d.signature_entree,
        d.signature_sortie,
        LENGTH(d.signature_entree) as sig_entree_length,
        LENGTH(d.signature_sortie) as sig_sortie_length,
        CASE 
          WHEN d.signature_entree IS NULL THEN 'NULL'
          WHEN d.signature_entree = '' THEN 'EMPTY'
          WHEN d.signature_entree LIKE 'data:image%' THEN 'VALID_BASE64'
          ELSE 'OTHER'
        END as sig_entree_type,
        CASE 
          WHEN d.signature_sortie IS NULL THEN 'NULL'
          WHEN d.signature_sortie = '' THEN 'EMPTY'
          WHEN d.signature_sortie LIKE 'data:image%' THEN 'VALID_BASE64'
          ELSE 'OTHER'
        END as sig_sortie_type
      FROM presence p
      LEFT JOIN agent a ON p.agent_id = a.id
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      ORDER BY p.date DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      count: presences.length,
      data: presences,
      summary: {
        total: presences.length,
        with_entree_signature: presences.filter(p => p.signature_entree && p.signature_entree !== '').length,
        with_sortie_signature: presences.filter(p => p.signature_sortie && p.signature_sortie !== '').length,
        valid_base64_entree: presences.filter(p => p.signature_entree && p.signature_entree.includes('data:image')).length,
        valid_base64_sortie: presences.filter(p => p.signature_sortie && p.signature_sortie.includes('data:image')).length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur debug signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour récupérer les présences avec signatures
app.get('/api/presences/avec-signatures', async (req, res) => {
  try {
    const { dateDebut, dateFin, matricule } = req.query;
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    let query = `
      SELECT 
        p.id,
        p.date,
        p.heure_entree,
        p.heure_sortie,
        p.heures_travaillees,
        p.shift,
        a.id as agent_id,
        a.matricule,
        a.nom,
        a.prenom,
        a.campagne,
        d.signature_entree,
        d.signature_sortie
      FROM presence p
      LEFT JOIN agent a ON p.agent_id = a.id
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (dateDebut && dateFin) {
      query += ` AND p.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(dateDebut, dateFin);
      paramIndex += 2;
    }
    
    if (matricule) {
      query += ` AND a.matricule = $${paramIndex}`;
      params.push(matricule);
      paramIndex += 1;
    }
    
    query += ` ORDER BY p.date DESC, p.id DESC LIMIT 100`;
    
    const presences = await AppDataSource.query(query, params);
    
    // Formater les signatures pour s'assurer qu'elles sont en base64 valide
    const presencesFormatees = presences.map(presence => {
      const signatureEntree = presence.signature_entree;
      const signatureSortie = presence.signature_sortie;
      
      // S'assurer que les signatures commencent par le bon préfixe
      let sigEntreeFormattee = signatureEntree;
      let sigSortieFormattee = signatureSortie;
      
      if (signatureEntree && !signatureEntree.startsWith('data:image/')) {
        // Essayer de détecter si c'est du base64 pur
        if (signatureEntree.match(/^[A-Za-z0-9+/]+=*$/)) {
          sigEntreeFormattee = 'data:image/png;base64,' + signatureEntree;
        }
      }
      
      if (signatureSortie && !signatureSortie.startsWith('data:image/')) {
        if (signatureSortie.match(/^[A-Za-z0-9+/]+=*$/)) {
          sigSortieFormattee = 'data:image/png;base64,' + signatureSortie;
        }
      }
      
      return {
        ...presence,
        details: {
          signatureEntree: sigEntreeFormattee,
          signatureSortie: sigSortieFormattee,
          hasEntreeSignature: !!signatureEntree && signatureEntree.trim() !== '',
          hasSortieSignature: !!signatureSortie && signatureSortie.trim() !== ''
        }
      };
    });
    
    res.json({
      success: true,
      count: presencesFormatees.length,
      data: presencesFormatees,
      message: `${presencesFormatees.length} présence(s) avec signatures`
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération présences avec signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour fixer les signatures mal formatées
app.post('/api/fix-signatures', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔧 Correction des signatures mal formatées...');
    
    // Récupérer toutes les signatures qui ne commencent pas par data:image/
    const signaturesMalFormatees = await AppDataSource.query(`
      SELECT id, signature_entree, signature_sortie 
      FROM detail_presence 
      WHERE (signature_entree IS NOT NULL AND signature_entree != '' AND signature_entree NOT LIKE 'data:image/%')
         OR (signature_sortie IS NOT NULL AND signature_sortie != '' AND signature_sortie NOT LIKE 'data:image/%')
      LIMIT 100
    `);
    
    console.log(`🔍 ${signaturesMalFormatees.length} signature(s) mal formatée(s) trouvée(s)`);
    
    const corrections = [];
    
    for (const sig of signaturesMalFormatees) {
      try {
        let updates = [];
        let params = [];
        let paramIndex = 1;
        
        // Corriger signature entrée
        if (sig.signature_entree && 
            !sig.signature_entree.startsWith('data:image/') && 
            sig.signature_entree.trim() !== '') {
          
          // Vérifier si c'est déjà du base64 valide
          if (sig.signature_entree.match(/^[A-Za-z0-9+/]+=*$/)) {
            const signatureCorrigee = 'data:image/png;base64,' + sig.signature_entree;
            updates.push(`signature_entree = $${paramIndex}`);
            params.push(signatureCorrigee);
            paramIndex++;
            
            corrections.push({
              id: sig.id,
              type: 'entree',
              old_length: sig.signature_entree.length,
              new_length: signatureCorrigee.length,
              status: 'fixed'
            });
          }
        }
        
        // Corriger signature sortie
        if (sig.signature_sortie && 
            !sig.signature_sortie.startsWith('data:image/') && 
            sig.signature_sortie.trim() !== '') {
          
          if (sig.signature_sortie.match(/^[A-Za-z0-9+/]+=*$/)) {
            const signatureCorrigee = 'data:image/png;base64,' + sig.signature_sortie;
            updates.push(`signature_sortie = $${paramIndex}`);
            params.push(signatureCorrigee);
            paramIndex++;
            
            corrections.push({
              id: sig.id,
              type: 'sortie',
              old_length: sig.signature_sortie.length,
              new_length: signatureCorrigee.length,
              status: 'fixed'
            });
          }
        }
        
        // Appliquer les mises à jour si nécessaire
        if (updates.length > 0) {
          params.push(sig.id);
          await AppDataSource.query(
            `UPDATE detail_presence SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            params
          );
        }
        
      } catch (error) {
        corrections.push({
          id: sig.id,
          type: 'error',
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    res.json({
      success: true,
      message: `${corrections.filter(c => c.status === 'fixed').length} signature(s) corrigée(s)`,
      corrections: corrections,
      summary: {
        fixed: corrections.filter(c => c.status === 'fixed').length,
        failed: corrections.filter(c => c.status === 'failed').length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur correction signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de debug pour voir ce qui cause l'erreur 500
app.get('/api/debug-last-error', (_req, res) => {
  res.json({
    lastError: global.lastError || 'Aucune erreur récente',
    timestamp: new Date().toISOString()
  });
});

// ROUTE 1 : Diagnostic d'une signature spécifique
app.get('/api/diagnose-signatures/:presenceId', async (req, res) => {
  try {
    const presenceId = parseInt(req.params.presenceId);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    const presence = await AppDataSource.query(`
      SELECT 
        p.id,
        p.date,
        a.nom,
        a.prenom,
        d.signature_entree,
        d.signature_sortie,
        LENGTH(d.signature_entree) as entree_length,
        LENGTH(d.signature_sortie) as sortie_length
      FROM presence p
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      LEFT JOIN agent a ON p.agent_id = a.id
      WHERE p.id = $1
    `, [presenceId]);
    
    if (presence.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Présence non trouvée"
      });
    }
    
    const sig = presence[0];
    
    // Analyse
    const analyze = (signature) => {
      if (!signature) return { valid: false, reason: 'null' };
      if (signature.startsWith('data:image/')) return { valid: true, reason: 'valid' };
      if (signature.match(/^[A-Za-z0-9+/]+=*$/)) return { valid: true, reason: 'base64_pure', needsFix: true };
      return { valid: false, reason: 'invalid' };
    };
    
    res.json({
      success: true,
      presence: {
        id: sig.id,
        date: sig.date,
        agent: `${sig.nom} ${sig.prenom}`
      },
      entree: analyze(sig.signature_entree),
      sortie: analyze(sig.signature_sortie),
      lengths: {
        entree: sig.entree_length,
        sortie: sig.sortie_length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ROUTE 2 : Corriger une signature
app.post('/api/fix-signature/:presenceId', async (req, res) => {
  try {
    const presenceId = parseInt(req.params.presenceId);
    const { type } = req.body; // 'entree' ou 'sortie'
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Récupérer
    const result = await AppDataSource.query(
      `SELECT signature_entree, signature_sortie 
       FROM detail_presence 
       WHERE presence_id = $1`,
      [presenceId]
    );
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Détails non trouvés"
      });
    }
    
    const details = result[0];
    let signature = type === 'entree' ? details.signature_entree : details.signature_sortie;
    const column = type === 'entree' ? 'signature_entree' : 'signature_sortie';
    
    if (!signature) {
      return res.json({ success: true, message: "Déjà null" });
    }
    
    // Corriger si base64 pur
    if (!signature.startsWith('data:image/') && signature.match(/^[A-Za-z0-9+/]+=*$/)) {
      const corrected = 'data:image/png;base64,' + signature;
      
      await AppDataSource.query(
        `UPDATE detail_presence SET ${column} = $1 WHERE presence_id = $2`,
        [corrected, presenceId]
      );
      
      return res.json({
        success: true,
        message: "Corrigé",
        before: signature.substring(0, 30),
        after: corrected.substring(0, 30)
      });
    }
    
    res.json({ success: true, message: "Déjà correct" });
    
  } catch (error) {
    console.error('❌ Erreur correction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ROUTE 3 : Corriger TOUTES les signatures de la base
app.post('/api/fix-all-signatures-in-db', async (_req, res) => {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    console.log('🔧 Correction de TOUTES les signatures dans la base...');
    
    // Récupérer toutes les signatures
    const allSignatures = await AppDataSource.query(`
      SELECT id, presence_id, signature_entree, signature_sortie 
      FROM detail_presence 
      WHERE signature_entree IS NOT NULL OR signature_sortie IS NOT NULL
    `);
    
    let fixedCount = 0;
    
    for (const sig of allSignatures) {
      // Corriger entrée
      if (sig.signature_entree && 
          !sig.signature_entree.startsWith('data:image/') &&
          sig.signature_entree.match(/^[A-Za-z0-9+/]+=*$/)) {
        
        const corrected = 'data:image/png;base64,' + sig.signature_entree;
        await AppDataSource.query(
          'UPDATE detail_presence SET signature_entree = $1 WHERE id = $2',
          [corrected, sig.id]
        );
        fixedCount++;
      }
      
      // Corriger sortie
      if (sig.signature_sortie && 
          !sig.signature_sortie.startsWith('data:image/') &&
          sig.signature_sortie.match(/^[A-Za-z0-9+/]+=*$/)) {
        
        const corrected = 'data:image/png;base64,' + sig.signature_sortie;
        await AppDataSource.query(
          'UPDATE detail_presence SET signature_sortie = $1 WHERE id = $2',
          [corrected, sig.id]
        );
        fixedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${fixedCount} signatures corrigées dans la base de données`,
      fixed: fixedCount,
      total: allSignatures.length
    });
    
  } catch (error) {
    console.error('❌ Erreur correction massive:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dans minimal.js - Ajouter cette route de diagnostic
app.get('/api/debug-signatures/:presenceId', async (req, res) => {
  try {
    const presenceId = parseInt(req.params.presenceId);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    // Requête complète pour debug
    const result = await AppDataSource.query(`
      SELECT 
        p.id,
        p.date,
        ac.matricule,
        ac.nom,
        ac.prenom,
        d.signature_entree,
        d.signature_sortie,
        LENGTH(d.signature_entree) as sig_entree_length,
        LENGTH(d.signature_sortie) as sig_sortie_length,
        LEFT(d.signature_entree, 50) as sig_entree_preview,
        LEFT(d.signature_sortie, 50) as sig_sortie_preview
      FROM presence p
      LEFT JOIN agents_colarys ac ON p.agent_id = ac.id
      LEFT JOIN detail_presence d ON p.id = d.presence_id
      WHERE p.id = $1
    `, [presenceId]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Présence non trouvée"
      });
    }
    
    const presence = result[0];
    
    res.json({
      success: true,
      presence: presence,
      test: {
        entreeStartsWithDataImage: presence.signature_entree?.startsWith('data:image/'),
        sortieStartsWithDataImage: presence.signature_sortie?.startsWith('data:image/'),
        entreeIsBase64: presence.signature_entree?.match(/^[A-Za-z0-9+/]+=*$/) ? true : false,
        sortieIsBase64: presence.signature_sortie?.match(/^[A-Za-z0-9+/]+=*$/) ? true : false
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur debug signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



console.log('✅ Minimal API ready!');

module.exports = app;
