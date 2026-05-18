import { OnboardingForm } from './OnboardingForm'

export const metadata = {
  title: 'Bienvenue sur Stratly',
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background dot-grid flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-2xl shadow-card-md w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text">
            Bienvenue sur Stratly 👋
          </h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">
            Configure ton cabinet en 30 secondes pour commencer.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <OnboardingForm />
        </div>

      </div>
    </div>
  )
}
