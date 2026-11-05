import Link from 'next/link'

// Chamada do livro no estilo Desperto: o conteúdo é livre, o livro sustenta o projeto.
export default function LivroDestaque({ titulo = 'Conteúdo livre e gratuito. Apoie com o livro.' }: { titulo?: string }) {
  return (
    <aside className="livro-destaque">
      <div className="livro-3d">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/desperto/capa-livro-3d.jpg" alt="Capa do Guia de Introdução à Agrofloresta Sintrópica" loading="lazy" />
      </div>
      <div>
        <p className="eyebrow">Livro</p>
        <h2>{titulo}</h2>
        <p>
          O <strong>Guia de Introdução à Agrofloresta Sintrópica</strong> explica o porquê de cada manejo:
          sucessão, estratos, consórcios, poda e implantação. Cada livro vendido financia as próximas aulas.
        </p>
        <ul className="selos">
          <li>+200 páginas</li>
          <li>27 capítulos</li>
          <li>25+ infográficos</li>
        </ul>
        <Link href="/guia-agrofloresta" className="botao">Conhecer o livro →</Link>
      </div>
    </aside>
  )
}
