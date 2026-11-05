import Link from 'next/link'
import { PARTES, padCap } from '@/lib/livro'

// Sumário navegável do livro (5 partes, 27 capítulos), usado na home e no menu do cabeçalho.
// Capítulos com aulas ou artigos publicados ficam em destaque, com a contagem.
// Sem dependências de servidor: o cabeçalho (client) também usa.

export default function MapaLivro({ contagem, onNavegar }: { contagem: Record<number, number>; onNavegar?: () => void }) {
  return (
    <div className="mapa-livro">
      {PARTES.map(p => {
        const total = p.chapters.reduce((s, c) => s + (contagem[c.n] ?? 0), 0)
        return (
          <section key={p.slug} className="mapa-parte">
            <Link href={`/biblioteca/${p.slug}`} className="mapa-parte-topo" onClick={onNavegar}>
              <span className="mapa-parte-num">{p.num}</span>
              <strong>{p.title}</strong>
              <span className="mapa-parte-total">{total ? `${total} ${total > 1 ? 'itens' : 'item'}` : 'em breve'}</span>
            </Link>
            <ul>
              {p.chapters.map(c => {
                const n = contagem[c.n] ?? 0
                return (
                  <li key={c.n}>
                    <Link href={`/biblioteca/${p.slug}#cap-${c.n}`} className={n ? 'tem' : undefined} title={c.title} onClick={onNavegar}>
                      <span className="mapa-cap-num">{padCap(c.n)}</span>
                      <span className="mapa-cap-nome">{c.curto}</span>
                      {n > 0 && <span className="mapa-cap-qtd" aria-label={`${n} ${n > 1 ? 'itens' : 'item'}`}>{n}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
