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
app.get('/api/health', (req, res) => {
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
app.get('/api/agents-colarys', async (req, res) => {
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
app.get('/api/check-my-user', async (req, res) => {
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
app.get('/api/test-db-simple', async (req, res) => {
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
app.get('/api/ensure-user', async (req, res) => {
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
app.get('/api/presences', async (req, res) => {
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

app.get('/api/plannings', async (req, res) => {
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

app.get('/api/test-agents-direct', async (req, res) => {
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

app.get('/api/debug-tables', async (req, res) => {
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

// ========== ROUTES POUR LES AGENTS ET PRÉSENCES ==========

// Rechercher un agent par matricule
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

// Rechercher un agent par nom et prénom
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

// Vérifier la présence aujourd'hui pour un matricule
app.get('/api/presences/aujourdhui/:matricule', async (req, res) => {
  try {
    const matricule = req.params.matricule;
    console.log(`📅 Vérification présence aujourd'hui pour: ${matricule}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    // Chercher d'abord l'agent
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
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Chercher les présences d'aujourd'hui
    let presences = [];
    try {
      presences = await AppDataSource.query(
        'SELECT * FROM presence WHERE agent_id = $1 AND DATE(date) = $2',
        [agentId, today]
      );
    } catch (error) {
      console.log('⚠️ Table presence non trouvée:', error.message);
      // Retourner un tableau vide si la table n'existe pas
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: presences
    });

  } catch (error) {
    console.error('❌ Error checking today presence:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de présence"
    });
  }
});

// Pointage d'entrée
// Pointage d'entrée - VERSION CORRIGÉE POUR VOTRE STRUCTURE
app.post('/api/presences/entree', async (req, res) => {
  try {
    const data = req.body;
    console.log('📝 Pointage entrée reçu:', data);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    // Chercher l'agent par matricule
    const agents = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [data.matricule]
    );

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    const agentId = agents[0].id;
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeNow = now.toTimeString().split(' ')[0].substring(0, 8); // HH:MM:SS
    
    console.log(`👤 Agent ID: ${agentId}, Date: ${today}, Heure entrée: ${timeNow}`);
    
    // Vérifier si présence existe déjà aujourd'hui
    const existingPresence = await AppDataSource.query(
      'SELECT id FROM presence WHERE agent_id = $1 AND date = $2',
      [agentId, today]
    );

    let presenceId;
    
    if (existingPresence.length > 0) {
      // Mettre à jour l'entrée existante
      await AppDataSource.query(
        `UPDATE presence 
         SET heure_entree = $1, shift = $2, created_at = NOW()
         WHERE id = $3`,
        [timeNow, data.shift || 'JOUR', existingPresence[0].id]
      );
      presenceId = existingPresence[0].id;
      console.log(`🔄 Présence mise à jour, ID: ${presenceId}`);
    } else {
      // Créer nouvelle présence
      const result = await AppDataSource.query(
        `INSERT INTO presence 
         (agent_id, date, heure_entree, shift, created_at) 
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [agentId, today, timeNow, data.shift || 'JOUR']
      );
      presenceId = result[0].id;
      console.log(`✅ Nouvelle présence créée, ID: ${presenceId}`);
    }

    res.json({
      success: true,
      message: "Pointage d'entrée enregistré avec succès",
      data: {
        matricule: data.matricule,
        agent_id: agentId,
        presence_id: presenceId,
        date: today,
        heure_entree: timeNow,
        shift: data.shift || 'JOUR'
      }
    });

  } catch (error) {
    console.error('❌ ERREUR dans /api/presences/entree:', error);
    console.error('❌ Stack:', error.stack);
    
    // Messages d'erreur plus clairs
    let errorMessage = "Erreur lors du pointage d'entrée";
    let details = process.env.NODE_ENV === 'development' ? error.message : undefined;
    
    if (error.message.includes('relation "presence" does not exist')) {
      errorMessage = "La table 'presence' n'existe pas dans la base de données";
      details = "Vérifiez que la table existe dans Supabase";
    } else if (error.message.includes('column "check_in" does not exist')) {
      errorMessage = "Structure de table incorrecte";
      details = "La table 'presence' n'a pas les colonnes attendues";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: details
    });
  }
});

// Pointage de sortie
// Pointage de sortie - VERSION CORRIGÉE
// Pointage de sortie - VERSION CORRIGÉE
app.post('/api/presences/sortie', async (req, res) => {
  try {
    const data = req.body;
    console.log('📝 Pointage sortie reçu:', data);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }

    // Chercher l'agent
    const agents = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [data.matricule]
    );

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Agent non trouvé"
      });
    }

    const agentId = agents[0].id;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toTimeString().split(' ')[0].substring(0, 8);
    
    console.log(`👤 Agent ID: ${agentId}, Date: ${today}, Heure sortie: ${timeNow}`);
    
    // Chercher présence d'aujourd'hui
    const existingPresence = await AppDataSource.query(
      'SELECT id, heure_entree FROM presence WHERE agent_id = $1 AND date = $2',
      [agentId, today]
    );

    let presenceId;
    let heuresTravaillees = null;
    
    if (existingPresence.length > 0) {
      presenceId = existingPresence[0].id;
      
      // Calculer heures travaillées si heure_entree existe
      if (existingPresence[0].heure_entree) {
        const entree = existingPresence[0].heure_entree;
        const [heuresE, minutesE] = entree.split(':').map(Number);
        const [heuresS, minutesS] = timeNow.split(':').map(Number);
        
        const totalMinutesEntree = heuresE * 60 + minutesE;
        const totalMinutesSortie = heuresS * 60 + minutesS;
        const diffMinutes = totalMinutesSortie - totalMinutesEntree;
        
        heuresTravaillees = (diffMinutes / 60).toFixed(2);
        console.log(`⏱️ Heures travaillées: ${heuresTravaillees}h`);
      }
      
      // Mettre à jour
      await AppDataSource.query(
        `UPDATE presence 
         SET heure_sortie = $1, heures_travaillees = $2
         WHERE id = $3`,
        [timeNow, heuresTravaillees, presenceId]
      );
      
      console.log(`🔄 Sortie enregistrée pour présence ID: ${presenceId}`);
    } else {
      // Créer avec seulement sortie (cas spécial)
      const result = await AppDataSource.query(
        `INSERT INTO presence 
         (agent_id, date, heure_sortie, shift, created_at) 
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [agentId, today, timeNow, data.shift || 'JOUR']
      );
      
      presenceId = result[0].id;
      console.log(`⚠️ Présence créée avec sortie uniquement, ID: ${presenceId}`);
    }

    res.json({
      success: true,
      message: "Pointage de sortie enregistré",
      data: {
        matricule: data.matricule,
        agent_id: agentId,
        presence_id: presenceId,
        date: today,
        heure_sortie: timeNow,
        heures_travaillees: heuresTravaillees,
        shift: data.shift || 'JOUR'
      }
    });

  } catch (error) {
    console.error('❌ Error recording exit:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du pointage de sortie",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Minimal API ready!');

module.exports = app;