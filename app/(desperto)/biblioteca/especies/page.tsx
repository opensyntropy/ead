import Link from 'next/link'
import type { Metadata } from 'next'
import { getConteudo } from '@/lib/conteudo'
import { SITE_URL } from '@/lib/site'
import Trilha, { breadcrumbJsonLd, type Passo } from '../Trilha'
import Filtros, { type ItemEspecie } from './Filtros'

const TITLE = 'Espécies para agrofloresta sintrópica de A a Z'
const DESCRIPTION = 'Espécies para agrofloresta sintrópica com aula em vídeo e manejo na prática, filtradas por estrato, fase da sucessão e função no sistema: alimento, biomassa e serviço.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/biblioteca/especies' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/biblioteca/especies', type: 'website' },
}

export default async function EspeciesPage() {
  const especies: ItemEspecie[] = (await getConteudo())
    .filter(i => i.especie)
    .map(i => ({ ...i.especie!, href: i.href, imagem: i.imagem, video: i.video }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const passos: Passo[] = [{ nome: 'Biblioteca', href: '/biblioteca' }, { nome: 'Espécies de A a Z', href: '/biblioteca/especies' }]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: TITLE, description: DESCRIPTION, url: `${SITE_URL}/biblioteca/especies`, inLanguage: 'pt-BR' },
      breadcrumbJsonLd(passos),
    ],
  }

  return (
    <main className="inicio">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="hero">
        <Trilha passos={passos.slice(0, 1)} />
        <p className="eyebrow">Espécies de A a Z</p>
        <h1>Espécies na agrofloresta</h1>
        <p className="sub">
          Cada espécie com aula gravada no campo, organizada pelo vocabulário do livro: o estrato que ocupa (Cap. 5),
          a fase da sucessão em que entra (Cap. 4) e a função no sistema (Caps. 11, 14 e 17).{' '}
          <Link href="/biblioteca/como-planejar#cap-17">Ver na Caixa de Ferramentas →</Link>
        </p>
      </section>
      <Filtros especies={especies} />
    </main>
  )
}
