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
  title: 'Stratly — Growth Intelligence',
  description: 'AI-powered growth modules for B2B and creators',
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
