import { IconeWhatsApp } from '../(desperto)/Comunidade'

// Convite para a comunidade exclusiva de compradores, mostrado depois do pagamento confirmado.
// A URL vem do servidor (resposta da API de pagamento ou página server), nunca de constante no client.
export default function ComunidadeCompradores({ url }: { url: string | null | undefined }) {
  if (!url) return null
  return (
    <div className="w-full rounded-2xl px-6 py-6 text-center" style={{ background: 'linear-gradient(150deg, #0F6B3A, #12874A)', color: '#E7F8EE' }}>
      <span className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-2xl bg-white" style={{ color: '#1FAF5A' }}>
        <IconeWhatsApp className="w-7 h-7" />
      </span>
      <p className="font-bold text-white text-lg leading-snug mb-1">Entre na comunidade exclusiva de leitores</p>
      <p className="text-sm leading-relaxed mb-4">Grupo no WhatsApp só para quem tem o livro: tire dúvidas da leitura e troque experiências de plantio. Eu estou lá e, sempre que posso, respondo as perguntas.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full font-bold text-base py-4 rounded-xl bg-white transition-all hover:brightness-95"
        style={{ color: '#0F6B3A' }}
      >
        Entrar na comunidade de leitores →
      </a>
    </div>
  )
}
