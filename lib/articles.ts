import { readdir, readFile } from 'fs/promises'
import path from 'path'

// Artigos de SEO em content/artigos/<slug>.md, com frontmatter simples:
// ---
// title: ...
// description: ...
// date: 2026-09-26
// capitulo: 2        (opcional — capítulo do livro que o artigo aprofunda; sem ele, vai para "Leituras e Recursos")
// draft: true        (opcional — rascunhos não entram no sitemap nem na listagem em produção)
// ---

export interface Article {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  image?: string
  capitulo?: number
  draft: boolean
  body: string
}

const DIR = path.join(process.cwd(), 'content', 'artigos')

// Frontmatter "chave: valor" (uma linha por chave) + corpo em markdown. Usado também por lib/manejo.ts.
export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  if (match) {
    for (const line of match[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return { meta, body: match ? match[2] : raw }
}

function parse(slug: string, raw: string): Article {
  const { meta, body } = parseFrontmatter(raw)
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    date: meta.date ?? '',
    updated: meta.updated,
    image: meta.image,
    capitulo: Number(meta.capitulo) || undefined,
    draft: meta.draft === 'true',
    body,
  }
}

const showDrafts = process.env.NODE_ENV !== 'production'

export async function getArticles(): Promise<Article[]> {
  let files: string[] = []
  try {
    files = (await readdir(DIR)).filter(f => f.endsWith('.md'))
  } catch {
    return []
  }
  const articles = await Promise.all(
    files.map(async f => parse(f.replace(/\.md$/, ''), await readFile(path.join(DIR, f), 'utf-8')))
  )
  return articles
    .filter(a => showDrafts || !a.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getArticle(slug: string): Promise<Article | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    const a = parse(slug, await readFile(path.join(DIR, `${slug}.md`), 'utf-8'))
    return showDrafts || !a.draft ? a : null
  } catch {
    return null
  }
}
