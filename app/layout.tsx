import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Twisted Admin - Gestion des Services',
  description: 'Dashboard de gestion des services Twisted',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 min-h-screen font-body text-stone-100">
        {children}
      </body>
    </html>
  )
}

