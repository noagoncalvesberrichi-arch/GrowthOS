import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChiffrageWizard } from './ChiffrageWizard'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'

export const metadata = { title: 'Chiffrage automatique — Stratly' }

type ChiffrageRow = {
  id: string
  created_at: string
  nom_fichier_acheteur: string
  nb_lignes: number | null
  nb_rapprochees: number | null
  montant_total_ht: number | null
}

export default async function ChiffragePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: aboData }, { data: profilData }, { data: chiffragesData }] = await Promise.all([
    supabase.from('abonnements').select('plan').maybeSingle(),
    supabase.from('profil_entreprise').select('raison_sociale, forme_juridique, adresse_siege, siret, nom_signataire, qualite_signataire, iban, bic').maybeSingle(),
    supabase.from('chiffrages').select('id, created_at, nom_fichier_acheteur, nb_lignes, nb_rapprochees, montant_total_ht').order('created_at', { ascending: false }).limit(20),
  ])

  const plan: string = (aboData as { plan: string } | null)?.plan ?? 'gratuit'
  const isPro = plan === 'pro' || plan.startsWith('essai_pro') || plan === 'fondateurs'
  const profil = profilData as Partial<ProfilEntreprise> | null
  const chiffrages = (chiffragesData ?? []) as ChiffrageRow[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Répondre aux appels d&apos;offres
        </p>
        <h1 className="font-syne text-2xl font-bold text-text mb-2">Chiffrage automatique</h1>
        <p className="font-syne text-[14px] text-text-muted">
          Copiez les prix de votre CRM dans le bordereau de l&apos;acheteur (DPGF / DQE / BPU) en conservant sa mise en forme.
        </p>
      </div>

      {isPro ? (
        <>
          <div id="chiffrage-wizard">
            <ChiffrageWizard profil={profil} />
          </div>

          {/* Historique */}
          <div className="mt-12">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-4">
              Historique
            </p>

            {chiffrages.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl px-5 py-12 sm:px-8 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', width: 52, height: 52 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                    <line x1="9" y1="9" x2="9" y2="21" />
                  </svg>
                </div>
                <p className="font-fraunces text-[20px] text-text mb-2">Aucun chiffrage</p>
                <p className="font-syne text-[13px] text-text-muted mb-7 max-w-md mx-auto leading-relaxed">
                  Déposez le bordereau de prix de l&apos;acheteur (DPGF, DQE, BPU) et votre chiffrage : Stratly copie vos prix dans son fichier et remplit l&apos;acte d&apos;engagement.
                </p>
                <a
                  href="#chiffrage-wizard"
                  className="inline-flex items-center font-syne font-bold text-[13px] text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.2)] transition-all duration-200"
                >
                  Nouveau chiffrage →
                </a>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <ul>
                  {chiffrages.map((c, i) => {
                    const date = new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                    const montant = c.montant_total_ht
                      ? c.montant_total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' € HT'
                      : null
                    return (
                      <li
                        key={c.id}
                        className={`flex items-center gap-4 px-5 py-3.5 ${i < chiffrages.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="9" x2="9" y2="21" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-syne text-[13px] font-semibold text-text truncate">{c.nom_fichier_acheteur}</p>
                          <p className="font-syne text-[11px] text-text-muted mt-0.5">
                            {date}
                            {c.nb_rapprochees != null && c.nb_lignes != null && (
                              <> · {c.nb_rapprochees}/{c.nb_lignes} lignes</>
                            )}
                            {montant && <> · {montant}</>}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <div>
            <p className="font-syne text-[15px] font-semibold text-text mb-1">Fonctionnalité réservée au plan Pro</p>
            <p className="font-syne text-[13px] text-text-muted">Passez au plan Pro pour accéder au chiffrage automatique.</p>
          </div>
          <Link
            href="/pricing"
            className="font-syne text-[13px] font-semibold text-background bg-brand-amber hover:bg-brand-amber/90 px-6 py-2.5 rounded-xl transition-colors"
          >
            Voir les tarifs
          </Link>
        </div>
      )}
    </div>
  )
}
