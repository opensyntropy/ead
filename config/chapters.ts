export type Product = 'ebook' | 'course' | 'bundle'

export interface Chapter {
  id: string
  number: number
  title: string
  subtitle: string
  product: Product  // mínimo necessário para acessar
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'cap02',
    number: 2,
    title: 'O Que É Sintropia',
    subtitle: 'e Por Que Isso Muda Tudo',
    product: 'ebook',
  },
  {
    id: 'cap03',
    number: 3,
    title: 'Sucessão Natural',
    subtitle: 'O Calendário da Floresta',
    product: 'ebook',
  },
  {
    id: 'cap04',
    number: 4,
    title: 'Estratos',
    subtitle: 'A Arquitetura Vertical da Floresta',
    product: 'ebook',
  },
]

export function hasChapterAccess(userProducts: Product[], chapter: Chapter): boolean {
  return userProducts.some(p => {
    if (p === 'bundle') return true
    if (p === chapter.product) return true
    return false
  })
}
