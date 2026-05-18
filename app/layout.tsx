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

export const metadata: Metadata = {
  title: 'Agricultura Sintrópica — Guia Introdutório | OpenSyntropy',
  description: 'Entenda a lógica por trás de um sistema agrícola que melhora com o tempo. 6 capítulos, 25+ infográficos. Por Michel Bottan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${lato.variable} ${literata.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
