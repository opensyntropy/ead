'use client'
import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
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

function srcColor(src: string) { return SOURCE_COLORS[src] ?? DEFAULT_COLOR }

function toDay(iso: string) { return iso.slice(0, 10) }

function buildDays(visits: RawEvent[], checkouts: RawEvent[], conversions: RawEvent[], filter: string | null) {
  const keep = (e: RawEvent) => {
    if (!filter) return true
    return normSrc(e.utm, e.referer) === filter
  }
  const vByDay: Record<string, number> = {}
  for (const e of visits)     if (keep(e)) { vByDay[toDay(e.date)] = (vByDay[toDay(e.date)] ?? 0) + 1 }
  const cByDay: Record<string, number> = {}
  for (const e of checkouts)  if (keep(e)) { cByDay[toDay(e.date)] = (cByDay[toDay(e.date)] ?? 0) + 1 }
  const xByDay: Record<string, number> = {}
  for (const e of conversions) if (keep(e)) { xByDay[toDay(e.date)] = (xByDay[toDay(e.date)] ?? 0) + 1 }

  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return { label, visits: vByDay[key] ?? 0, checkouts: cByDay[key] ?? 0, conversions: xByDay[key] ?? 0 }
  })
}

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

export default function TrafficChart({ visits, checkouts, conversions }: Props) {
  const [filter, setFilter] = useState<string | null>(null)

  const sources = useMemo(() => {
    const s = new Set<string>()
    for (const e of visits)      s.add(normSrc(e.utm, e.referer))
    for (const e of checkouts)   s.add(normSrc(e.utm, e.referer))
    for (const e of conversions) s.add(normSrc(e.utm, e.referer))
    return [...s].sort()
  }, [visits, checkouts, conversions])

  const data = useMemo(
    () => buildDays(visits, checkouts, conversions, filter),
    [visits, checkouts, conversions, filter],
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mr-2">Últimos 30 dias</p>
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

      <ResponsiveContainer width="100%" height={240}>
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
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) =>
              value === 'visits' ? 'Visitas' :
              value === 'checkouts' ? 'Checkouts iniciados' : 'Conversões'
            }
          />
          <Line type="monotone" dataKey="visits"      stroke="#7DC142" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="checkouts"   stroke="#C69B2D" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="conversions" stroke="#1b4332" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
