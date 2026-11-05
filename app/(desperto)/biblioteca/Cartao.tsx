import Link from 'next/link'
import Image from 'next/image'
import { ehNovo, type ItemConteudo } from '@/lib/conteudo'
import Data from '../Data'

// Um item da Biblioteca (aula ou artigo) em formato de cartão compacto: imagem (ou capa de tipo),
// selo "Novo" quando recente, tipo + data e título.
export default function Cartao({ item }: { item: ItemConteudo }) {
  return (
    <Link href={item.href} className="relacionado">
      <span className="relacionado-capa">
        {item.imagem
          ? <Image src={item.imagem} alt="" width={480} height={270} />
          : <span className="relacionado-sem-imagem" aria-hidden><span>{item.tipo === 'Artigo' ? '✦' : '🌿'}</span>{item.tipo}</span>}
        {ehNovo(item.data) && <span className="selo-novo">Novo</span>}
        {item.video && <span className="selo-play" aria-hidden>▶</span>}
      </span>
      <span className="relacionado-corpo">
        <span className="relacionado-linha">
          <span className="busca-tipo">{item.tipo}{item.video ? ' · vídeo' : ''}</span>
          <Data iso={item.data} curta className="relacionado-data" />
        </span>
        <strong>{item.titulo}</strong>
        <span className="relacionado-resumo">{item.resumo}</span>
      </span>
    </Link>
  )
}
