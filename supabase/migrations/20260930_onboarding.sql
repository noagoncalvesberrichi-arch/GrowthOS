ALTER TABLE profil_entreprise
  ADD COLUMN IF NOT EXISTS onboarding_masque boolean NOT NULL DEFAULT false;
