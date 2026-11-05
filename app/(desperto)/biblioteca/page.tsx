import Link from 'next/link'
import type { Metadata } from 'next'
import { getBiblioteca, getConteudo } from '@/lib/conteudo'
import { padCap } from '@/lib/livro'
import Busca from '../Busca'
import Data from '../Data'

const TITLE = 'Agrofloresta sintrópica na prática: Biblioteca do Guia'
const DESCRIPTION = 'Agrofloresta sintrópica na prática: aulas em vídeo e artigos que complementam a teoria do livro, organizados nas suas 5 partes: fundamentos, solo e fertilidade, planejamento, modelos de SAF, implantação e manejo.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/biblioteca' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/biblioteca', type: 'website' },
}

export default async function BibliotecaPage() {
  const [prateleiras, conteudo] = await Promise.all([getBiblioteca(), getConteudo()])
  const especies = conteudo.filter(i => i.especie).length

  return (
    <main className="inicio">
      <section className="hero">
        <p className="eyebrow">Biblioteca do Guia</p>
        <h1>A prática que complementa o livro</h1>
        <p className="sub">
          A teoria está no livro{' '}
          <Link href="/guia-agrofloresta"><em>Guia de Introdução à Agrofloresta Sintrópica</em></Link>.
          Aqui está a prática: aulas gravadas no campo e artigos que mostram cada conceito aplicado,
          organizados nas mesmas 5 partes do livro. Cada item aponta o capítulo de onde vem a teoria.
        </p>
      </section>

      <Busca itens={conteudo.map(i => ({ tipo: i.tipo, titulo: i.titulo, resumo: i.resumo, href: i.href, video: i.video, texto: i.texto }))} />

      <Link href="/biblioteca/especies" className="atalho-especies">
        <span aria-hidden>🌿</span>
        <span>
          <strong>Espécies de A a Z</strong>
          <span>Filtre por estrato, fase da sucessão e função no sistema{especies ? ` · ${especies} espécie${especies > 1 ? 's' : ''}` : ''}</span>
        </span>
        <span aria-hidden>→</span>
      </Link>

      <div className="prateleiras">
        {prateleiras.map(p => (
          <section key={p.slug} className={`prateleira${p.total ? '' : ' vazia'}`}>
            <Link href={`/biblioteca/${p.slug}`} className="prateleira-topo">
              <span className="prateleira-num" aria-hidden={!p.num}>{p.num ?? '✦'}</span>
              <span>
                <strong>{p.title}</strong>
                <span className="prateleira-sub">{p.subtitle}</span>
              </span>
              <span className="prateleira-total">{p.total ? `${p.total} ${p.total > 1 ? 'itens' : 'item'}` : 'em breve'}</span>
            </Link>
            {(p.capitulos.length > 0 || p.avulsos.length > 0) && (
              <ul className="prateleira-itens">
                {p.capitulos.flatMap(c => c.itens.map(i => (
                  <li key={i.href}>
                    <Link href={i.href}>
                      <span className="prateleira-cap">Cap. {padCap(c.capitulo.n)}</span>
                      <span>{i.titulo}<Data iso={i.data} curta className="item-data" /></span>
                      <span className="busca-tipo">{i.tipo}{i.video ? ' · vídeo' : ''}</span>
                    </Link>
                  </li>
                )))}
                {p.avulsos.map(i => (
                  <li key={i.href}>
                    <Link href={i.href}>
                      <span className="prateleira-cap">✦</span>
                      <span>{i.titulo}<Data iso={i.data} curta className="item-data" /></span>
                      <span className="busca-tipo">{i.tipo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

    </main>
  )
}
