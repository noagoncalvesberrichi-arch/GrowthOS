import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-auto pt-14 md:pt-0">
        {children}
      </div>
    </div>
  )
}
