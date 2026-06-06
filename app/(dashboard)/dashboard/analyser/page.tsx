import { UploadForm } from './UploadForm'

export const metadata = { title: "Analyser un appel d'offres — Stratly" }

export default function AnalyserPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">
            Analyse IA
          </span>
        </div>
        <h1 className="font-syne text-[28px] font-extrabold text-text tracking-tight leading-tight mb-3">
          Analyser un appel d&apos;offres
        </h1>
        <p className="font-syne text-[14px] text-text-muted leading-relaxed">
          Dépose le PDF de l&apos;appel d&apos;offres. Stratly l&apos;analyse et te retourne les informations clés : objet du marché, critères de sélection, délais, exigences techniques et points de vigilance.
        </p>
      </div>

      <UploadForm />

    </div>
  )
}
