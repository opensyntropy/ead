export const PRODUCTS = {
  ebook: {
    id: 'ebook',
    name: 'Ebook',
    description: 'Leitura completa do ebook Agricultura Sintropica com todos os capítulos e infográficos.',
    price: 4700, // centavos
    priceFormatted: 'R$ 47',
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
} as const

export type ProductId = keyof typeof PRODUCTS
