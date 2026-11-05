import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles } from '@/lib/articles'
import LivroDestaque from '../LivroDestaque'
import Data from '../Data'

export const metadata: Metadata = {
  title: 'Artigos sobre Agrofloresta Sintrópica',
  description: 'Artigos sobre agrofloresta e agricultura sintrópica: sucessão natural, estratos, consórcios, poda, solo e implantação de SAFs.',
  alternates: { canonical: '/artigos' },
}

export default async function ArtigosPage() {
  const articles = await getArticles()

  return (
    <main className="inicio">
      <section className="hero">
        <p className="eyebrow">Artigos</p>
        <h1>Agrofloresta Sintrópica</h1>
        <p className="sub">Textos para entender a lógica da floresta antes de plantar.</p>
      </section>
      <ul className="artigos">
        {articles.map(a => (
          <li key={a.slug}>
            <Link href={`/artigos/${a.slug}`} className="artigo-item">
              <Data iso={a.date} />
              <h2>{a.title}{a.draft && <span className="rascunho">rascunho</span>}</h2>
              <p>{a.description}</p>
              <span className="ler">Ler artigo →</span>
            </Link>
          </li>
        ))}
      </ul>
      <LivroDestaque titulo="Quer ir além dos artigos? O livro reúne tudo em um só lugar." />
    </main>
  )
}
