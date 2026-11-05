// Domínio canônico do site. Na migração para o domínio de SEO basta trocar
// NEXT_PUBLIC_BASE_URL na Vercel e listar os domínios antigos em LEGACY_HOSTS.
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.agroflorestasintropica.com.br').replace(/\/$/, '')

export const SITE_NAME = 'OpenSyntropy'
export const AUTHOR = 'Michel Bottan'
// Perfis públicos do autor (Instagram, YouTube, LinkedIn...) — viram sameAs no schema Person.
export const AUTHOR_LINKS: string[] = ['https://desperto.earth']

export const EBOOK_TITLE = 'Guia de Introdução à Agrofloresta Sintrópica'
export const EBOOK_PRICE_BRL = 87
// Preencher quando o ISBN for emitido (CBL); entra no schema Book.
export const EBOOK_ISBN: string | null = null

// Vídeo de apresentação do Michel na home do Guia. Preencha um dos dois (YouTube tem prioridade);
// vazio mostra "vídeo em breve".
export const INTRO_VIDEO: { youtube?: string; file?: string } = { youtube: '', file: '' }
