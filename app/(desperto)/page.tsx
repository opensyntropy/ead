import Link from 'next/link'
import type { Metadata } from 'next'
import Inscricao from './Inscricao'
import { VideoPlayer } from './manejo/Video'
import { getConteudo, getContagemCapitulos, ehNovo } from '@/lib/conteudo'
import Cartao from './biblioteca/Cartao'
import MapaLivro from './MapaLivro'
import Data from './Data'
import { padCap, parteDoCapitulo } from '@/lib/livro'
import { INTRO_VIDEO } from '@/lib/site'

const TITLE = 'Guia Agrofloresta: manejo sintrópico na prática, com aulas em vídeo'
const DESCRIPTION = 'Aulas gravadas no campo sobre manejo de agrofloresta sintrópica: espécies, poda, propagação e consórcios, ligadas aos capítulos do livro Guia de Introdução à Agrofloresta Sintrópica.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/', type: 'website' },
}

export default async function Home() {
  const [conteudo, contagem] = await Promise.all([getConteudo(), getContagemCapitulos()])
  // mais novos primeiro: até 6 aulas em grade e até 3 artigos em lista
  const recentes = [...conteudo].sort((a, b) => b.data.localeCompare(a.data))
  const aulas = recentes.filter(i => i.tipo === 'Aula').slice(0, 6)
  const artigos = recentes.filter(i => i.tipo === 'Artigo').slice(0, 3)

  return (
    <main className="inicio">
      <section className="hero hero-inicio">
        <div>
          <p className="eyebrow">Guia Agrofloresta Sintrópica · aplicações práticas</p>
          <h1>Agrofloresta sintrópica na prática</h1>
          <p className="sub">
            Aulas gravadas no campo, no Desperto, uma espécie ou um manejo por vez. Cada aula é a parte prática do livro{' '}
            <Link href="/guia-agrofloresta"><em>Guia de Introdução à Agrofloresta Sintrópica</em></Link>: a teoria está no livro, a prática está aqui.
          </p>
          <ul className="como como-hero">
            <li><b>Assista</b>A aula em vídeo, gravada no campo.</li>
            <li><b>Leia</b>Ficha, manejo, poda e o que só a prática mostra.</li>
            <li><b>Aprofunde</b>Cada aula aponta o capítulo do livro.</li>
          </ul>
        </div>
        <Link href="/guia-agrofloresta" className="hero-livro" aria-label="Conhecer o livro">
          <span className="livro-3d">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/desperto/capa-livro-3d.jpg" alt="Capa do Guia de Introdução à Agrofloresta Sintrópica" />
          </span>
          <span className="hero-livro-leg">O livro · +200 páginas →</span>
        </Link>
      </section>

      {aulas.length > 0 && (
        <section className="ultimas" aria-labelledby="aulas-titulo">
          <div className="titulo-linha">
            <h2 id="aulas-titulo" className="titulo-secao">Últimas aulas</h2>
            <Link href="/biblioteca">Ver todas →</Link>
          </div>
          <div className="relacionados-grade grade-aulas">{aulas.map(i => <Cartao key={i.href} item={i} />)}</div>
        </section>
      )}

      <Inscricao />

      <section className="secao-mapa" aria-labelledby="mapa-titulo">
        <h2 id="mapa-titulo" className="titulo-secao">Biblioteca do Guia</h2>
        <p className="secao-sub">
          O conteúdo segue o sumário do livro: escolha uma parte ou um capítulo para ver as aulas e os artigos que colocam aquela teoria em prática.
        </p>
        <MapaLivro contagem={contagem} />
        <div className="mapa-acoes">
          <Link href="/biblioteca" className="botao">Abrir a Biblioteca</Link>
          <Link href="/biblioteca/especies" className="botao-linha">🌿 Espécies de A a Z</Link>
        </div>
      </section>

      {artigos.length > 0 && (
        <section className="ultimas" aria-labelledby="artigos-titulo">
          <div className="titulo-linha">
            <h2 id="artigos-titulo" className="titulo-secao">Artigos recentes</h2>
            <Link href="/artigos">Ver todos →</Link>
          </div>
          <ul className="artigos-recentes">
            {artigos.map(a => (
              <li key={a.href}>
                <Link href={a.href}>
                  <Data iso={a.data} curta className="relacionado-data" />
                  <strong>{a.titulo}</strong>
                  {ehNovo(a.data) && <span className="selo-novo">Novo</span>}
                  <span className="artigos-recentes-cap">{a.capitulo ? `Cap. ${padCap(a.capitulo)} · ${parteDoCapitulo(a.capitulo)?.title}` : 'Leituras e Recursos'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="sobre" className="sobre-mim">
        <div className="sobre-video">
          <VideoPlayer
            url={INTRO_VIDEO.youtube || undefined}
            file={INTRO_VIDEO.file || undefined}
            title="Apresentação: Michel Bottan e o Desperto"
            poster="/michel_hero.jpg"
            emBreve="O vídeo de apresentação chega em breve."
          />
        </div>
        <div className="sobre-texto">
          <p className="eyebrow">Quem grava estas aulas</p>
          <h2>Michel Bottan</h2>
          <p className="sobre-sub">Agrofloresteiro, fundador do Desperto e autor do livro</p>
          <p>
            Começou a programar em 2000 e fundou uma empresa de tecnologia, até trocar as telas pela terra. Em 2016 fez a formação para professores em agricultura
            sintrópica com <strong>Ernst Götsch</strong> e começou o <strong>Desperto</strong>, um sítio em Caçapava (SP) que virou
            escola e laboratório de agrofloresta.
          </p>
          <p>
            Este guia é o caderno de campo desse trabalho: cada aula é gravada no Desperto e ligada ao livro, para que a prática
            e a teoria andem juntas.
          </p>
          <div className="sobre-links">
            <Link href="/sobre" className="botao">Conheça minha história</Link>
            <a href="https://instagram.com/michel.agrofloresta" target="_blank" rel="noopener noreferrer" className="botao-linha">@michel.agrofloresta</a>
          </div>
        </div>
      </section>

    </main>
  )
}
