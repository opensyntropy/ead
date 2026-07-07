'use client'
import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

export interface RawConversion {
  date: string
  adset: string | null
  ad: string | null
}

const PALETTE = [
  '#1b4332', '#7DC142', '#1877F2', '#E1306C', '#C69B2D',
  '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#10B981',
]

function toDay(iso: string) {
  return new Date(iso).toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })
}

function adKey(adset: string | null, ad: string | null) {
  const a = adset?.trim() || '—'
  const b = ad?.trim() || '—'
  return `${a} · ${b}`
}

function buildData(
  conversions: RawConversion[],
  days: number,
  hidden: Set<string>,
) {
  // All unique adset+ad keys
  const allKeys = [...new Set(conversions.map(c => adKey(c.adset, c.ad)))]

  // Count per key
  const totalByKey: Record<string, number> = {}
  for (const c of conversions) {
    const k = adKey(c.adset, c.ad)
    totalByKey[k] = (totalByKey[k] ?? 0) + 1
  }

  // Top 10 by total conversions
  const topKeys = allKeys
    .sort((a, b) => (totalByKey[b] ?? 0) - (totalByKey[a] ?? 0))
    .slice(0, 10)

  // Build day → key → count
  const byDayKey: Record<string, Record<string, number>> = {}
  for (const c of conversions) {
    const k = adKey(c.adset, c.ad)
    if (!topKeys.includes(k)) continue
    const day = toDay(c.date)
    if (!byDayKey[day]) byDayKey[day] = {}
    byDayKey[day][k] = (byDayKey[day][k] ?? 0) + 1
  }

  const rows = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000)
    const key = d.toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
    const row: Record<string, unknown> = { label }
    for (const k of topKeys) {
      row[k] = hidden.has(k) ? undefined : (byDayKey[key]?.[k] ?? 0)
    }
    return row
  })

  return { rows, topKeys, totalByKey }
}

export default function AdPerformanceChart({ conversions, days }: { conversions: RawConversion[]; days: number }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    return conversions.filter(c => c.date >= cutoff)
  }, [conversions, days])

  const { rows, topKeys, totalByKey } = useMemo(
    () => buildData(filtered, days, hidden),
    [filtered, days, hidden],
  )

  const toggle = (k: string) => setHidden(prev => {
    const next = new Set(prev)
    next.has(k) ? next.delete(k) : next.add(k)
    return next
  })

  if (conversions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-400 text-sm">
        Nenhuma conversão com dados de anúncio ainda.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="ml-auto text-xs text-gray-400">Top 10 por conversões · clique na legenda para ocultar</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.ceil(days / 10) - 1)}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', maxWidth: 340 }}
            labelStyle={{ fontWeight: 600, color: '#374151' }}
          />
          {topKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={hidden.has(k) ? '#e5e7eb' : PALETTE[i % PALETTE.length]}
              strokeWidth={hidden.has(k) ? 1 : 2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend table */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1">
        {topKeys.map((k, i) => {
          const total = totalByKey[k] ?? 0
          const isHidden = hidden.has(k)
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${
                isHidden ? 'opacity-40' : 'hover:bg-gray-50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-xs text-gray-700 truncate flex-1" title={k}>{k}</span>
              <span className="text-xs font-bold text-gray-500 flex-shrink-0">{total}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
