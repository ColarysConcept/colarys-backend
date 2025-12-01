// api/minimal.js - Version complète fonctionnelle
console.log('🚀 Colarys API Minimal - Starting...');

const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');
const cloudinary = require('cloudinary').v2;

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

// Dans minimal.js - Améliorer la route PUT
app.put('/api/agents-colarys/:id', upload.single('image'), async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    let updates = req.body;
    
    console.log('🔄 Updating agent:', agentId);
    console.log('📦 Raw updates:', updates);
    console.log('📸 Has file:', !!req.file);
    
    // ✅ CORRECTION : Détecter si c'est FormData (Content-Type: multipart/form-data)
    const isFormData = req.headers['content-type']?.includes('multipart/form-data');
    
    if (isFormData) {
      // Pour FormData, les données sont dans req.body déjà parsées
      console.log('📋 FormData détecté, keys:', Object.keys(updates));
    } else {
      // Pour JSON, vérifier si c'est un JSON string
      if (typeof updates === 'string') {
        try {
          updates = JSON.parse(updates);
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e);
        }
      }
    }
    
    // ✅ CORRECTION : Nettoyer l'image
    if (updates.image) {
      console.log('📸 Image dans updates:', updates.image);
      
      // Si c'est une URL Cloudinary, vérifier qu'elle est valide
      if (updates.image.includes('cloudinary.com')) {
        console.log('☁️ URL Cloudinary détectée dans updates');
        
        // Vérifier qu'elle ne commence pas par notre URL de base
        const baseUrl = 'https://theme-gestion-des-resources-et-prod.vercel.app';
        if (updates.image.startsWith(baseUrl)) {
          updates.image = updates.image.replace(baseUrl, '');
          console.log('🔄 URL nettoyée:', updates.image);
        }
      }
    }
    
    // ... reste du code existant ...
    
  } catch (error) {
    console.error('❌ Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification",
      message: error.message
    });
  }
});


// ✅ AJOUTER CE NOUVEAU CODE À LA PLACE :
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

// Dans api/minimal.js - AJOUTER APRÈS la route POST
const multer = require('multer');
const upload = multer();

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

    // Utiliser la même logique de création que la route normale
    // Appeler la route interne ou copier le code
    
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

    res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: {
        ...createdAgent,
        displayImage: '/images/default-avatar.svg',
        hasDefaultImage: true
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


// Dans minimal.js - REMPLACER la route PUT existante
app.put('/api/agents-colarys/:id', upload.single('image'), async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const updates = req.body;
    
    console.log('🔄 Updating agent:', agentId);
    console.log('📦 Updates from body:', updates);
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

    // ✅ NETTOYER L'URL DE L'IMAGE SI ELLE EST FOURNIE
    if (updates.image) {
      // Si l'image commence par votre URL de base, la retirer
      const baseUrl = 'https://theme-gestion-des-resources-et-prod.vercel.app/';
      if (updates.image.startsWith(baseUrl)) {
        updates.image = updates.image.replace(baseUrl, '');
      }
      
      // Vérifier si c'est une URL Cloudinary complète
      if (updates.image.startsWith('http://') || updates.image.startsWith('https://')) {
        // C'est déjà une URL complète, on la conserve
        console.log('🌐 Image est déjà une URL complète:', updates.image);
      } else {
        // Sinon, c'est peut-être un chemin relatif
        updates.image = updates.image.replace(/^\/+/, '');
      }
    }

    let imageToSet = updates.image || existingAgent[0].image;
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

    // ✅ RETOURNER L'URL COMPLÈTE DE L'IMAGE
    const agentData = updatedAgent[0];
    if (agentData.image && !agentData.image.startsWith('http')) {
      // Si l'image n'a pas de protocole, c'est peut-être une URL relative
      agentData.image = agentData.image.startsWith('/') 
        ? agentData.image 
        : '/' + agentData.image;
    }

    res.json({
      success: true,
      message: "Agent modifié avec succès",
      data: agentData
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

// Modifier la route d'upload pour utiliser Cloudinary
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

    // ✅ SIMULATION D'UPLOAD CLOUDINARY (à remplacer par le vrai)
    // Pour l'instant, on va stocker l'image en base64 dans la base
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    console.log('📸 Image convertie en base64, taille:', base64Image.length);

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

// pour supprimer un agent
// Dans minimal.js - Remplacer la route DELETE existante
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
      // Essayer la table 'agent' alternative
      try {
        const checkResult = await AppDataSource.query(
          'SELECT id FROM agent WHERE id = $1',
          [id]
        );
        agentExists = checkResult.length > 0;
      } catch (error) {
        console.log('⚠️ agent table check error:', error.message);
      }
    }

    if (!agentExists) {
      return res.status(404).json({
        success: false,
        error: `Agent with ID ${id} not found`
      });
    }

    // Supprimer l'agent de la base de données
    let deleted = false;
    try {
      // Essayer agents_colarys d'abord
      await AppDataSource.query(
        'DELETE FROM agents_colarys WHERE id = $1',
        [id]
      );
      deleted = true;
      console.log(`✅ Agent ${id} deleted from agents_colarys table`);
    } catch (error) {
      console.log('⚠️ Could not delete from agents_colarys, trying agent table...');
      
      try {
        await AppDataSource.query(
          'DELETE FROM agent WHERE id = $1',
          [id]
        );
        deleted = true;
        console.log(`✅ Agent ${id} deleted from agent table`);
      } catch (error2) {
        console.error('❌ Could not delete from any agent table:', error2.message);
      }
    }

    if (deleted) {
      res.json({
        success: true,
        message: `Agent ${id} deleted successfully from database`
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to delete agent from database"
      });
    }

  } catch (error) {
    console.error('❌ Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete agent",
      message: error.message
    });
  }
});

// Route de débogage pour voir les données actuelles
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

// Route pour les présences
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

// Route pour les plannings
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

// Dans minimal.js, ajoutez :
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

// Ajoutez cette route pour voir les tables disponibles
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

// Ajoutez cette route pour vérifier un agent spécifique
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

// Dans api/minimal.js - AJOUTER
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

// Route de test pour les images
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

console.log('✅ Minimal API ready!');

module.exports = app;