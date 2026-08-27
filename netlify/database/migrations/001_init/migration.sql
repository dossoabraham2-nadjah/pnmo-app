-- PNMO — schéma initial
-- Entités: users, sponsors, beneficiaires, mandataires, pharmacies,
-- prises_en_charge (PEC), paiements, codes (CUC/CUR), notifications,
-- audit_log, incidents, pharmacy_indisponibilites

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('SPONSOR','PHARMACY','ADMIN','SUPERADMIN')),
  identifiant_unique TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  telephone TEXT,
  password_hash TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active','suspendu')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('physique','morale')),
  nom TEXT,
  prenoms TEXT,
  date_naissance DATE,
  sexe TEXT,
  nationalite TEXT,
  piece_type TEXT,
  piece_numero TEXT,
  profession TEXT,
  raison_sociale TEXT,
  forme_juridique TEXT,
  rccm TEXT,
  cc TEXT,
  representant_legal TEXT,
  representant_fonction TEXT,
  telephone_secondaire TEXT,
  adresse TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'Côte d''Ivoire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE beneficiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifiant_unique TEXT NOT NULL UNIQUE,
  sponsor_createur_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
  nom TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  sexe TEXT,
  date_naissance DATE,
  nationalite TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'Côte d''Ivoire',
  lien_sponsor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  identifiant_unique TEXT NOT NULL UNIQUE,
  nom_commercial TEXT NOT NULL,
  pharmacien_titulaire TEXT,
  adresse TEXT NOT NULL,
  commune TEXT,
  ville TEXT NOT NULL,
  region TEXT,
  telephone_secondaire TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  statut TEXT NOT NULL DEFAULT 'pilote' CHECK (statut IN ('pilote','active','suspendue','retiree')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prises_en_charge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_unique TEXT NOT NULL UNIQUE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
  beneficiaire_id UUID NOT NULL REFERENCES beneficiaires(id) ON DELETE RESTRICT,
  pharmacie_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  mandataire_nom TEXT,
  mandataire_prenoms TEXT,
  mandataire_date_naissance DATE,
  mandataire_piece_type TEXT,
  mandataire_piece_numero TEXT,
  mandataire_telephone TEXT,
  mandataire_lien TEXT,
  ordonnance_reference TEXT NOT NULL,
  ordonnance_description TEXT,
  montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
  statut TEXT NOT NULL DEFAULT 'en_attente_paiement' CHECK (statut IN (
    'en_attente_paiement','paiement_echoue','paiement_valide','en_attente_retrait',
    'retiree','refusee','annulee','expiree'
  )),
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cloturee_at TIMESTAMPTZ
);

CREATE INDEX idx_pec_sponsor ON prises_en_charge(sponsor_id);
CREATE INDEX idx_pec_pharmacie ON prises_en_charge(pharmacie_id);
CREATE INDEX idx_pec_beneficiaire ON prises_en_charge(beneficiaire_id);
CREATE INDEX idx_pec_statut ON prises_en_charge(statut);

CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pec_id UUID NOT NULL UNIQUE REFERENCES prises_en_charge(id) ON DELETE RESTRICT,
  reference_unique TEXT NOT NULL UNIQUE,
  montant NUMERIC(12,2) NOT NULL,
  moyen_paiement TEXT NOT NULL CHECK (moyen_paiement IN ('orange_money','mtn_money','moov_money','wave')),
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','valide','echoue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at TIMESTAMPTZ
);

CREATE TABLE codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pec_id UUID NOT NULL REFERENCES prises_en_charge(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('CUC','CUR')),
  valeur TEXT NOT NULL UNIQUE,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','utilise','expire','annule')),
  expire_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_by_pharmacie_id UUID REFERENCES pharmacies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_codes_pec ON codes(pec_id);
CREATE UNIQUE INDEX idx_codes_pec_type ON codes(pec_id, type);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destinataire_label TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('sms','whatsapp','email')),
  sujet TEXT,
  contenu TEXT NOT NULL,
  pec_id UUID REFERENCES prises_en_charge(id),
  statut TEXT NOT NULL DEFAULT 'envoyee' CHECK (statut IN ('envoyee','delivree','echouee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_dest ON notifications(destinataire_user_id);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  role TEXT,
  identifiant_unique TEXT,
  action TEXT NOT NULL,
  entite TEXT,
  entite_id TEXT,
  resultat TEXT NOT NULL CHECK (resultat IN ('succes','echec')),
  details JSONB,
  ip TEXT
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_unique TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  gravite TEXT NOT NULL CHECK (gravite IN ('faible','moyen','eleve','critique')),
  description TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert','en_cours','cloture')),
  pec_id UUID REFERENCES prises_en_charge(id),
  created_by UUID REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE pharmacy_indisponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacie_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  motif TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system_params (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

INSERT INTO system_params (cle, valeur) VALUES
  ('cur_validite_heures', '72'),
  ('max_tentatives_connexion', '5'),
  ('duree_verrouillage_minutes', '15');
