'use client'

import { useState } from 'react'
import type { FileAnalysis, ColumnMapping, MatchedRow } from '@/lib/chiffrage/types'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'
import { Step1Upload } from './steps/Step1Upload'
import { Step2Mapping } from './steps/Step2Mapping'
import { Step3Matching } from './steps/Step3Matching'
import { Step4Generation } from './steps/Step4Generation'
import { HistoriqueChiffrages } from './HistoriqueChiffrages'

type Props = { profil: Partial<ProfilEntreprise> | null }

export type WizardState = {
  step: 1 | 2 | 3 | 4
  acheteurFile: File | null
  crmFile: File | null
  acheteurAnalysis: FileAnalysis | null
  crmAnalysis: FileAnalysis | null
  acheteurMappings: Record<string, ColumnMapping>
  crmMappings: Record<string, ColumnMapping>
  matches: MatchedRow[]
  montantTotalHt: number
  nbLignes: number
  nbRapprochees: number
}

function StepIndicator({ step }: { step: number }) {
  const steps = ['Fichiers', 'Colonnes', 'Rapprochement', 'Génération']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const active = num === step
        const done = num < step
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border transition-colors
                ${done ? 'bg-brand-amber border-brand-amber text-background' :
                  active ? 'bg-background border-brand-amber text-brand-amber' :
                  'bg-background border-border text-text-muted'}`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : num}
              </div>
              <span className={`font-syne text-[10px] font-semibold ${active ? 'text-text' : 'text-text-muted'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 sm:w-14 mx-1 mb-4 ${num < step ? 'bg-brand-amber' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ChiffrageWizard({ profil }: Props) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    acheteurFile: null,
    crmFile: null,
    acheteurAnalysis: null,
    crmAnalysis: null,
    acheteurMappings: {},
    crmMappings: {},
    matches: [],
    montantTotalHt: 0,
    nbLignes: 0,
    nbRapprochees: 0,
  })

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))

  const resetWizard = () => setState({
    step: 1,
    acheteurFile: null,
    crmFile: null,
    acheteurAnalysis: null,
    crmAnalysis: null,
    acheteurMappings: {},
    crmMappings: {},
    matches: [],
    montantTotalHt: 0,
    nbLignes: 0,
    nbRapprochees: 0,
  })

  return (
    <div>
      <StepIndicator step={state.step} />

      {state.step === 1 && (
        <Step1Upload
          onComplete={(acheteurAnalysis, crmAnalysis, acheteurFile, crmFile) => {
            // Initialize mappings from detected values
            const acheteurMappings: Record<string, ColumnMapping> = {}
            for (const s of acheteurAnalysis.sheets) acheteurMappings[s.sheetName] = { ...s.mapping }
            const crmMappings: Record<string, ColumnMapping> = {}
            for (const s of crmAnalysis.sheets) crmMappings[s.sheetName] = { ...s.mapping }
            update({ step: 2, acheteurAnalysis, crmAnalysis, acheteurFile, crmFile, acheteurMappings, crmMappings })
          }}
        />
      )}

      {state.step === 2 && state.acheteurAnalysis && state.crmAnalysis && (
        <Step2Mapping
          acheteurAnalysis={state.acheteurAnalysis}
          crmAnalysis={state.crmAnalysis}
          acheteurMappings={state.acheteurMappings}
          crmMappings={state.crmMappings}
          onMappingsChange={(am, cm) => update({ acheteurMappings: am, crmMappings: cm })}
          onContinue={async () => {
            const res = await fetch('/api/chiffrage/rapprocher', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                acheteur: state.acheteurAnalysis,
                crm: state.crmAnalysis,
                acheteurMappings: state.acheteurMappings,
                crmMappings: state.crmMappings,
              }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            update({ step: 3, matches: data.matches })
          }}
          onBack={() => update({ step: 1 })}
        />
      )}

      {state.step === 3 && state.acheteurAnalysis && state.crmAnalysis && (
        <Step3Matching
          acheteurAnalysis={state.acheteurAnalysis}
          crmAnalysis={state.crmAnalysis}
          acheteurMappings={state.acheteurMappings}
          crmMappings={state.crmMappings}
          matches={state.matches}
          onMatchesChange={(matches) => update({ matches })}
          onGenerate={() => update({ step: 4 })}
          onBack={() => update({ step: 2 })}
        />
      )}

      {state.step === 4 && state.acheteurFile && state.acheteurAnalysis && (
        <Step4Generation
          acheteurFile={state.acheteurFile}
          acheteurAnalysis={state.acheteurAnalysis}
          acheteurMappings={state.acheteurMappings}
          matches={state.matches}
          profil={profil}
          onReset={resetWizard}
        />
      )}
    </div>
  )
}
