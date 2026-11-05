import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPrateleira } from '@/lib/conteudo'
import { PARTES, LEITURAS, padCap, infografico } from '@/lib/livro'
import { SITE_URL } from '@/lib/site'
import Cartao from '../Cartao'
import Trilha, { breadcrumbJsonLd, type Passo } from '../Trilha'

interface Props {
  params: Promise<{ parte: string }>
}

const SLUGS = [...PARTES.map(p => p.slug), LEITURAS.slug]

export function generateStaticParams() {
  return SLUGS.map(parte => ({ parte }))
}

function info(slug: string) {
  const parte = PARTES.find(p => p.slug === slug)
  if (parte) {
    return {
      parte,
      title: `${parte.title}: agrofloresta sintrópica, Parte ${parte.num} do Guia`,
      description: `${parte.subtitle}. Aulas e artigos sobre ${parte.chapters.map(c => c.title.split(':')[0].toLowerCase()).slice(0, 4).join(', ')} e mais, ligados aos capítulos ${parte.chapters[0].n} a ${parte.chapters.at(-1)!.n} do livro.`,
    }
  }
  if (slug === LEITURAS.slug) return { parte: undefined, title: `${LEITURAS.title} sobre agrofloresta sintrópica`, description: `${LEITURAS.subtitle}.` }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).parte
  const i = info(slug)
  if (!i) return {}
  const url = `/biblioteca/${slug}`
  return {
    title: i.title,
    description: i.description,
    alternates: { canonical: url },
    openGraph: { title: i.title, description: i.description, url, type: 'website' },
  }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export default async function ParteBiblioteca({ params }: Props) {
  const slug = (await params).parte
  const i = info(slug)
  if (!i) notFound()
  const prateleira = await getPrateleira(slug)
  // "Leituras e Recursos" só existe quando tem conteúdo
  if (!i.parte && !prateleira) notFound()

  const parte = i.parte
  const idx = SLUGS.indexOf(slug)
  const anterior = idx > 0 ? PARTES[idx - 1] : undefined
  const proxima = parte && idx < PARTES.length - 1 ? PARTES[idx + 1] : undefined

  const capitulos = parte?.chapters.map(cap => ({
    cap,
    itens: prateleira?.capitulos.find(c => c.capitulo.n === cap.n)?.itens ?? [],
    info: infografico(cap.n),
  })) ?? []
  const todos = parte ? capitulos.flatMap(c => c.itens) : prateleira!.avulsos
  const aulas = todos.filter(t => t.tipo === 'Aula').length
  const artigos = todos.filter(t => t.tipo === 'Artigo').length

  const passos: Passo[] = [{ nome: 'Biblioteca', href: '/biblioteca' }, { nome: parte?.title ?? LEITURAS.title, href: `/biblioteca/${slug}` }]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: i.title, description: i.description, url: `${SITE_URL}/biblioteca/${slug}`, inLanguage: 'pt-BR' },
      breadcrumbJsonLd(passos),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="parte-hero">
        <span className="parte-hero-num" aria-hidden>{parte?.num ?? '✦'}</span>
        <div className="parte-hero-in">
          <Trilha passos={passos.slice(0, 1)} />
          <p className="eyebrow">{parte ? `Parte ${parte.num} de ${PARTES.at(-1)!.num} do livro` : 'Além do livro'}</p>
          <h1>{parte?.title ?? LEITURAS.title}</h1>
          <p className="sub">{parte?.subtitle ?? LEITURAS.subtitle}</p>
          <ul className="meta">
            {parte && <li>{plural(parte.chapters.length, 'capítulo', 'capítulos')} · Caps. {padCap(parte.chapters[0].n)}–{padCap(parte.chapters.at(-1)!.n)}</li>}
            <li>{aulas ? plural(aulas, 'aula', 'aulas') : 'Aulas em breve'}</li>
            {artigos > 0 && <li>{plural(artigos, 'artigo', 'artigos')}</li>}
          </ul>
          <nav className="partes-pilulas" aria-label="Partes do livro">
            {PARTES.map(p => (
              <Link key={p.slug} href={`/biblioteca/${p.slug}`} aria-current={p.slug === slug ? 'page' : undefined} title={p.title}>
                <b>{p.num}</b><span>{p.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {parte ? (
        <div className="parte-layout">
          <aside className="parte-indice" aria-label="Capítulos desta parte">
            <p className="rotulo">Nesta parte</p>
            <ol>
              {capitulos.map(({ cap, itens }) => (
                <li key={cap.n}>
                  <a href={`#cap-${cap.n}`} className={itens.length ? 'tem' : undefined}>
                    <span className="mapa-cap-num">{padCap(cap.n)}</span>
                    <span>{cap.curto}</span>
                    {itens.length > 0 && <span className="mapa-cap-qtd">{itens.length}</span>}
                  </a>
                </li>
              ))}
            </ol>
            <Link href="/guia-agrofloresta" className="parte-indice-livro">📖 Teoria completa no livro →</Link>
          </aside>

          <main className="parte-capitulos">
            {capitulos.map(({ cap, itens, info: img }) => (
              <section key={cap.n} id={`cap-${cap.n}`} className={`cap-bloco${itens.length ? '' : ' vazio'}${img ? ' com-info' : ''}`} aria-labelledby={`cap-${cap.n}-titulo`}>
                <div className="cap-bloco-topo">
                  <span className="cap-bloco-num">{padCap(cap.n)}</span>
                  <div>
                    <p className="cap-bloco-rotulo">
                      Capítulo {cap.n} do livro
                      <span className={`cap-bloco-status${itens.length ? ' tem' : ''}`}>
                        {itens.length ? plural(itens.length, 'item', 'itens') : 'em breve'}
                      </span>
                    </p>
                    <h2 id={`cap-${cap.n}-titulo`}>{cap.title}</h2>
                    <p className="cap-bloco-desc">{cap.desc}</p>
                  </div>
                </div>

                {img && (
                  <Link href="/guia-agrofloresta" className="cap-bloco-info" aria-label={`Infográfico do capítulo ${cap.n} no livro`}>
                    <Image src={img} alt={`Infográfico do capítulo ${cap.n}: ${cap.title}`} width={1672} height={941} sizes="(max-width: 760px) 100vw, 360px" />
                    <span>Infográfico · no livro →</span>
                  </Link>
                )}

                {itens.length > 0
                  ? <div className="cap-bloco-itens">{itens.map(item => <Cartao key={item.href} item={item} />)}</div>
                  : <p className="cap-bloco-breve">Aulas e artigos deste capítulo estão a caminho. <Link href="/guia-agrofloresta">A teoria já está no livro →</Link></p>}
              </section>
            ))}

            <nav className="partes-vizinhas" aria-label="Outras partes">
              {anterior
                ? <Link href={`/biblioteca/${anterior.slug}`}><small>← Parte {anterior.num}</small><strong>{anterior.title}</strong></Link>
                : <Link href="/biblioteca"><small>←</small><strong>Biblioteca</strong></Link>}
              {proxima
                ? <Link href={`/biblioteca/${proxima.slug}`} className="prox"><small>Parte {proxima.num} →</small><strong>{proxima.title}</strong></Link>
                : <Link href="/biblioteca/especies" className="prox"><small>Atalho →</small><strong>Espécies de A a Z</strong></Link>}
            </nav>

          </main>
        </div>
      ) : (
        <main className="inicio">
          <div className="relacionados-grade">{prateleira!.avulsos.map(item => <Cartao key={item.href} item={item} />)}</div>
        </main>
      )}
    </>
  )
}
