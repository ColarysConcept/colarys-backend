-- Table des employés
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    Matricule TEXT UNIQUE NOT NULL,
    Nom TEXT NOT NULL,
    Prénom TEXT NOT NULL,
    Adresse TEXT,
    "N° Téléphone" TEXT,
    Fonction TEXT,
    "Mode de paiement" TEXT,
    Catégorie TEXT,
    Compagne TEXT,
    "Salaire de base" DECIMAL(10,2) DEFAULT 0,
    "Solde initial congé" INTEGER DEFAULT 0,
    "Solde de congé" INTEGER DEFAULT 0,
    "Date d'embauche" DATE,
    Ancienneté TEXT,
    "distance du lieu de travaille" TEXT,
    "droit ostie" TEXT DEFAULT '0',
    "droit transport et repas" TEXT DEFAULT '0',
    "Situation maritale" TEXT,
    "Nombre d'enfants" INTEGER DEFAULT 0,
    "Contact d'urgence - Nom et prénom" TEXT,
    Relation TEXT,
    "Adresse du contact d'urgence" TEXT,
    "Téléphone contact urgence" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des présences
CREATE TABLE presences (
    id BIGSERIAL PRIMARY KEY,
    matricule TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    type TEXT CHECK (type IN ('p', 'n', 'a', 'c', 'm', 'f', 'o', '')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(matricule, year, month, day)
);

-- Table des salaires (primes et données manuelles)
CREATE TABLE salaires (
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
);

-- Index pour les performances
CREATE INDEX idx_employees_matricule ON employees(Matricule);
CREATE INDEX idx_presences_matricule_date ON presences(matricule, year, month);
CREATE INDEX idx_salaires_matricule_date ON salaires(matricule, year, month);


-- Vérifier le nombre total d'employés
SELECT COUNT(*) as total_employes FROM employees;

-- Vérifier le nombre total de salaires
SELECT COUNT(*) as total_salaires FROM salaires;

-- Voir la liste complète des employés
SELECT "Matricule", "Nom", "Prénom", "Fonction", "Date d'embauche" 
FROM employees 
ORDER BY "Matricule";

-- Vérifier quelques salaires
SELECT matricule, year, month, "Prime de production", "Social"
FROM salaires 
ORDER BY matricule, year, month 
LIMIT 10;


-- Supprimer complètement les tables si elles existent
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS presences CASCADE;
DROP TABLE IF EXISTS salaires CASCADE;