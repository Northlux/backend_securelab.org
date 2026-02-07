import { Sidebar } from './sidebar'
import { Header } from './header'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-cyber-dark text-cyber-text">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header />

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
