import { createClient } from '@/lib/supabase/server'
import type { Cabinet, Patient } from '@/lib/database.types'
import { PatientForm } from './PatientForm'
import { PatientList } from './PatientList'

export const metadata = { title: 'Patients — Stratly' }

export default async function PatientsPage() {
  const supabase = await createClient()

  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('id, name, sms_delay_hours')
    .single() as { data: Pick<Cabinet, 'id' | 'name' | 'sms_delay_hours'> | null }

  if (!cabinet) return null

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('cabinet_id', cabinet.id)
    .order('appointment_at', { ascending: false }) as { data: Patient[] | null }

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">
            {cabinet.name}
          </span>
        </div>
        <h1 className="font-syne text-[28px] font-extrabold text-text tracking-tight leading-tight">
          Patients
        </h1>
        <p className="font-syne text-[14px] text-text-muted mt-1.5 max-w-xl">
          Ajoute tes patients après leur RDV. Stratly leur envoie automatiquement un SMS{' '}
          <span className="font-semibold text-text">{cabinet.sms_delay_hours}h après</span>{' '}
          pour leur demander un avis Google.
        </p>
      </div>

      {/* Form */}
      <PatientForm cabinetId={cabinet.id} />

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne text-[15px] font-bold text-text">
            Liste des patients
            {patients && patients.length > 0 && (
              <span className="ml-2 font-syne text-[12px] font-semibold text-text-subtle bg-background border border-border px-2 py-0.5 rounded-full">
                {patients.length}
              </span>
            )}
          </h2>
        </div>
        <PatientList patients={patients ?? []} />
      </div>

    </div>
  )
}
