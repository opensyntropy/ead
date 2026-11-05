import Link from 'next/link'
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import { Cabecalho, Abas } from './Navegacao'
import { getContagemCapitulos } from '@/lib/conteudo'
import './desperto.css'

// Guia Agrofloresta, um projeto Desperto: home, Biblioteca (aulas de manejo e artigos).
// Identidade visual do Desperto (a mesma dos vídeos); no celular funciona como app (abas embaixo).
const montserrat = Montserrat({ variable: '--font-desperto', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Guia Agrofloresta', template: '%s | Guia Agrofloresta' },
  applicationName: 'Guia Agrofloresta',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Guia Agrofloresta', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#642D48',
  viewportFit: 'cover',
}

export default async function DespertoLayout({ children }: { children: React.ReactNode }) {
  const contagem = await getContagemCapitulos()
  return (
    <div className={`desperto ${montserrat.variable}`}>
      <Cabecalho contagem={contagem} />
      {children}
      <footer className="rodape">
        <div className="rodape-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/desperto/logo.webp" alt="" />
          <div>
            <strong>Guia Agrofloresta</strong><br />
            Um projeto <a href="https://desperto.earth" target="_blank" rel="noopener noreferrer">Desperto</a> · Michel Bottan ·{' '}
            <a href="https://instagram.com/michel.agrofloresta" target="_blank" rel="noopener noreferrer">@michel.agrofloresta</a>
          </div>
        </div>
        <nav>
          <Link href="/guia-agrofloresta">Livro</Link>
          <Link href="/biblioteca">Biblioteca</Link>
          <Link href="/biblioteca/especies">Espécies</Link>
          <Link href="/artigos">Artigos</Link>
          <Link href="/sobre">Sobre</Link>
        </nav>
      </footer>
      <Abas />
    </div>
  )
}
