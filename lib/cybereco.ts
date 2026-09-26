// Analytics centralizado no cybereco (ver cybereco/public/t.js).
// Chamadas antes do script carregar entram numa fila que o t.js esvazia ao iniciar.
type Props = Record<string, string | number | boolean>

export function track(name: string, props?: Props, valueCents?: number) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { cybereco?: { track?: (...a: unknown[]) => void; q?: unknown[][] } }
  if (w.cybereco?.track) return w.cybereco.track(name, props, valueCents)
  w.cybereco ??= { q: [] }
  ;(w.cybereco.q ??= []).push([name, props, valueCents])
}
