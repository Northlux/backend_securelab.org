import type { Metadata } from 'next'
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
    <html lang="en">
      <body className="bg-cyber-dark text-cyber-text">
        {children}
      </body>
    </html>
  )
}
