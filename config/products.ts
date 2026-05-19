export const PRODUCTS = {
  ebook: {
    id: 'ebook',
    name: 'Ebook',
    description: 'Leitura completa do ebook Agricultura Sintropica com todos os capítulos e infográficos.',
    price: 5700, // centavos
    priceFormatted: 'R$ 57',
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
    price: 14000,
    priceFormatted: 'R$ 140',
    asaasDescription: 'Sessão Individual 1hr — Oferta Especial Pós-Ebook',
  },
} as const

export type ProductId = keyof typeof PRODUCTS

// Stripe USD pricing (in cents) per Global North / Global South tier
export const STRIPE_PRODUCTS = {
  ebook: {
    gn: { cents: 4700, label: '$47', priceId: process.env.STRIPE_PRICE_EBOOK_GN ?? '' },
    gs: { cents: 2700, label: '$27', priceId: process.env.STRIPE_PRICE_EBOOK_GS ?? '' },
    name: 'Introduction to Syntropic Agroforestry — Ebook',
    nameEs: 'Introducción a la Agroforestería Sintrópica — Ebook',
  },
  session: {
    gn: { cents: 14700, label: '$147', priceId: process.env.STRIPE_PRICE_SESSION_GN ?? '' },
    gs: { cents: 7700, label: '$77', priceId: process.env.STRIPE_PRICE_SESSION_GS ?? '' },
    name: 'Ebook + 1h Individual Session with Michel Bottan',
    nameEs: 'Ebook + Sesión Individual 1h con Michel Bottan',
  },
} as const

export type StripeProductId = keyof typeof STRIPE_PRODUCTS
