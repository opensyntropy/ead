'use client'

import { useEffect, useSyncExternalStore } from 'react'

// Mostra o conteúdo só na primeira visita ao site: em todas as páginas daquela sessão do navegador,
// e não mais nas visitas seguintes. No servidor (e sem JavaScript) não aparece, para não piscar
// para quem já conhece o site.
const VISTA = 'guia:faixa-whats-vista'      // localStorage: já teve a primeira visita
const SESSAO = 'guia:faixa-whats-sessao'    // sessionStorage: esta aba é a primeira visita

function primeiraVisita() {
  try {
    return !localStorage.getItem(VISTA) || sessionStorage.getItem(SESSAO) === '1'
  } catch {
    return false // armazenamento bloqueado: melhor não insistir
  }
}

const semInscricao = () => () => {}

export default function SoNaPrimeiraVisita({ children }: { children: React.ReactNode }) {
  const mostrar = useSyncExternalStore(semInscricao, primeiraVisita, () => false)

  useEffect(() => {
    if (!mostrar) return
    try {
      localStorage.setItem(VISTA, '1')
      sessionStorage.setItem(SESSAO, '1')
    } catch { /* ignora */ }
  }, [mostrar])

  return mostrar ? <>{children}</> : null
}
