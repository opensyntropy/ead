import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { parseFrontmatter } from './articles'

// Aulas de "Manejo na Prática" (uma por vídeo), em content/manejo/<slug>.md.
// Na Biblioteca do Guia cada aula fica no capítulo do livro indicado em "capitulo"
// (a parte do livro sai daí); "book" lista todos os capítulos citados.
// ---
// title: ...                (título da página, pensado para busca)
// nome: Chaya               (nome curto, usado no cabeçalho e na listagem)
// subtitle: ...
// scientific: Cnidoscolus aconitifolius
// description: ...
// capitulo: 17              (capítulo principal do livro: define a prateleira na Biblioteca)
// ordem: 1                  (ordem dentro do capítulo; aceita o antigo "chapter")
// estrato: medio            (espécies: emergente | alto | medio | baixo)
// sucessao: secundaria      (espécies: placenta | secundaria | climax)
// funcao: alimento, biomassa, servico   (espécies: ver FUNCOES em lib/livro.ts)
// date: 2026-11-04
// image: /manejo/chaya/capa.jpg
// youtube: https://www.youtube.com/watch?v=...   (tem prioridade sobre video)
// video: /manejo/chaya/aula.mp4                 (arquivo próprio; sem youtube nem video = "vídeo em breve")
// book: 8, 9, 17, 20        (capítulos do livro citados)
// draft: true
// ---
// No corpo, links "[2:11](#t=131)" viram botões que pulam o vídeo para aquele segundo.

export interface ManejoChapter {
  slug: string
  title: string
  nome: string
  subtitle: string
  scientific: string
  description: string
  capitulo?: number
  ordem: number
  estrato?: string
  sucessao?: string
  funcao: string[]
  date: string
  updated?: string
  image?: string
  youtube?: string
  video?: string
  book: number[]
  draft: boolean
  body: string
}

const lista = (v: string | undefined) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean)

const DIR = path.join(process.cwd(), 'content', 'manejo')

function parse(slug: string, raw: string): ManejoChapter {
  const { meta, body } = parseFrontmatter(raw)
  return {
    slug,
    title: meta.title ?? slug,
    nome: meta.nome ?? meta.title ?? slug,
    subtitle: meta.subtitle ?? '',
    scientific: meta.scientific ?? '',
    description: meta.description ?? '',
    capitulo: Number(meta.capitulo) || undefined,
    ordem: Number(meta.ordem ?? meta.chapter ?? 0),
    estrato: meta.estrato || undefined,
    sucessao: meta.sucessao || undefined,
    funcao: lista(meta.funcao),
    date: meta.date ?? '',
    updated: meta.updated,
    image: meta.image,
    youtube: meta.youtube || undefined,
    video: meta.video || undefined,
    book: (meta.book ?? '').split(',').map(s => Number(s.trim())).filter(Boolean),
    draft: meta.draft === 'true',
    body,
  }
}

const showDrafts = process.env.NODE_ENV !== 'production'

export async function getManejoChapters(): Promise<ManejoChapter[]> {
  let files: string[] = []
  try {
    files = (await readdir(DIR)).filter(f => f.endsWith('.md'))
  } catch {
    return []
  }
  const chapters = await Promise.all(
    files.map(async f => parse(f.replace(/\.md$/, ''), await readFile(path.join(DIR, f), 'utf-8')))
  )
  return chapters
    .filter(c => showDrafts || !c.draft)
    .sort((a, b) => a.ordem - b.ordem)
}

export async function getManejoChapter(slug: string): Promise<ManejoChapter | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    const c = parse(slug, await readFile(path.join(DIR, `${slug}.md`), 'utf-8'))
    return showDrafts || !c.draft ? c : null
  } catch {
    return null
  }
}

// "#t=131" -> 131
export function seekSeconds(href: string | undefined): number | null {
  const m = href?.match(/^#t=(\d+)$/)
  return m ? Number(m[1]) : null
}
