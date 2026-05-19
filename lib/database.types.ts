export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due'
export type SmsStatus = 'pending' | 'sent' | 'failed' | 'delivered'
export type SmsLogStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'

export interface Cabinet {
  id: string
  user_id: string
  name: string
  google_review_url: string | null
  sms_template: string
  sms_delay_hours: number
  subscription_status: SubscriptionStatus
  subscription_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  cabinet_id: string
  first_name: string
  phone: string
  appointment_at: string
  sms_sent_at: string | null
  sms_status: SmsStatus
  feedback_token: string
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: string
  patient_id: string
  cabinet_id: string
  rating: number
  redirected_to_google: boolean
  private_message: string | null
  submitted_at: string
}

export interface SmsLog {
  id: string
  patient_id: string
  cabinet_id: string
  twilio_sid: string | null
  status: SmsLogStatus
  error_message: string | null
  cost_cents: number | null
  sent_at: string
}

// ─── Supabase Database type (for createClient<Database>()) ────────────────────

export interface Database {
  public: {
    Tables: {
      cabinets: {
        Row: Cabinet
        Insert: Omit<Cabinet, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Cabinet, 'id' | 'created_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'feedback_token' | 'created_at' | 'updated_at'> & {
          id?: string
          feedback_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Patient, 'id' | 'cabinet_id' | 'created_at'>>
      }
      feedbacks: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'submitted_at'> & {
          id?: string
          submitted_at?: string
        }
        Update: Partial<Omit<Feedback, 'id' | 'patient_id' | 'cabinet_id' | 'submitted_at'>>
      }
      sms_logs: {
        Row: SmsLog
        Insert: Omit<SmsLog, 'id' | 'sent_at'> & {
          id?: string
          sent_at?: string
        }
        Update: Partial<Omit<SmsLog, 'id' | 'patient_id' | 'cabinet_id' | 'sent_at'>>
      }
    }
  }
}
