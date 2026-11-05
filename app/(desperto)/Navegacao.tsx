'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import MapaLivro from './MapaLivro'

// Cabeçalho do Guia Agrofloresta (um projeto Desperto) e barra de abas no celular, como num app.

const ITENS = [
  { href: '/', label: 'Início', icone: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { href: '/biblioteca#busca', label: 'Buscar', icone: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.2-4.2' },
  { href: '/biblioteca', label: 'Biblioteca', icone: 'M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-.8 3 15.6-3.5.8z' },
  { href: '/sobre', label: 'Sobre', icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0' },
]

function Icone({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

function ativo(pathname: string, href: string) {
  if (href.includes('#')) return false
  if (href === '/') return pathname === '/'
  // aulas e artigos fazem parte da Biblioteca
  if (href === '/biblioteca') return ['/biblioteca', '/manejo', '/artigos'].some(p => pathname.startsWith(p))
  return pathname.startsWith(href)
}

// "Biblioteca" no menu do computador: abre o sumário do livro (passando o mouse, clicando ou pelo teclado).
function MenuBiblioteca({ contagem, ativo }: { contagem: Record<number, number>; ativo: boolean }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const abrir = () => { clearTimeout(timer.current); setAberto(true) }
  const fecharLogo = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setAberto(false), 180) }
  const fechar = () => { clearTimeout(timer.current); setAberto(false) }

  // clique fora ou Esc (em qualquer lugar da página) fecha
  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div
      ref={raiz}
      className="menu-biblioteca"
      onMouseEnter={abrir}
      onMouseLeave={fecharLogo}
      onKeyDown={e => { if (e.key === 'Escape') { fechar(); raiz.current?.querySelector('button')?.focus() } }}
    >
      <span className={`menu-item menu-item-duplo${ativo ? ' ativo' : ''}`}>
        <Link href="/biblioteca" onClick={fechar}>Biblioteca</Link>
        <button
          type="button"
          className="seta"
          aria-expanded={aberto}
          aria-controls="painel-biblioteca"
          aria-label={aberto ? 'Fechar o sumário do livro' : 'Abrir o sumário do livro'}
          onClick={() => (aberto ? fechar() : abrir())}
        >
          ▾
        </button>
      </span>
      {aberto && (
        <div id="painel-biblioteca" className="painel-biblioteca">
          <div className="painel-in">
            <div className="painel-topo">
              <p><strong>Biblioteca do Guia</strong> · a prática que complementa o livro, na ordem dos capítulos</p>
              <span>
                <Link href="/biblioteca/especies" onClick={fechar}>🌿 Espécies de A a Z</Link>
                <Link href="/biblioteca" onClick={fechar}>Ver toda a Biblioteca →</Link>
              </span>
            </div>
            <MapaLivro contagem={contagem} onNavegar={fechar} />
          </div>
        </div>
      )}
    </div>
  )
}

export function Cabecalho({ contagem }: { contagem: Record<number, number> }) {
  const pathname = usePathname()
  return (
    <header className="topo">
      <Link className="marca" href="/" aria-label="Guia Agrofloresta Sintrópica: aplicações práticas, início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/desperto/logo.webp" alt="" />
        <span className="marca-texto">
          <strong><span>Guia Agrofloresta</span> <span>Sintrópica</span></strong>
          <small>aplicações práticas</small>
        </span>
      </Link>
      <nav className="menu" aria-label="Principal">
        {ITENS.map(i => i.href === '/biblioteca'
          ? <MenuBiblioteca key={i.href} contagem={contagem} ativo={ativo(pathname, i.href)} />
          : (
            <Link key={i.href} href={i.href} className={`menu-item${ativo(pathname, i.href) ? ' ativo' : ''}`}>
              {i.label}
            </Link>
          ))}
        <Link href="/guia-agrofloresta" className="livro" aria-label="Compre o livro: Guia de Introdução à Agrofloresta Sintrópica">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="livro-capa" src="/desperto/capa-livro.jpg" alt="" />
          <span className="livro-rotulo">
            <strong>Compre o livro</strong>
            <small>+200 páginas →</small>
          </span>
        </Link>
      </nav>
    </header>
  )
}

export function Abas() {
  const pathname = usePathname()
  return (
    <nav className="abas" aria-label="Navegação">
      {ITENS.map(i => (
        <Link key={i.href} href={i.href} className={ativo(pathname, i.href) ? 'ativo' : undefined}>
          <Icone d={i.icone} />
          <span>{i.label}</span>
        </Link>
      ))}
      <Link href="/guia-agrofloresta" className="aba-livro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/desperto/capa-livro.jpg" alt="" />
        <span>Livro</span>
      </Link>
    </nav>
  )
}
