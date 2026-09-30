'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { masquerChecklist } from './actions'

export type ChecklistProps = {
  profilFait: boolean
  referencesFait: boolean
  analyseFaite: boolean
  memoireFait: boolean
  isPro: boolean
}

export function ChecklistDemarrage(props: ChecklistProps) {
  const [pending, start] = useTransition()

  const steps = [
    {
      done: props.profilFait,
      numero: 1,
      titre: 'Complétez votre profil entreprise',
      desc: '5 minutes. C’est ce qui rend le Go/No-Go et le mémoire fidèles à votre entreprise.',
      href: '/dashboard/mon-entreprise',
      label: 'Compléter le profil',
      planPro: false,
    },
    {
      done: props.referencesFait,
      numero: 2,
      titre: 'Ajoutez vos références chantiers',
      desc: 'Importez votre liste Excel en 3 clics ou saisissez-les une par une.',
      href: '/dashboard/mon-entreprise#references',
      label: 'Ajouter des références',
      planPro: false,
    },
    {
      done: props.analyseFaite,
      numero: 3,
      titre: 'Analysez votre premier appel d’offres',
      desc: 'Déposez un DCE (PDF ou ZIP), l’analyse prend 2 minutes.',
      href: '/dashboard/analyser',
      label: 'Analyser un AO',
      planPro: false,
    },
    {
      done: props.memoireFait,
      numero: 4,
      titre: 'Générez un mémoire technique',
      desc: 'Construit sur la grille de notation de l’acheteur, avec vos données.',
      href: props.isPro ? '/dashboard/memoire' : '/pricing',
      label: props.isPro ? 'Générer un mémoire' : '',
      planPro: !props.isPro,
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-syne text-[13px] font-bold text-text">Démarrez</p>
          <p className="font-syne text-[12px] text-text-muted mt-0.5">
            {doneCount} / {steps.length} étapes complétées
          </p>
        </div>
        <button
          onClick={() => start(() => { masquerChecklist() })}
          disabled={pending}
          className="p-1 text-text-subtle hover:text-text transition-colors duration-150 disabled:opacity-40"
          aria-label="Masquer la checklist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-border overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#2563EB' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div
            key={step.numero}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl transition-colors duration-150 ${
              step.done
                ? 'opacity-55'
                : 'bg-background border border-border'
            }`}
          >
            {/* Circle: checkmark or number */}
            <div
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                step.done
                  ? 'bg-green-100 text-green-600'
                  : 'bg-accent/10 text-accent font-syne text-[11px] font-bold'
              }`}
            >
              {step.done ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.numero
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`font-syne text-[13px] font-semibold leading-snug ${step.done ? 'text-text-muted line-through decoration-text-muted/40' : 'text-text'}`}>
                {step.titre}
              </p>
              {!step.done && (
                <p className="font-syne text-[12px] text-text-muted mt-0.5 leading-relaxed">
                  {step.desc}
                </p>
              )}
            </div>

            {/* CTA */}
            {!step.done && (
              <div className="shrink-0 mt-0.5">
                {step.planPro ? (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 bg-brand-amber/10 text-brand-amber border border-brand-amber/20 rounded-full px-2.5 py-1 font-syne text-[11px] font-bold hover:bg-brand-amber/15 transition-colors duration-150 whitespace-nowrap"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Plan Pro
                  </Link>
                ) : (
                  <Link
                    href={step.href}
                    className="font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150 whitespace-nowrap"
                  >
                    {step.label} →
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
