'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ItemConteudo } from '@/lib/conteudo'

// Busca na home e na Biblioteca: filtra aulas e artigos no navegador (o conteúdo é pequeno), sem acento e sem caixa.

const normaliza = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const SUGESTOES = ['poda', 'estaca', 'biomassa', 'sombra', 'sucessão']

function trecho(texto: string, termos: string[]) {
  const n = normaliza(texto)
  const i = Math.max(0, ...termos.map(t => n.indexOf(t)))
  const ini = Math.max(0, i - 60)
  return (ini > 0 ? '…' : '') + texto.slice(ini, ini + 170).trim() + '…'
}

export default function Busca({ itens }: { itens: Pick<ItemConteudo, 'tipo' | 'titulo' | 'resumo' | 'href' | 'video' | 'texto'>[] }) {
  const [q, setQ] = useState('')
  const termos = normaliza(q).split(/\s+/).filter(t => t.length > 1)

  const resultados = useMemo(() => {
    if (!termos.length) return []
    return itens
      .map(i => {
        const titulo = normaliza(i.titulo), resumo = normaliza(i.resumo), texto = normaliza(i.texto)
        if (!termos.every(t => titulo.includes(t) || resumo.includes(t) || texto.includes(t))) return null
        const pontos = termos.reduce((s, t) => s + (titulo.includes(t) ? 5 : 0) + (resumo.includes(t) ? 2 : 0) + (texto.split(t).length - 1), 0)
        return { ...i, pontos }
      })
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .sort((a, b) => b.pontos - a.pontos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, itens])

  return (
    <section id="busca" className="busca">
      <label className="busca-campo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.2-4.2" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar espécie, manejo, assunto…"
          aria-label="Buscar no Guia"
          enterKeyHint="search"
        />
      </label>
      {!termos.length && (
        <p className="busca-sugestoes">
          Experimente:{' '}
          {SUGESTOES.map(s => <button key={s} type="button" onClick={() => setQ(s)}>{s}</button>)}
        </p>
      )}
      {termos.length > 0 && (
        <div className="busca-resultados" aria-live="polite">
          <p className="busca-contagem">
            {resultados.length ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''}` : 'Nada encontrado. Tente outra palavra.'}
          </p>
          {resultados.map(r => (
            <Link key={r.href} href={r.href} className="busca-item">
              <span className="busca-tipo">{r.tipo}{r.video ? ' · vídeo' : ''}</span>
              <strong>{r.titulo}</strong>
              <span className="busca-trecho">{trecho(r.texto, termos)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
