import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backend - Securelab',
  description: 'User and subscription management portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-400 antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'bg-slate-800 border-slate-700 text-slate-200',
              description: 'text-slate-400',
            },
          }}
        />
      </body>
    </html>
  )
}
