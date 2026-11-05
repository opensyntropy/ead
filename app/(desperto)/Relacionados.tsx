import Cartao from './biblioteca/Cartao'
import { getRelacionados } from '@/lib/conteudo'

// "Continue explorando": outras aulas e artigos, primeiro do mesmo capítulo do livro no fim de cada página.
export default async function Relacionados({ href }: { href: string }) {
  const itens = await getRelacionados(href)
  if (!itens.length) return null
  return (
    <section className="relacionados" aria-labelledby="relacionados-titulo">
      <h2 id="relacionados-titulo" className="titulo-secao">Continue explorando</h2>
      <div className="relacionados-grade">
        {itens.map(i => <Cartao key={i.href} item={i} />)}
      </div>
    </section>
  )
}
