import { ChiffrageForm } from './ChiffrageForm'

export const maxDuration = 60

export const metadata = { title: 'Chiffrage — Stratly' }

export default function ChiffragePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Extraction automatique
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight mb-3">
          Chiffrage
        </h1>
        <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-lg">
          Dépose le PDF contenant la nomenclature électrique. Stratly extrait toutes les lignes du tableau et te génère un fichier Excel prêt à chiffrer — avec colonnes Prix unitaire et Total.
        </p>
      </div>

      <ChiffrageForm />

    </div>
  )
}
