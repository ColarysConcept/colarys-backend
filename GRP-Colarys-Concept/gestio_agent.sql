-- Gestion Agents
-- 1. Création de la table agents_colarys
CREATE TABLE agents_colarys (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    image VARCHAR,
    contact VARCHAR(20),
    mail VARCHAR(100) UNIQUE NOT NULL,
    entreprise VARCHAR(100) DEFAULT 'Colarys Concept' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Création des index pour optimiser les performances
CREATE INDEX idx_agents_colarys_matricule ON agents_colarys(matricule);
CREATE INDEX idx_agents_colarys_nom_prenom ON agents_colarys(nom, prenom);
CREATE INDEX idx_agents_colarys_role ON agents_colarys(role);
CREATE INDEX idx_agents_colarys_mail ON agents_colarys(mail);
CREATE INDEX idx_agents_colarys_entreprise ON agents_colarys(entreprise);

-- 3. Insertion de données de test
INSERT INTO agents_colarys (matricule, nom, prenom, role, contact, mail, image) 
VALUES 
('COL001', 'Dupont', 'Jean', 'Administrateur', '+33 1 23 45 67 89', 'jean.dupont@colarys.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('COL002', 'Martin', 'Marie', 'Agent de production', '+33 1 34 56 78 90', 'marie.martin@colarys.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
('COL003', 'Bernard', 'Pierre', 'Superviseur', '+33 1 45 67 89 01', 'pierre.bernard@colarys.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');

-- 4. Vérification
SELECT * FROM agents_colarys;