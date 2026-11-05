'use client'

import { useEffect, useState } from 'react'

// Índice lateral da aula: marca a seção visível e mostra o progresso da leitura.
// No celular vira um bloco recolhível.
export default function Sumario({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      // seção ativa: a última cujo título já passou do topo (com folga para o cabeçalho fixo)
      let current = sections[0]?.id
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < 140) current = s.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  return (
    <nav className={`sumario${open ? ' aberto' : ''}`} aria-label="Nesta aula">
      <button type="button" className="sumario-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        Nesta aula <span aria-hidden>{open ? '−' : '+'}</span>
      </button>
      <p className="rotulo">Nesta aula</p>
      <div className="progresso" aria-hidden><span style={{ transform: `scaleX(${progress})` }} /></div>
      <ol className="secoes">
        {sections.map((s, i) => (
          <li key={s.id} className={s.id === active ? 'ativa' : undefined}>
            <a href={`#${s.id}`} onClick={() => setOpen(false)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
