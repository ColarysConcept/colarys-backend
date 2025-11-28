// src/scripts/create-tables.ts
import { supabase } from '../lib/supabase';

async function createTables() {
  console.log('🚀 Création des tables Supabase...');
  
  try {
    // Table employees
    const { error: employeesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS employees (
          id BIGSERIAL PRIMARY KEY,
          "Matricule" TEXT UNIQUE NOT NULL,
          "Nom" TEXT NOT NULL,
          "Prénom" TEXT NOT NULL,
          "Adresse" TEXT,
          "N° Téléphone" TEXT,
          "Fonction" TEXT,
          "Mode de paiement" TEXT,
          "Catégorie" TEXT,
          "Compagne" TEXT,
          "Salaire de base" DECIMAL(10,2) DEFAULT 0,
          "Solde initial congé" DECIMAL(10,2) DEFAULT 0,
          "Solde de congé" DECIMAL(10,2) DEFAULT 0,
          "Date d'embauche" DATE,
          "Ancienneté" TEXT,
          "distance du lieu de travaille" TEXT,
          "droit ostie" TEXT DEFAULT '0',
          "droit transport et repas" TEXT DEFAULT '0',
          "Situation maritale" TEXT,
          "Nombre d'enfants" INTEGER DEFAULT 0,
          "Contact d'urgence - Nom et prénom" TEXT,
          "Relation" TEXT,
          "Adresse du contact d'urgence" TEXT,
          "Téléphone contact urgence" TEXT,
          "last_update" TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });

    if (employeesError) {
      console.log('✅ Table employees créée ou existe déjà');
    }

    // Table presences
    const { error: presencesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS presences (
          id BIGSERIAL PRIMARY KEY,
          matricule TEXT NOT NULL,
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          day INTEGER NOT NULL,
          type TEXT CHECK (type IN ('p', 'n', 'a', 'c', 'm', 'f', 'o', '')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(matricule, year, month, day)
        )
      `
    });

    if (presencesError) {
      console.log('✅ Table presences créée ou existe déjà');
    }

    // Table salaires
    const { error: salairesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS salaires (
          id BIGSERIAL PRIMARY KEY,
          matricule TEXT NOT NULL,
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          "Prime de production" DECIMAL(10,2) DEFAULT 0,
          "Prime d'assiduité" DECIMAL(10,2) DEFAULT 0,
          "Prime d'ancienneté" DECIMAL(10,2) DEFAULT 0,
          "Prime élite" DECIMAL(10,2) DEFAULT 0,
          "Prime de responsabilité" DECIMAL(10,2) DEFAULT 0,
          "Social" DECIMAL(10,2) DEFAULT 15000,
          "Avance sur salaire" DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(matricule, year, month)
        )
      `
    });

    if (salairesError) {
      console.log('✅ Table salaires créée ou existe déjà');
    }

    console.log('🎉 Tables créées avec succès!');

  } catch (error) {
    console.error('❌ Erreur création tables:', error);
  }
}

createTables();