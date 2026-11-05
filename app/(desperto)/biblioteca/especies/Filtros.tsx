'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ESTRATOS, SUCESSAO, FUNCOES, rotulo } from '@/lib/livro'
import type { Especie } from '@/lib/conteudo'

// Lista A–Z de espécies com filtros no vocabulário do livro (estrato, sucessão, função).

export interface ItemEspecie extends Especie {
  href: string
  imagem?: string
  video: boolean
}

type Faceta = 'estrato' | 'sucessao' | 'funcao'

const FACETAS: { chave: Faceta; titulo: string; dic: Record<string, string> }[] = [
  { chave: 'estrato', titulo: 'Estrato', dic: ESTRATOS },
  { chave: 'sucessao', titulo: 'Sucessão', dic: SUCESSAO },
  { chave: 'funcao', titulo: 'Função', dic: FUNCOES },
]

const valores = (e: ItemEspecie, f: Faceta) => (f === 'funcao' ? e.funcao : e[f] ? [e[f]!] : [])

export default function Filtros({ especies }: { especies: ItemEspecie[] }) {
  const [sel, setSel] = useState<Partial<Record<Faceta, string>>>({})
  const visiveis = especies.filter(e => FACETAS.every(({ chave }) => !sel[chave] || valores(e, chave).includes(sel[chave]!)))

  return (
    <>
      <div className="filtros">
        {FACETAS.map(({ chave, titulo, dic }) => {
          // a ordem dos rótulos segue o livro; valores fora do vocabulário vão no fim
          const usados = new Set(especies.flatMap(e => valores(e, chave)))
          const opcoes = [...Object.keys(dic).filter(k => usados.has(k)), ...[...usados].filter(k => !(k in dic))]
          if (!opcoes.length) return null
          return (
            <div key={chave} className="filtro" role="group" aria-label={titulo}>
              <span className="rotulo">{titulo}</span>
              {opcoes.map(v => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={sel[chave] === v}
                  onClick={() => setSel(s => ({ ...s, [chave]: s[chave] === v ? undefined : v }))}
                >
                  {rotulo(dic, v)}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <p className="busca-contagem" aria-live="polite">
        {visiveis.length ? `${visiveis.length} espécie${visiveis.length > 1 ? 's' : ''}` : 'Nenhuma espécie com esses filtros.'}
      </p>

      <ul className="especies">
        {visiveis.map(e => (
          <li key={e.href}>
            <Link href={e.href} className="especie">
              {e.imagem
                ? <Image src={e.imagem} alt="" width={160} height={160} />
                : <span className="relacionado-sem-imagem" aria-hidden>🌿</span>}
              <span>
                <strong>{e.nome}</strong>
                <em>{e.cientifico}</em>
                <span className="especie-tags">
                  {e.estrato && <span>Estrato {rotulo(ESTRATOS, e.estrato).toLowerCase()}</span>}
                  {e.sucessao && <span>{rotulo(SUCESSAO, e.sucessao)}</span>}
                  {e.funcao.map(f => <span key={f}>{rotulo(FUNCOES, f)}</span>)}
                  {e.video && <span>Vídeo</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
