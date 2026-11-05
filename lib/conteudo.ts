import { getArticles } from './articles'
import { getManejoChapters } from './manejo'
import { PARTES, LEITURAS, parteDoCapitulo, infografico, type ParteLivro, type CapituloLivro } from './livro'

// Tudo o que o Guia publica (aulas de manejo e artigos) num formato só, organizado como
// a Biblioteca do Guia: parte do livro > capítulo do livro > item. Usado pela busca, pela
// Biblioteca e pelo "Continue explorando" no fim das páginas.

export type Formato = 'Aula' | 'Artigo'

export interface Especie {
  nome: string
  cientifico: string
  estrato?: string
  sucessao?: string
  funcao: string[]
}

export interface ItemConteudo {
  tipo: Formato
  titulo: string
  resumo: string
  href: string
  imagem?: string
  video: boolean
  texto: string
  data: string           // publicação (AAAA-MM-DD)
  atualizado?: string
  capitulo?: number      // capítulo principal do livro
  parte: string          // slug da prateleira (parte do livro ou "leituras")
  especie?: Especie      // aulas sobre uma espécie (têm nome científico)
}

function textoPlano(md: string) {
  return md
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_|`-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// "Novo": publicado nos últimos 30 dias. As páginas são estáticas, então a conta vale a partir do último deploy.
export const DIAS_NOVO = 30
export function ehNovo(data: string | undefined, hoje = new Date()) {
  if (!data) return false
  const dias = (hoje.getTime() - new Date(`${data}T12:00:00Z`).getTime()) / 86_400_000
  return dias >= 0 && dias <= DIAS_NOVO
}

const parteSlug = (capitulo: number | undefined) => parteDoCapitulo(capitulo)?.slug ?? LEITURAS.slug

export async function getConteudo(): Promise<ItemConteudo[]> {
  const [aulas, artigos] = await Promise.all([getManejoChapters(), getArticles()])
  return [
    ...aulas.map((c): ItemConteudo => ({
      tipo: 'Aula',
      titulo: `${c.nome}: ${c.subtitle}`,
      resumo: c.description,
      href: `/manejo/${c.slug}`,
      imagem: c.image,
      video: Boolean(c.youtube || c.video),
      texto: textoPlano(`${c.scientific} ${c.body}`),
      data: c.date,
      atualizado: c.updated,
      capitulo: c.capitulo,
      parte: parteSlug(c.capitulo),
      ...(c.scientific && {
        especie: { nome: c.nome, cientifico: c.scientific, estrato: c.estrato, sucessao: c.sucessao, funcao: c.funcao },
      }),
    })),
    ...artigos.map((a): ItemConteudo => ({
      tipo: 'Artigo',
      titulo: a.title,
      resumo: a.description,
      href: `/artigos/${a.slug}`,
      // sem capa própria, o artigo usa o infográfico do capítulo do livro que ele aprofunda
      imagem: a.image ?? (a.capitulo ? infografico(a.capitulo) : undefined),
      video: false,
      texto: textoPlano(a.body),
      data: a.date,
      atualizado: a.updated,
      capitulo: a.capitulo,
      parte: parteSlug(a.capitulo),
    })),
  ]
}

export interface Prateleira {
  slug: string
  num?: string
  title: string
  subtitle: string
  total: number
  // capítulos do livro com conteúdo publicado, na ordem do livro
  capitulos: { capitulo: CapituloLivro; itens: ItemConteudo[] }[]
  // itens fora de capítulo (prateleira "Leituras e Recursos")
  avulsos: ItemConteudo[]
}

function montaPrateleira(parte: ParteLivro, itens: ItemConteudo[]): Prateleira {
  const capitulos = parte.chapters
    .map(capitulo => ({ capitulo, itens: itens.filter(i => i.capitulo === capitulo.n) }))
    .filter(c => c.itens.length)
  return { slug: parte.slug, num: parte.num, title: parte.title, subtitle: parte.subtitle, total: capitulos.reduce((s, c) => s + c.itens.length, 0), capitulos, avulsos: [] }
}

// As 5 partes do livro (sempre presentes, mesmo vazias) + "Leituras e Recursos" (só se tiver itens).
export async function getBiblioteca(): Promise<Prateleira[]> {
  const todos = await getConteudo()
  const prateleiras = PARTES.map(p => montaPrateleira(p, todos.filter(i => i.parte === p.slug)))
  const avulsos = todos.filter(i => i.parte === LEITURAS.slug)
  if (avulsos.length) prateleiras.push({ ...LEITURAS, total: avulsos.length, capitulos: [], avulsos })
  return prateleiras
}

export async function getPrateleira(slug: string): Promise<Prateleira | null> {
  return (await getBiblioteca()).find(p => p.slug === slug) ?? null
}

// Quantos itens publicados cada capítulo do livro tem (para destacar no sumário e no menu).
export async function getContagemCapitulos(): Promise<Record<number, number>> {
  const contagem: Record<number, number> = {}
  for (const i of await getConteudo()) if (i.capitulo) contagem[i.capitulo] = (contagem[i.capitulo] ?? 0) + 1
  return contagem
}

// Outros conteúdos para o fim de uma página: mesmo capítulo, depois mesma parte, depois mesmo formato.
export async function getRelacionados(href: string, limite = 3): Promise<ItemConteudo[]> {
  const todos = await getConteudo()
  const atual = todos.find(i => i.href === href)
  const peso = (i: ItemConteudo) =>
    (atual?.capitulo && i.capitulo === atual.capitulo ? 4 : 0) + (i.parte === atual?.parte ? 2 : 0) + (i.tipo === atual?.tipo ? 1 : 0)
  return todos
    .filter(i => i.href !== href)
    .sort((a, b) => peso(b) - peso(a))
    .slice(0, limite)
}
