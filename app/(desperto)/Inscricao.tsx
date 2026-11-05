'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { formatPhoneInput } from '@/lib/phone'

// "Inscreva-se": aviso de novos vídeos por e-mail e/ou WhatsApp.
export default function Inscricao() {
  const origem = usePathname()
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'ok' | 'erro'>('livre')
  const [mensagem, setMensagem] = useState('')

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() && !whatsapp.trim()) {
      setEstado('erro'); setMensagem('Informe seu e-mail ou WhatsApp.'); return
    }
    setEstado('enviando')
    const site = (new FormData(e.currentTarget).get('site') as string) ?? ''
    try {
      const res = await fetch('/api/inscrever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whatsapp, origem, site }),
      })
      const data = await res.json().catch(() => ({}))
      setEstado(res.ok ? 'ok' : 'erro')
      setMensagem(data.message ?? (res.ok ? 'Inscrição feita!' : 'Algo deu errado.'))
    } catch {
      setEstado('erro'); setMensagem('Sem conexão. Tente de novo.')
    }
  }

  return (
    <section className="inscricao" aria-labelledby="inscricao-titulo">
      <div className="inscricao-texto">
        <p className="eyebrow"><span aria-hidden>🔔</span> Novos vídeos</p>
        <h2 id="inscricao-titulo">Receba a próxima aula assim que ela sair</h2>
        <ul className="inscricao-beneficios">
          <li>Um aviso a cada vídeo novo gravado no campo</li>
          <li>Por e-mail, WhatsApp ou os dois</li>
          <li>Sem spam: você sai quando quiser</li>
        </ul>
      </div>
      {estado === 'ok' ? (
        <p className="inscricao-ok" role="status">✓ {mensagem}</p>
      ) : (
        <form className="inscricao-form" onSubmit={enviar} noValidate>
          <label>
            <span>E-mail</span>
            <input type="email" inputMode="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>
            <span>WhatsApp</span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="(12) 99123-4567" value={whatsapp} onChange={e => setWhatsapp(formatPhoneInput(e.target.value))} />
          </label>
          <input type="text" name="site" tabIndex={-1} autoComplete="off" className="inscricao-isca" aria-hidden />
          <button type="submit" className="botao" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Quero receber'}
          </button>
          <p className="inscricao-nota">
            Preencha um ou os dois. Usamos seu contato só para avisar de novos vídeos do Guia Agrofloresta.
          </p>
          {estado === 'erro' && <p className="inscricao-erro" role="alert">{mensagem}</p>}
        </form>
      )}
    </section>
  )
}
