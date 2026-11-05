import type { Metadata } from 'next'
import Link from 'next/link'
import Confirmar from './Confirmar'

export const metadata: Metadata = {
  title: 'Sair dos avisos de novas aulas',
  robots: { index: false, follow: false },
}

export default async function SairDosAvisos({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = '', t = '' } = await searchParams
  return (
    <main className="inicio">
      <section className="aviso-sair">
        <p className="eyebrow">Avisos de novas aulas</p>
        {e && t ? (
          <Confirmar email={e} token={t} />
        ) : (
          <>
            <h1>Link inválido</h1>
            <p>Use o link “Não quero mais receber estes avisos” que veio no rodapé do e-mail.</p>
          </>
        )}
        <p className="aviso-sair-volta"><Link href="/biblioteca">← Ir para a Biblioteca</Link></p>
      </section>
    </main>
  )
}
