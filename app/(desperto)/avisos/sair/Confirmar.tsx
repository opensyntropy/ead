'use client'

import { useState } from 'react'

export default function Confirmar({ email, token }: { email: string; token: string }) {
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'ok' | 'erro'>('livre')

  async function confirmar() {
    setEstado('enviando')
    const res = await fetch(`/api/inscrever/sair?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => null)
    setEstado(res?.ok ? 'ok' : 'erro')
  }

  if (estado === 'ok') {
    return (
      <>
        <h1>Pronto, você saiu da lista</h1>
        <p><strong>{email}</strong> não vai mais receber os avisos de novas aulas. Se mudar de ideia, é só se inscrever de novo em qualquer aula.</p>
      </>
    )
  }
  return (
    <>
      <h1>Não quer mais receber os avisos?</h1>
      <p>Vamos parar de enviar os avisos de novas aulas para <strong>{email}</strong>.</p>
      <button type="button" className="botao" onClick={confirmar} disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Saindo…' : 'Confirmar: sair da lista'}
      </button>
      {estado === 'erro' && <p className="inscricao-erro" role="alert">Não foi possível agora. Tente de novo em instantes.</p>}
    </>
  )
}
