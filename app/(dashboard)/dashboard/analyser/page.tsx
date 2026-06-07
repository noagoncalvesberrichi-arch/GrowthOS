import { UploadForm } from './UploadForm'

export const metadata = { title: "Analyser un appel d'offres — Stratly" }

export default function AnalyserPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-14">

      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Analyse IA
        </p>
        <h1 className="font-fraunces text-[32px] text-text tracking-tight leading-tight mb-3">
          Analyser un appel d&apos;offres
        </h1>
        <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-lg">
          Dépose le PDF de l&apos;appel d&apos;offres. Stratly l&apos;analyse et te retourne les informations clés : objet du marché, critères de sélection, délais, exigences techniques et points de vigilance.
        </p>
      </div>

      <UploadForm />

    </div>
  )
}
