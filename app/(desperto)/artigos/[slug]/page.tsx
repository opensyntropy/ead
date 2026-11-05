import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticle, getArticles } from '@/lib/articles'
import { SITE_URL, SITE_NAME, AUTHOR } from '@/lib/site'
import Link from 'next/link'
import LivroDestaque from '../../LivroDestaque'
import { DatasMeta } from '../../Data'
import Relacionados from '../../Relacionados'
import Trilha, { passosDoCapitulo, breadcrumbJsonLd } from '../../biblioteca/Trilha'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getArticles()).map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/artigos/${article.slug}` },
    authors: [{ name: AUTHOR }],
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/artigos/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      authors: [AUTHOR],
      ...(article.image && { images: [article.image] }),
    },
  }
}

// Marcador no markdown onde entra a chamada do ebook; sem ele, a chamada vai só no final.
const CTA_MARKER = '<!-- ebook -->'

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug)
  if (!article) notFound()

  const url = `${SITE_URL}/artigos/${article.slug}`
  const passos = passosDoCapitulo(article.capitulo)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        url,
        mainEntityOfPage: url,
        datePublished: article.date,
        dateModified: article.updated ?? article.date,
        inLanguage: 'pt-BR',
        author: { '@type': 'Person', '@id': `${SITE_URL}/#author`, name: AUTHOR },
        publisher: { '@type': 'Organization', name: SITE_NAME },
        ...(article.image && { image: `${SITE_URL}${article.image}` }),
      },
      breadcrumbJsonLd([...passos, { nome: article.title, href: `/artigos/${article.slug}` }]),
    ],
  }

  const [before, after] = article.body.split(CTA_MARKER)

  const md = (text: string) => <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{text}</ReactMarkdown>

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="capitulo-hero artigo-hero">
        <div className="capitulo-hero-in">
          <Trilha passos={passos} />
          <h1>{article.title}</h1>
          {article.description && <p className="sub">{article.description}</p>}
          <ul className="meta">
            <li>Por {AUTHOR}</li>
            <DatasMeta publicado={article.date} atualizado={article.updated} />
          </ul>
        </div>
      </header>
      <main className="artigo">
        {article.draft && <p className="em-breve">Rascunho: não aparece em produção.</p>}
        <article className="texto">
          {md(before)}
          {after !== undefined && <LivroDestaque titulo="A base de tudo isso está no livro" />}
          {after !== undefined && md(after)}
          <LivroDestaque />
        </article>
        <Relacionados href={`/artigos/${article.slug}`} />
        <Link className="voltar" href={passos[1].href!}>← {passos[1].nome}</Link>
      </main>
    </>
  )
}

// links externos abrem em nova aba; imagem sozinha vira figura com legenda
const components: Components = {
  a: ({ href, children }) => {
    const external = href?.startsWith('http')
    return <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>{children}</a>
  },
  img: ({ src, alt }) => (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  ),
  p: ({ node, children }) => {
    const only = node?.children.length === 1 && node.children[0].type === 'element' && node.children[0].tagName === 'img'
    return only ? <>{children}</> : <p>{children}</p>
  },
}
