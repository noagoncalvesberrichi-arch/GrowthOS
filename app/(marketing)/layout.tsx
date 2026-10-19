import { ConditionalTopNav } from '@/components/layout/ConditionalTopNav'
import { Footer } from '@/components/layout/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ConditionalTopNav />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}
