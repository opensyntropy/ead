// Sumário do livro "Guia de Introdução à Agrofloresta Sintrópica": fonte única para a
// página de vendas (/ebook) e para a taxonomia da Biblioteca do Guia (/biblioteca).
// Sem dependências de servidor: pode ser importado por componentes client.

export interface CapituloLivro {
  n: number
  curto: string   // nome curto para menus e sumários
  title: string
  desc: string
}

export interface ParteLivro {
  slug: string
  num: string
  title: string
  subtitle: string
  chapters: CapituloLivro[]
}

export const PARTES: ParteLivro[] = [
  {
    slug: 'fundamentos', num: 'I', title: 'Fundamentos', subtitle: 'Por que e o quê: a lógica da vida que sustenta o método',
    chapters: [
      { n: 1, curto: 'Agricultura convencional', title: 'O Problema que a Agricultura Convencional Criou', desc: 'Por que o agricultor trabalha mais, gasta mais e colhe menos a cada ano, e o custo oculto dos insumos.' },
      { n: 2, curto: 'Sintropia', title: 'O Que É Sintropia', desc: 'De Schrödinger a Götsch: o princípio que faz a vida caminhar do simples para o complexo.' },
      { n: 3, curto: 'Conceitos e princípios', title: 'Conceitos, Princípios e Práticas da Agricultura Sintrópica', desc: 'A definição de agricultura sintrópica, seus princípios e as 6 práticas que a tornam realidade.' },
      { n: 4, curto: 'Sucessão natural', title: 'Sucessão Natural: O Calendário da Floresta', desc: 'Como a floresta se forma em etapas, e como plantar todas as fases de uma vez.' },
      { n: 5, curto: 'Estratos', title: 'Estratos: A Arquitetura Vertical da Floresta', desc: 'Emergente, alto, médio e baixo: como ocupar a luz em todos os andares do sistema.' },
      { n: 6, curto: 'Consórcios', title: 'Consórcios na Agrofloresta Sintrópica', desc: 'Plantas que cooperam em vez de competir: como montar combinações que funcionam.' },
      { n: 7, curto: 'Poda', title: 'O Pulso da Poda', desc: 'A poda sistêmica como motor da sucessão, e o maior diferencial do método.' },
      { n: 8, curto: 'Densidade e diversidade', title: 'Densidade e Diversidade', desc: 'Plantar denso e diverso ao mesmo tempo sem perder o controle do sistema.' },
      { n: 9, curto: 'Capina seletiva', title: 'Capina Seletiva: A Arte de Escolher o Que Fica', desc: 'O "mato" como indicador e aliado: o que tirar, o que deixar e por quê.' },
    ],
  },
  {
    slug: 'solo-e-fertilidade', num: 'II', title: 'Solo e Fertilidade', subtitle: 'Como o SAF constrói a própria fertilidade',
    chapters: [
      { n: 10, curto: 'Solo vivo', title: 'O Solo Como Organismo Vivo', desc: 'A vida do solo, sua estrutura e como a agrofloresta a reconstrói.' },
      { n: 11, curto: 'Biomassa', title: 'Produção de Biomassa', desc: 'O recurso mais valioso do sistema, produzido dentro dele e de graça.' },
      { n: 12, curto: 'Relação C/N', title: 'Relação C/N: A Química da Sucessão', desc: 'Por que capim verde e palha seca agem de formas opostas no solo.' },
      { n: 13, curto: 'Gramíneas', title: 'O Papel das Gramíneas no SAF Sintrópico', desc: 'Braquiária e capim como ferramentas de fertilidade, não inimigos.' },
      { n: 14, curto: 'Adubação verde', title: 'Adubação Verde: Fertilidade Construída por Dentro', desc: 'Adubar sem comprar nada: leguminosas e plantas de cobertura.' },
    ],
  },
  {
    slug: 'como-planejar', num: 'III', title: 'Como Planejar', subtitle: 'Do diagnóstico ao design',
    chapters: [
      { n: 15, curto: 'Leitura da terra', title: 'Leia Sua Terra Antes de Desenhar', desc: 'Observar relevo, água, solo e vegetação antes do primeiro plantio.' },
      { n: 16, curto: 'Objetivos', title: 'Defina Seus Objetivos Antes de Escolher Espécies', desc: 'Escolher o que produzir antes de escolher espécies: o erro mais comum do iniciante.' },
      { n: 17, curto: 'Caixa de ferramentas', title: 'A Caixa de Ferramentas Sintrópica', desc: 'As espécies de serviço que constroem o sistema: função, momento e manejo.' },
      { n: 18, curto: 'Linhas e arranjo', title: 'Linhas de Plantio e Arranjo Espacial', desc: 'Distâncias, orientação e módulos: os conceitos traduzidos em projeto.' },
    ],
  },
  {
    slug: 'modelos-de-saf', num: 'IV', title: 'Modelos de SAF', subtitle: 'Diferentes formas de aplicar o método',
    chapters: [
      { n: 19, curto: 'SAF base', title: 'SAF Base: O Módulo Fundamental', desc: 'O desenho mínimo de agrofloresta para aprender o método na prática.' },
      { n: 20, curto: 'SAF + horta', title: 'SAF + Horta: Uma Integração que Precisa Ser Entendida com Honestidade', desc: 'Árvores integradas à produção de hortaliças, com as vantagens e os limites reais.' },
      { n: 21, curto: 'SAF mecanizado', title: 'SAF para Mecanização: Produção em Escala', desc: 'Agrofloresta em escala com máquinas: quando faz sentido e como desenhar.' },
      { n: 22, curto: 'SAF café', title: 'SAF Café: O Modelo Sintrópico para Cafeicultura', desc: 'Café sombreado em sistema sintrópico, do exemplo premiado ao desenho.' },
      { n: 23, curto: 'SAF biodiverso', title: 'SAF Biodiverso: Quando a Floresta É o Produto', desc: 'A agrofloresta de alta diversidade para quem quer viver dentro da floresta.' },
    ],
  },
  {
    slug: 'implantar-e-manter', num: 'V', title: 'Como Implantar e Manter', subtitle: 'Da terra vazia ao sistema vivo',
    chapters: [
      { n: 24, curto: 'Primeiros 12 meses', title: 'Implantação: Os Primeiros 12 Meses', desc: 'O passo a passo do primeiro ano, quando os erros ainda custam pouco.' },
      { n: 25, curto: 'Muvuca de sementes', title: 'Muvuca de Sementes: Implantação com Baixo Custo e Alta Diversidade', desc: 'Semeadura direta de alta diversidade, sem viveiro e com baixo custo.' },
      { n: 26, curto: 'Lendo o sistema', title: 'Lendo o Sistema: Como Saber se Está Funcionando', desc: 'Os sinais de que o sistema está evoluindo, ou pedindo intervenção.' },
      { n: 27, curto: 'Tempo, custo e expectativa', title: 'É Difícil. É Verdade. E Vale a Pena.', desc: 'Quanto tempo leva, quanto custa e o que esperar de verdade.' },
    ],
  },
]

// Prateleira extra da Biblioteca para o que não pertence a nenhum capítulo do livro.
export const LEITURAS = {
  slug: 'leituras',
  title: 'Leituras e Recursos',
  subtitle: 'Livros, referências e materiais para ir além do Guia',
}

export function capituloLivro(n: number | undefined): CapituloLivro | undefined {
  return n ? PARTES.flatMap(p => p.chapters).find(c => c.n === n) : undefined
}

export function parteDoCapitulo(n: number | undefined): ParteLivro | undefined {
  return n ? PARTES.find(p => p.chapters.some(c => c.n === n)) : undefined
}

// Infográficos do livro já públicos (página de vendas), em /public/infograficos/cap<N>.png.
const INFOGRAFICOS = new Set([1, 2, 3, 4, 5, 6, 7, 10, 15])
export const infografico = (n: number) => (INFOGRAFICOS.has(n) ? `/infograficos/cap${n}.png` : undefined)

export const padCap = (n: number) => String(n).padStart(2, '0')

// Vocabulário do livro para as fichas de espécie (caps. 4, 5, 11, 14 e 17).
// Os valores no frontmatter são as chaves (sem acento); aqui ficam os rótulos.
export const ESTRATOS: Record<string, string> = {
  emergente: 'Emergente',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
}

export const SUCESSAO: Record<string, string> = {
  placenta: 'Placenta',
  secundaria: 'Secundária',
  climax: 'Clímax',
}

export const FUNCOES: Record<string, string> = {
  alimento: 'Alimento',
  biomassa: 'Biomassa',
  servico: 'Serviço',
  'adubacao-verde': 'Adubação verde',
  madeira: 'Madeira',
}

export const rotulo = (dic: Record<string, string>, chave: string) =>
  dic[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1).replace(/-/g, ' ')
