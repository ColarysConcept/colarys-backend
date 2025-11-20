-- Supprimer les tables existantes (attention aux données)
DROP TABLE IF EXISTS detail_presence CASCADE;
DROP TABLE IF EXISTS presence CASCADE;
DROP TABLE IF EXISTS agent CASCADE;

DELETE FROM detail_presence

DELETE FROM presence

DELETE FROM agent

-- Créer la table agent
CREATE TABLE agent (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR UNIQUE NOT NULL,
    nom VARCHAR NOT NULL,
    prenom VARCHAR NOT NULL,
    campagne VARCHAR DEFAULT 'Standard',
    signature TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table presence
CREATE TABLE presence (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agent(id),
    date DATE DEFAULT CURRENT_DATE,
    heure_entree TIME NOT NULL,
    heure_sortie TIME,
    shift VARCHAR DEFAULT 'JOUR',
    heures_travaillees DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table detail_presence
CREATE TABLE detail_presence (
    id SERIAL PRIMARY KEY,
    presence_id INTEGER UNIQUE REFERENCES presence(id),
    signature_entree TEXT NOT NULL,
    signature_sortie TEXT,
    observations TEXT
);



