-- ============================================
-- Stratly MVP V1 - Initial Schema
-- ============================================

-- 1. Table cabinets (1 kiné = 1 cabinet en V1)
CREATE TABLE cabinets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_review_url TEXT,
  sms_template TEXT NOT NULL DEFAULT 'Bonjour {prenom}, merci de votre visite chez {cabinet}. Votre avis nous aide énormément : {lien}. Belle journée.',
  sms_delay_hours INT NOT NULL DEFAULT 2 CHECK (sms_delay_hours >= 0 AND sms_delay_hours <= 72),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  subscription_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Table patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appointment_at TIMESTAMPTZ NOT NULL,
  sms_sent_at TIMESTAMPTZ,
  sms_status TEXT NOT NULL DEFAULT 'pending' CHECK (sms_status IN ('pending', 'sent', 'failed', 'delivered')),
  feedback_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table feedbacks (retours patients)
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  redirected_to_google BOOLEAN NOT NULL DEFAULT FALSE,
  private_message TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table sms_logs (historique technique)
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  twilio_sid TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'undelivered')),
  error_message TEXT,
  cost_cents INT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes pour performances
-- ============================================
CREATE INDEX idx_patients_cabinet ON patients(cabinet_id);
CREATE INDEX idx_patients_appointment ON patients(appointment_at) WHERE sms_status = 'pending';
CREATE INDEX idx_patients_feedback_token ON patients(feedback_token);
CREATE INDEX idx_feedbacks_cabinet ON feedbacks(cabinet_id);
CREATE INDEX idx_sms_logs_cabinet ON sms_logs(cabinet_id);

-- ============================================
-- Trigger pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cabinets_updated_at BEFORE UPDATE ON cabinets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) - sécurité multi-tenant
-- ============================================
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Policies : un user ne voit QUE son propre cabinet
CREATE POLICY "Users can view own cabinet" ON cabinets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cabinet" ON cabinets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cabinet" ON cabinets
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies patients : un user voit que les patients de son cabinet
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );

-- Policies feedbacks : un user voit que les feedbacks de son cabinet
-- MAIS la page publique /avis/[token] doit pouvoir INSERT sans auth
CREATE POLICY "Users can view own feedbacks" ON feedbacks
  FOR SELECT USING (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can insert feedback via valid token" ON feedbacks
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients)
  );

-- Policies sms_logs : lecture seule pour le user
CREATE POLICY "Users can view own sms logs" ON sms_logs
  FOR SELECT USING (
    cabinet_id IN (SELECT id FROM cabinets WHERE user_id = auth.uid())
  );
