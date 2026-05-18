import type { Metadata } from 'next'
import { Lora, Lato, Literata, Bebas_Neue } from 'next/font/google'
import './globals.css'

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
})

const lato = Lato({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
})

const literata = Literata({
  variable: '--font-reading',
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://opensyntropy.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Agricultura Sintrópica — Guia Introdutório | OpenSyntropy',
  description: 'O primeiro guia de ponta a ponta sobre agrofloresta sintrópica. 207 páginas, 27 capítulos, 25+ infográficos. Entenda a lógica da floresta antes de entrar nela. Por Michel Bottan.',
  openGraph: {
    title: 'Agricultura Sintrópica — Guia Introdutório',
    description: 'O primeiro guia de ponta a ponta sobre agrofloresta sintrópica. 207 páginas, 27 capítulos, 25+ infográficos exclusivos. Por Michel Bottan.',
    url: BASE_URL,
    siteName: 'OpenSyntropy',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Guia de Introdução à Agrofloresta Sintrópica — Michel Bottan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agricultura Sintrópica — Guia Introdutório',
    description: 'O primeiro guia de ponta a ponta sobre agrofloresta sintrópica. 207 páginas, 27 capítulos, 25+ infográficos exclusivos.',
    images: ['/api/og'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${lato.variable} ${literata.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
