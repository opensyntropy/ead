'use client'
import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

export interface RawEvent { date: string; utm: string | null; referer?: string | null }

interface Props {
  visits: RawEvent[]
  checkouts: RawEvent[]
  conversions: RawEvent[]
}

const SOURCE_COLORS: Record<string, string> = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  google:    '#FBBC05',
  email:     '#8B5CF6',
  direto:    '#6B7280',
}
const DEFAULT_COLOR = '#9ca3af'

const INTERVALS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
]

function srcColor(src: string) { return SOURCE_COLORS[src] ?? DEFAULT_COLOR }
function toDay(iso: string) { return iso.slice(0, 10) }

function srcFromReferer(referer: string | null | undefined): string {
  if (!referer) return 'direto'
  try {
    const host = new URL(referer).hostname.replace(/^www\./, '')
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook'
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('google')) return 'google'
    if (host.includes('youtube')) return 'youtube'
    if (host.includes('t.co') || host.includes('twitter') || host.includes('x.com')) return 'twitter'
    if (host.includes('whatsapp')) return 'whatsapp'
    return host
  } catch {
    return 'direto'
  }
}

function normSrc(utm: string | null, referer?: string | null) {
  if (utm) return utm.toLowerCase()
  return srcFromReferer(referer)
}

function buildDays(
  visits: RawEvent[],
  checkouts: RawEvent[],
  conversions: RawEvent[],
  filter: string | null,
  days: number,
) {
  const keep = (e: RawEvent) => !filter || normSrc(e.utm, e.referer) === filter

  const vByDay: Record<string, number> = {}
  for (const e of visits)      if (keep(e)) { vByDay[toDay(e.date)] = (vByDay[toDay(e.date)] ?? 0) + 1 }
  const cByDay: Record<string, number> = {}
  for (const e of checkouts)   if (keep(e)) { cByDay[toDay(e.date)] = (cByDay[toDay(e.date)] ?? 0) + 1 }
  const xByDay: Record<string, number> = {}
  for (const e of conversions) if (keep(e)) { xByDay[toDay(e.date)] = (xByDay[toDay(e.date)] ?? 0) + 1 }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return { label, visits: vByDay[key] ?? 0, checkouts: cByDay[key] ?? 0, conversions: xByDay[key] ?? 0 }
  })
}

function MiniChart({
  data,
  dataKey,
  color,
  title,
}: {
  data: { label: string; visits: number; checkouts: number; conversions: number }[]
  dataKey: 'checkouts' | 'conversions'
  color: string
  title: string
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
            labelStyle={{ fontWeight: 600, color: '#374151' }}
            formatter={(value) => [value, title]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function TrafficChart({ visits, checkouts, conversions }: Props) {
  const [filter, setFilter] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  const sources = useMemo(() => {
    const s = new Set<string>()
    for (const e of visits)      s.add(normSrc(e.utm, e.referer))
    for (const e of checkouts)   s.add(normSrc(e.utm, e.referer))
    for (const e of conversions) s.add(normSrc(e.utm, e.referer))
    return [...s].sort()
  }, [visits, checkouts, conversions])

  const data = useMemo(
    () => buildDays(visits, checkouts, conversions, filter, days),
    [visits, checkouts, conversions, filter, days],
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Interval selector */}
        <div className="flex items-center gap-1 mr-3">
          {INTERVALS.map(({ label, days: d }) => (
            <button
              key={label}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                days === d ? 'bg-[#1b4332] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 mr-1" />

        {/* Source filter */}
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            !filter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {sources.map(src => (
          <button
            key={src}
            onClick={() => setFilter(filter === src ? null : src)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === src ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={filter === src ? { backgroundColor: srcColor(src) } : {}}
          >
            {src}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <MiniChart data={data} dataKey="checkouts"   color="#C69B2D" title="Checkouts iniciados" />
        <div className="w-px bg-gray-100 self-stretch" />
        <MiniChart data={data} dataKey="conversions" color="#1b4332" title="Conversões" />
      </div>
    </div>
  )
}
