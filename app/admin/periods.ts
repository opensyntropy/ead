// Constantes de período compartilhadas entre o server component (relatorios/page)
// e o client component (PeriodSelector). Precisa ficar fora de um arquivo
// 'use client', senão os exports viram referências client no server.
export const RANGES = [
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '12 meses', days: 365 },
] as const

export const DEFAULT_RANGE = 30
export const ALLOWED_RANGES: readonly number[] = RANGES.map(r => r.days)
