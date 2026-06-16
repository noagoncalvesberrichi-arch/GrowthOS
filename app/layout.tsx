import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Space_Mono, Fraunces } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    default: 'Stratly — Analysez vos appels d\'offres avec l\'IA',
    template: '%s | Stratly',
  },
  description:
    'Stratly analyse automatiquement vos dossiers DCE, extrait les informations clés et vous donne un avis Go/No-Go personnalisé selon le profil de votre entreprise BTP.',
  metadataBase: new URL('https://stratly.fr'),
  openGraph: {
    siteName: 'Stratly',
    type: 'website',
    locale: 'fr_FR',
    title: 'Stratly — Analysez vos appels d\'offres avec l\'IA',
    description:
      'Stratly analyse automatiquement vos dossiers DCE, extrait les informations clés et vous donne un avis Go/No-Go personnalisé selon le profil de votre entreprise BTP.',
    url: 'https://stratly.fr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stratly — Analysez vos appels d\'offres avec l\'IA',
    description:
      'Analyse automatique de DCE, avis Go/No-Go personnalisé, mémoire technique en un clic. La plateforme pour les entreprises BTP qui répondent aux marchés publics.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${spaceMono.variable} ${fraunces.variable}`}>
      <body className="bg-background text-text min-h-screen">
        {children}
      </body>
    </html>
  )
}
