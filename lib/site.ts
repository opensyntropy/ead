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

// Grupo de avisos do Michel no WhatsApp (só ele envia mensagens): aparece em destaque em todas as páginas do Guia (barra no topo
// e bloco antes do rodapé) e no e-mail de boas-vindas. Vazio esconde os chamados.
export const WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/CtjoTh7LpqGFtR1EwaAVkj'

// Comunidade exclusiva de quem comprou o livro. Fica numa variável de ambiente (o repositório é público)
// e só sai do servidor depois do pagamento confirmado (tela pós-compra e e-mail de compra).
// Não importar em componente client. Vazio: o convite não aparece.
export const WHATSAPP_COMMUNITY_COMPRADORES = process.env.WHATSAPP_COMMUNITY_COMPRADORES?.trim() ?? ''
