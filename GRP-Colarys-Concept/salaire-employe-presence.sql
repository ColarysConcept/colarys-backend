-- Exécutez ce script dans l'éditeur SQL de Supabase
CREATE TABLE IF NOT EXISTS employes_mobile (
  id SERIAL PRIMARY KEY,
  matricule VARCHAR(20) UNIQUE NOT NULL,
  nom_complet VARCHAR(200) NOT NULL,
  fonction VARCHAR(100),
  salaire_base INTEGER,
  solde_conge DECIMAL(5,2),
  date_embauche DATE,
  anciennete VARCHAR(50),
  telephone VARCHAR(20),
  campagne VARCHAR(100),
  categorie VARCHAR(50),
  statut_conge VARCHAR(20),
  badges TEXT[], -- Array de badges
  contact_urgence JSONB, -- Stockage flexible des contacts
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_employes_mobile_matricule ON employes_mobile(matricule);
CREATE INDEX IF NOT EXISTS idx_employes_mobile_nom_complet ON employes_mobile(nom_complet);
CREATE INDEX IF NOT EXISTS idx_employes_mobile_fonction ON employes_mobile(fonction);

-- RLS (Row Level Security) - Optionnel
ALTER TABLE employes_mobile ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès à tous (ajuster selon vos besoins)
CREATE POLICY "Allow all access to employes_mobile" ON employes_mobile
  FOR ALL USING (true);