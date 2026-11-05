import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagamento confirmado',
  robots: { index: false },
}

export default function CompraConfirmada() {
  return (
    <div className="min-h-screen bg-[#141F0C] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h1 className="text-3xl font-serif font-bold text-[#7DC142] mb-4">Pagamento confirmado!</h1>
        <p className="text-white/70 text-lg leading-relaxed mb-8">
          Obrigado pela compra. Você vai receber em poucos minutos um e-mail com o link para baixar o ebook.
        </p>
        <p className="text-white/40 text-sm">
          Não chegou? Confira a pasta de spam ou{' '}
          <a href="/reenviar" className="text-[#52b788] underline">peça um novo link</a>.
        </p>
      </div>
    </div>
  )
}
