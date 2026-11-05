import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Element, ElementContent } from 'hast'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getManejoChapter, getManejoChapters, seekSeconds } from '@/lib/manejo'
import { SITE_URL, SITE_NAME, AUTHOR } from '@/lib/site'
import LivroDestaque from '../../LivroDestaque'
import Relacionados from '../../Relacionados'
import Inscricao from '../../Inscricao'
import { VideoPlayer, SeekButton } from '../Video'
import Sumario from '../Sumario'
import { DatasMeta } from '../../Data'
import Trilha, { passosDoCapitulo, breadcrumbJsonLd } from '../../biblioteca/Trilha'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getManejoChapters()).map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapter = await getManejoChapter((await params).slug)
  if (!chapter) return {}
  return {
    title: chapter.title,
    description: chapter.description,
    alternates: { canonical: `/manejo/${chapter.slug}` },
    authors: [{ name: AUTHOR }],
    openGraph: {
      title: chapter.title,
      description: chapter.description,
      url: `/manejo/${chapter.slug}`,
      type: 'article',
      publishedTime: chapter.date,
      modifiedTime: chapter.updated ?? chapter.date,
      authors: [AUTHOR],
      ...(chapter.image && { images: [chapter.image] }),
    },
  }
}

const CTA_MARKER = '<!-- ebook -->'

function slugify(text: string) {
  return text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function textOf(node: ElementContent | Element): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(c => textOf(c as ElementContent)).join('') : ''
}

const isElement = (n: ElementContent | undefined): n is Element => n?.type === 'element'

const components: Components = {
  // "[2:11](#t=131)" vira botão que pula o vídeo; links externos abrem em nova aba.
  a: ({ href, children }) => {
    const t = seekSeconds(href)
    if (t !== null) return <SeekButton seconds={t}>{children}</SeekButton>
    const external = href?.startsWith('http')
    return <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>{children}</a>
  },
  h2: ({ node, children }) => <h2 id={node ? slugify(textOf(node)) : undefined}>{children}</h2>,
  img: ({ src, alt }) => (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  ),
  // imagem sozinha num parágrafo: evita <figure> dentro de <p>
  p: ({ node, children }) => {
    const only = node?.children.length === 1 && isElement(node.children[0]) && node.children[0].tagName === 'img'
    return only ? <>{children}</> : <p>{children}</p>
  },
  // "> **No livro:** ..." vira chamada com a capa; "> *citação*" vira citação em destaque.
  blockquote: ({ node, children }) => {
    const first = node?.children.find(isElement)
    const lead = first ? first.children.find(c => c.type !== 'text' || c.value.trim()) : undefined
    if (isElement(lead) && lead.tagName === 'strong' && textOf(lead).startsWith('No livro')) {
      return (
        <blockquote className="nolivro">
          <Link href="/guia-agrofloresta" aria-label="Ver o livro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/desperto/capa-livro.jpg" alt="" />
          </Link>
          <div>
            {children}
            <Link href="/guia-agrofloresta" className="ver-livro">Ler no livro →</Link>
          </div>
        </blockquote>
      )
    }
    if (isElement(lead) && lead.tagName === 'em') return <blockquote className="citacao">{children}</blockquote>
    return <blockquote>{children}</blockquote>
  },
}

export default async function ManejoChapterPage({ params }: Props) {
  const chapter = await getManejoChapter((await params).slug)
  if (!chapter) notFound()

  const url = `${SITE_URL}/manejo/${chapter.slug}`
  const passos = passosDoCapitulo(chapter.capitulo)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: chapter.title,
        description: chapter.description,
        url,
        mainEntityOfPage: url,
        datePublished: chapter.date,
        dateModified: chapter.updated ?? chapter.date,
        inLanguage: 'pt-BR',
        author: { '@type': 'Person', '@id': `${SITE_URL}/#author`, name: AUTHOR },
        publisher: { '@type': 'Organization', name: SITE_NAME },
        ...(chapter.image && { image: `${SITE_URL}${chapter.image}` }),
      },
      ...(chapter.youtube || chapter.video
        ? [{
            '@type': 'VideoObject',
            name: `${chapter.nome}: ${chapter.subtitle}`,
            description: chapter.description,
            ...(chapter.youtube ? { embedUrl: chapter.youtube } : { contentUrl: `${SITE_URL}${chapter.video}` }),
            uploadDate: chapter.date,
            ...(chapter.image && { thumbnailUrl: `${SITE_URL}${chapter.image}` }),
          }]
        : []),
      breadcrumbJsonLd([...passos, { nome: chapter.nome, href: `/manejo/${chapter.slug}` }]),
    ],
  }

  const sections = [...chapter.body.matchAll(/^## (.+)$/gm)].map(m => ({ id: slugify(m[1].trim()), title: m[1].trim() }))
  const minutes = Math.max(1, Math.round(chapter.body.split(/\s+/).length / 200))
  const [before, after] = chapter.body.split(CTA_MARKER)
  const md = (text: string) => <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{text}</ReactMarkdown>

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="capitulo-hero" style={chapter.image ? { backgroundImage: `url(${chapter.image})` } : undefined}>
        <div className="capitulo-hero-in">
          <Trilha passos={passos} />
          <h1>{chapter.nome}</h1>
          <p className="sub">{chapter.subtitle}</p>
          {chapter.scientific && <p className="cient">{chapter.scientific}</p>}
          <ul className="meta">
            <li>{chapter.youtube || chapter.video ? 'Aula em vídeo' : 'Vídeo em breve'}</li>
            <DatasMeta publicado={chapter.date} atualizado={chapter.updated} />
            <li>{minutes} min de leitura</li>
            {chapter.book.length > 0 && <li>Livro: {chapter.book.map(n => `Cap. ${n}`).join(', ')}</li>}
          </ul>
        </div>
      </header>
      <div className="layout">
        <aside className="lateral">
          {chapter.book.length > 0 && (
            <Link href="/guia-agrofloresta" className="livro-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/desperto/capa-livro.jpg" alt="" />
              <span>
                <span className="rotulo">A teoria no livro</span>
                <strong>Guia de Introdução à Agrofloresta Sintrópica</strong>
                <span className="caps-livro">{chapter.book.map(n => <span key={n}>Cap. {n}</span>)}</span>
                <span className="ver-livro">Conhecer o livro →</span>
              </span>
            </Link>
          )}
          <Sumario sections={sections} />
        </aside>
        <main>
          {chapter.draft && <p className="em-breve">Rascunho: não aparece em produção.</p>}
          <div className="player">
            <VideoPlayer url={chapter.youtube} file={chapter.video} title={`${chapter.nome}: ${chapter.subtitle}`} poster={chapter.image} />
            <p className="player-leg">Aula em vídeo · gravada no Desperto por {AUTHOR}</p>
          </div>
          <article className="texto">
            {md(before)}
            {after !== undefined && <LivroDestaque titulo="A teoria por trás deste manejo está no livro" />}
            {after !== undefined && md(after)}
            <LivroDestaque />
          </article>
          <Inscricao />
          <Relacionados href={`/manejo/${chapter.slug}`} />
          <Link className="voltar" href={passos[1].href!}>← {passos[1].nome}</Link>
        </main>
      </div>
    </>
  )
}
