import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME, AUTHOR, AUTHOR_LINKS, INTRO_VIDEO } from '@/lib/site'
import { VideoPlayer } from '../manejo/Video'

export const metadata: Metadata = {
  title: 'Michel Bottan, autor do livro de Agrofloresta Sintrópica',
  description: 'Michel Bottan fez a formação de professores em agricultura sintrópica com Ernst Götsch e constrói o Desperto, sítio agroflorestal em Caçapava (SP). Autor do Guia de Introdução à Agrofloresta Sintrópica.',
  alternates: { canonical: '/sobre' },
  openGraph: { type: 'profile', url: '/sobre', images: ['/michel.jpg'] },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    '@id': `${SITE_URL}/#author`,
    name: AUTHOR,
    url: `${SITE_URL}/sobre`,
    image: `${SITE_URL}/michel.jpg`,
    jobTitle: 'Agricultor sintrópico e educador',
    worksFor: { '@type': 'Organization', name: SITE_NAME },
    knowsAbout: ['Agricultura sintrópica', 'Agrofloresta', 'Sistemas agroflorestais', 'Permacultura', 'Restauração de ecossistemas'],
    ...(AUTHOR_LINKS.length && { sameAs: AUTHOR_LINKS }),
  },
}

// Marcos da trajetória (os mesmos fatos do texto, em linha do tempo).
const TRAJETORIA: { quando: string; titulo: string; texto: string }[] = [
  { quando: '2000', titulo: 'Começa a programar', texto: 'Os primeiros anos da vida adulta construindo o que o mundo chama de sucesso.' },
  { quando: '2010', titulo: 'Funda uma empresa de tecnologia', texto: 'Até que a pergunta sobre o que realmente importa o leva de volta à terra.' },
  { quando: '2016', titulo: 'Formação com Ernst Götsch', texto: 'Três meses de formação intensiva para professores em agricultura sintrópica.' },
  { quando: 'Desperto', titulo: 'Um sítio em Caçapava (SP)', texto: 'Uma propriedade agroflorestal sintrópica que virou escola e laboratório.' },
  { quando: 'Gaia', titulo: 'Restauração e biorregionalização', texto: 'Cursos de Design em Restauração de Ecossistemas e de Biorregionalização pela Gaia Education.' },
  { quando: 'Hoje', titulo: 'PDC com David Holmgren', texto: 'Cursa o Permaculture Design Course com o cocriador da permacultura, e grava as aulas deste Guia.' },
]

// a seção do vídeo só aparece quando o vídeo de apresentação estiver cadastrado em lib/site.ts
const temVideo = Boolean(INTRO_VIDEO.youtube || INTRO_VIDEO.file)

export default function SobrePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="capitulo-hero sobre-hero" style={{ backgroundImage: 'url(/michel_hero.jpg)' }}>
        <div className="capitulo-hero-in">
          <p className="trilha">Sobre o autor</p>
          <h1>Michel Bottan</h1>
          <p className="sub">Da tecnologia às raízes da floresta</p>
          <ul className="meta">
            <li>Agrofloresteiro</li>
            <li>Fundador do Desperto</li>
            <li>Autor do Guia</li>
          </ul>
        </div>
      </header>

      <main className="inicio sobre-pagina">
        <div className="sobre-grade">
          <article className="texto">
            <p className="sobre-abertura">
              Michel Bottan passou os primeiros anos da vida adulta construindo o que o mundo chama de sucesso. Começou a programar
              em 2000 e fundou uma empresa de tecnologia em 2010. Até que a pergunta sobre o que realmente importa o levou de volta
              à terra: primeiro à agricultura orgânica, depois à agroecologia.
            </p>
            <p>
              Em 2016 fez a formação intensiva de três meses para professores em agricultura sintrópica com <strong>Ernst Götsch</strong>.
              Depois disso vendeu sua participação na empresa, comprou um sítio em Caçapava, no interior de São Paulo, e começou a
              construir o <strong>Desperto</strong>: uma propriedade agroflorestal sintrópica que ao longo dos anos se tornou escola e laboratório.
            </p>
            <p>
              Aprofundou a formação com os cursos de Design em Restauração de Ecossistemas e de Biorregionalização, ambos pela
              Gaia Education, implantou agroflorestas em outras propriedades e participou de imersões com agricultores e
              educadores sintrópicos de todo o Brasil. Atualmente cursa o PDC (Permaculture Design Course) com David Holmgren,
              cocriador da permacultura.
            </p>
            <p>
              Fundou a <strong>OpenSyntropy</strong> para criar tecnologia para a agricultura regenerativa e escreveu o{' '}
              <Link href="/guia-agrofloresta">Guia de Introdução à Agrofloresta Sintrópica</Link>, o livro que gostaria de ter tido quando começou.
            </p>
            <blockquote className="citacao">
              <p>Este guia é o caderno de campo desse trabalho: cada aula é gravada no Desperto e ligada ao livro, para que a prática e a teoria andem juntas.</p>
            </blockquote>
            <div className="sobre-links">
              <Link href="/biblioteca" className="botao">Ver as aulas na Biblioteca</Link>
              <a href="https://instagram.com/michel.agrofloresta" target="_blank" rel="noopener noreferrer" className="botao-linha">@michel.agrofloresta</a>
              <a href="https://desperto.earth" target="_blank" rel="noopener noreferrer" className="botao-linha">desperto.earth</a>
            </div>
          </article>

          <aside className="trajetoria" aria-labelledby="trajetoria-titulo">
            <p id="trajetoria-titulo" className="rotulo">Trajetória</p>
            <ol>
              {TRAJETORIA.map(t => (
                <li key={t.titulo}>
                  <span className="trajetoria-quando">{t.quando}</span>
                  <strong>{t.titulo}</strong>
                  <span>{t.texto}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {temVideo && <section className="sobre-apresentacao" aria-labelledby="apresentacao-titulo">
          <h2 id="apresentacao-titulo" className="titulo-secao">Apresentação</h2>
          <div className="player">
            <VideoPlayer
              url={INTRO_VIDEO.youtube || undefined}
              file={INTRO_VIDEO.file || undefined}
              title="Apresentação: Michel Bottan e o Desperto"
              poster="/michel_hero.jpg"
              emBreve="O vídeo de apresentação chega em breve."
            />
          </div>
        </section>}

      </main>
    </>
  )
}
