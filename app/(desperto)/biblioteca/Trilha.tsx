import Link from 'next/link'
import { Fragment } from 'react'
import { SITE_URL } from '@/lib/site'
import { capituloLivro, parteDoCapitulo, padCap, LEITURAS } from '@/lib/livro'

// Trilha "Biblioteca › Parte › Cap. N" no topo das páginas, e o mesmo caminho em JSON-LD.

export interface Passo { nome: string; href?: string }

export function passosDoCapitulo(capitulo: number | undefined): Passo[] {
  const parte = parteDoCapitulo(capitulo)
  const cap = capituloLivro(capitulo)
  const passos: Passo[] = [{ nome: 'Biblioteca', href: '/biblioteca' }]
  if (parte && cap) {
    passos.push({ nome: parte.title, href: `/biblioteca/${parte.slug}` })
    passos.push({ nome: `Cap. ${padCap(cap.n)}`, href: `/biblioteca/${parte.slug}#cap-${cap.n}` })
  } else {
    passos.push({ nome: LEITURAS.title, href: `/biblioteca/${LEITURAS.slug}` })
  }
  return passos
}

export default function Trilha({ passos }: { passos: Passo[] }) {
  return (
    <nav className="trilha" aria-label="Você está em">
      {passos.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden>›</span>}
          {p.href ? <Link href={p.href}>{p.nome}</Link> : p.nome}
        </Fragment>
      ))}
    </nav>
  )
}

// Passos com âncora (#cap-N) ficam de fora: no JSON-LD cada passo deve ser uma página.
export function breadcrumbJsonLd(passos: Passo[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: passos.filter(p => !p.href?.includes('#')).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.nome,
      ...(p.href && { item: `${SITE_URL}${p.href}` }),
    })),
  }
}
