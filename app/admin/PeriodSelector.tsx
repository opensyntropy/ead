'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export const RANGES = [
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '12 meses', days: 365 },
] as const

export const DEFAULT_RANGE = 30
export const ALLOWED_RANGES = RANGES.map(r => r.days) as readonly number[]

export default function PeriodSelector() {
  const router = useRouter()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()
  const raw = Number(sp.get('range'))
  const current = ALLOWED_RANGES.includes(raw) ? raw : DEFAULT_RANGE

  const select = (days: number) => {
    startTransition(() => router.replace(`/admin/relatorios?range=${days}`, { scroll: false }))
  }

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${pending ? 'opacity-60' : ''}`}>
      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold mr-1">Período</span>
      {RANGES.map(({ label, days }) => (
        <button
          key={days}
          onClick={() => select(days)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            current === days ? 'bg-[#1b4332] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
