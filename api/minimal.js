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
    
    // ✅ 1. GÉRER LE MATRICULE
    let matricule = data.matricule?.trim();
    if (!matricule || matricule === '') {
      // Générer un matricule automatique
      const { v4: uuidv4 } = require('uuid');
      matricule = `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
      console.log('🎫 Matricule généré:', matricule);
    }
    
    // ✅ 2. CHERCHER OU CRÉER L'AGENT
    let agentId = null;
    
    // Chercher l'agent existant
    const existingAgent = await AppDataSource.query(
      'SELECT id FROM agents_colarys WHERE matricule = $1',
      [matricule]
    );
    
    if (existingAgent.length > 0) {
      // Agent existant
      agentId = existingAgent[0].id;
      console.log('✅ Agent existant trouvé, ID:', agentId);
    } else {
      // ✅ CRÉER LE NOUVEL AGENT
      console.log('🆕 Création nouvel agent...');
      
      try {
          const newAgent = await AppDataSource.query(
          `INSERT INTO agents_colarys 
          (matricule, nom, prenom, role, mail, contact, entreprise, image, "imagePublicId", "created_at", "updated_at") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
          RETURNING id`,
          [
            matricule,
            data.nom,
            data.prenom,
            data.shift === 'Stagiaire' ? 'Stagiaire' : 'Agent', // Utiliser 'role' au lieu de 'campagne'
            data.email || `${data.nom.toLowerCase()}.${data.prenom.toLowerCase()}@colarys.com`,
            data.contact || '',
            data.entreprise || 'Colarys Concept',
            '/images/default-avatar.svg',
            'default-avatar'
          ]
        );
        
        agentId = newAgent[0].id;
        console.log('✅ Nouvel agent créé, ID:', agentId);
        
      } catch (createError) {
        console.error('❌ Erreur création agent:', createError);
        // Si échec, essayer avec moins de champs
        const simpleAgent = await AppDataSource.query(
          `INSERT INTO agents_colarys 
           (matricule, nom, prenom, campagne, role, "created_at") 
           VALUES ($1, $2, $3, $4, $5, NOW()) 
           RETURNING id`,
          [
            matricule,
            data.nom,
            data.prenom,
            data.campagne || 'Standard',
            data.shift === 'Stagiaire' ? 'Stagiaire' : 'Agent'
          ]
        );
        
        agentId = simpleAgent[0].id;
        console.log('✅ Agent créé (version simple), ID:', agentId);
      }
    }
    
    // ✅ 3. VÉRIFIER SI PRÉSENCE EXISTE DÉJÀ
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
    
    // ✅ 4. CRÉER LA PRÉSENCE
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
        agent_nouveau: existingAgent.length === 0 // Indique si nouvel agent
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur pointage entrée:', error);
    res.status(500).json({
      success: false,
      error: "Erreur pointage entrée",
      message: error.message
    });
  }
});
// Voir la structure de la table presence
app.get('/api/debug-presence-structure', async (req, res) => {
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
    
    // Calculer heures travaillées si entrée existe
    let heuresTravaillees = null;
    
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
        heures_travaillees: heuresTravaillees,
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

// 5. Vérifier toutes les routes de présence
app.get('/api/presences/routes', (req, res) => {
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
app.get('/api/presences/recent', async (req, res) => {
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

// 4. Route pour historique des présences (manquante !)
app.get('/api/presences/historique', async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    console.log(`📊 Historique: ${dateDebut} à ${dateFin}`);
    
    if (!dbInitialized) {
      await initializeDatabase();
    }
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        error: "dateDebut et dateFin requis"
      });
    }
    
    let presences = [];
    try {
      presences = await AppDataSource.query(`
        SELECT p.*, a.matricule, a.nom, a.prenom 
        FROM presence p
        LEFT JOIN agent a ON p.agent_id = a.id
        WHERE p.date BETWEEN $1 AND $2
        ORDER BY p.date DESC, a.nom, a.prenom
      `, [dateDebut, dateFin]);
    } catch (error) {
      console.log('⚠️ Historique erreur:', error.message);
      // Fallback: chercher sans join
      try {
        presences = await AppDataSource.query(
          'SELECT * FROM presence WHERE date BETWEEN $1 AND $2 ORDER BY date DESC',
          [dateDebut, dateFin]
        );
      } catch (error2) {
        console.log('⚠️ Simple query aussi échoué:', error2.message);
      }
    }
    
    res.json({
      success: true,
      data: presences,
      count: presences.length,
      periode: { dateDebut, dateFin }
    });


     const presencesCompletes = [];
    for (const presence of presences) {
      let agent = null;
      
      try {
        const agents = await AppDataSource.query(
          'SELECT id, matricule, nom, prenom, role as campagne FROM agents_colarys WHERE id = $1',
          [presence.agent_id]
        );
        
        if (agents.length > 0) {
          agent = agents[0];
        }
      } catch (agentError) {
        console.log('⚠️ Erreur récupération agent:', agentError.message);
      }
      
      // ✅ TOUJOURS retourner un objet agent (même vide)
      const presenceFormatee = {
        id: presence.id,
        date: presence.date,
        heureEntree: presence.heure_entree,
        heureSortie: presence.heure_sortie,
        shift: presence.shift || 'JOUR',
        heuresTravaillees: presence.heures_travaillees || 8.00,
        createdAt: presence.created_at,
        agent: agent || { // ✅ Toujours un objet agent
          id: 0,
          matricule: '',
          nom: 'Agent inconnu',
          prenom: '',
          campagne: 'Non défini'
        },
        details: presence.details_id ? {
          id: presence.details_id,
          signatureEntree: presence.signature_entree,
          signatureSortie: presence.signature_sortie
        } : null
      };
      
      presencesCompletes.push(presenceFormatee);
    }
    
  } catch (error) {
    console.error('❌ Error historique:', error);
    res.status(500).json({
      success: false,
      error: "Erreur historique"
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
app.get('/api/test-presence-connection', async (req, res) => {
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

app.get('/api/all-routes', (req, res) => {
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

// Route pour corriger tous les agents manquants
app.get('/api/fix-all-missing-agents', async (req, res) => {
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

console.log('✅ Minimal API ready!');

module.exports = app;
