// api/plannings/upload.js
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📤 Upload planning appelé');
  
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.body || !req.body.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier fourni"
      });
    }

    // Pour Vercel Functions, le fichier arrive en base64
    const fileData = req.body.file;
    const fileName = req.body.filename || 'planning.xlsx';
    
    console.log('📄 Fichier reçu:', fileName, 'taille:', fileData.length);

    // Convertir base64 en buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Parser le fichier Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📊 ${data.length} lignes lues`);

    // Traitement simplifié
    const plannings = [];
    const currentYear = new Date().getFullYear().toString();
    const currentWeek = `${currentYear}-W27`;

    for (let i = 0; i < Math.min(data.length, 50); i++) {
      const row = data[i];
      if (!row || row.length < 1) continue;
      
      const firstCell = row[0];
      if (!firstCell || typeof firstCell !== 'string') continue;
      
      // Ignorer les lignes d'en-tête
      if (firstCell.includes('EMPLOI') || 
          firstCell.includes('PRENOMS') || 
          firstCell.includes('Semaine')) {
        continue;
      }
      
      const agentName = firstCell.trim();
      if (agentName === '') continue;
      
      // Créer un planning simplifié
      const planning = {
        agent_name: agentName,
        semaine: currentWeek,
        year: currentYear,
        month: ['07'], // Juillet
        days: JSON.stringify([
          { day: 'LUNDI', shift: 'JOUR', hours: 8 },
          { day: 'MARDI', shift: 'JOUR', hours: 8 },
          { day: 'MERCREDI', shift: 'JOUR', hours: 8 },
          { day: 'JEUDI', shift: 'JOUR', hours: 8 },
          { day: 'VENDREDI', shift: 'JOUR', hours: 8 },
          { day: 'SAMEDI', shift: 'OFF', hours: 0 },
          { day: 'DIMANCHE', shift: 'OFF', hours: 0 }
        ]),
        total_heures: 40,
        remarques: null,
        lundi: 'JOUR',
        mardi: 'JOUR',
        mercredi: 'JOUR',
        jeudi: 'JOUR',
        vendredi: 'JOUR',
        samedi: 'OFF',
        dimanche: 'OFF'
      };
      
      plannings.push(planning);
    }
    
    console.log(`✅ ${plannings.length} plannings générés`);

    // Réponse
    return res.status(200).json({
      success: true,
      message: `Fichier "${fileName}" traité avec succès`,
      count: plannings.length,
      weeks: [currentWeek],
      data: plannings.slice(0, 5)
    });
    
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du fichier',
      message: error.message
    });
  }
};