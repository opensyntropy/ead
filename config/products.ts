export const PRODUCTS = {
  ebook: {
    id: 'ebook',
    name: 'Ebook',
    description: 'Leitura completa do ebook Agricultura Sintropica com todos os capítulos e infográficos.',
    price: 8700, // centavos
    priceFormatted: 'R$ 87',
    asaasDescription: 'Ebook Agricultura Sintropica',
  },
  course: {
    id: 'course',
    name: 'Curso em Vídeo',
    description: 'Acesso a todas as aulas em vídeo organizadas por capítulo.',
    price: 9700,
    priceFormatted: 'R$ 97',
    asaasDescription: 'Curso em Vídeo Agricultura Sintropica',
  },
  bundle: {
    id: 'bundle',
    name: 'Bundle Completo',
    description: 'Ebook + Curso em Vídeo. Acesso total à plataforma.',
    price: 12700,
    priceFormatted: 'R$ 127',
    asaasDescription: 'Bundle Completo Agricultura Sintropica',
  },
  session: {
    id: 'session',
    name: 'Ebook + Sessão Individual',
    description: 'Ebook completo + 1 hora de sessão individual com Michel Bottan.',
    price: 19700,
    priceFormatted: 'R$ 197',
    asaasDescription: 'Ebook + Sessão Individual 1hr — Agricultura Sintrópica',
  },
  session_upsell: {
    id: 'session_upsell',
    name: 'Sessão Individual (oferta pós-compra)',
    description: '1 hora de consultoria individual — oferta exclusiva pós-compra do ebook.',
    price: 12000,
    priceFormatted: 'R$ 120',
    asaasDescription: 'Sessão Individual 1hr — Oferta Especial Pós-Ebook',
  },
} as const

export type ProductId = keyof typeof PRODUCTS

// Stripe pricing per tier and currency. Os preços são criados na hora no checkout
// (price_data), então não há produto/preço cadastrado no painel do Stripe.
// `currency` é a moeda cobrada: GS em EUR cai para USD.
export const STRIPE_PRODUCTS = {
  ebook: {
    gn: {
      usd: { cents: 4700, label: '$47', currency: 'usd' },
      eur: { cents: 4400, label: '€44', currency: 'eur' },
    },
    gs: {
      usd: { cents: 2700, label: '$27', currency: 'usd' },
      eur: { cents: 2700, label: '$27', currency: 'usd' }, // GS countries don't use EUR, fallback to USD
    },
    name: 'Introduction to Syntropic Agroforestry — Ebook',
    nameEs: 'Introducción a la Agroforestería Sintrópica — Ebook',
  },
  session: {
    gn: {
      usd: { cents: 14700, label: '$147', currency: 'usd' },
      eur: { cents: 13700, label: '€137', currency: 'eur' },
    },
    gs: {
      usd: { cents: 7700, label: '$77', currency: 'usd' },
      eur: { cents: 7700, label: '$77', currency: 'usd' },
    },
    name: 'Ebook + 1h Individual Session with Michel Bottan',
    nameEs: 'Ebook + Sesión Individual 1h con Michel Bottan',
  },
} as const

export type StripeProductId = keyof typeof STRIPE_PRODUCTS

// Landing /ebook (PT) para quem está na zona do euro (Portugal): preço próprio,
// abaixo do €44 das páginas /en e /es.
export const STRIPE_EBOOK_PT_EUR = { cents: 2700, label: '€27', currency: 'eur' } as const
export const STRIPE_EBOOK_PT_NAME = 'Ebook Agricultura Sintrópica'
