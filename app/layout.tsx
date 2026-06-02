import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { SupabaseProvider } from '@/providers/SupabaseProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EF Aragón — Preparación Oposición',
  description: 'Plataforma de preparación para las oposiciones de Educación Física en Aragón',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
