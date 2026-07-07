import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TrafficChart, { type RawEvent } from '../TrafficChart'
import AdPerformanceChart, { type RawConversion } from '../AdPerformanceChart'
import AdminHeader from '../AdminHeader'
import PeriodSelector, { RANGES, ALLOWED_RANGES, DEFAULT_RANGE } from '../PeriodSelector'
import { rowValue } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

function normVisitSrc(utm: string | null | undefined, referer: string | null | undefined): string {
  if (utm) return utm.toLowerCase()
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 rounded-full bg-[#52b788]" />
      <h2 className="text-lg font-bold text-gray-700">{title}</h2>
    </div>
  )
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-gray-400 bg-gray-100">sem base</span>
  }
  const change = Math.round(((cur - prev) / prev) * 1000) / 10
  const up = change > 0
  const down = change < 0
  const cls = up ? 'text-green-700 bg-green-50' : down ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-gray-100'
  const arrow = up ? '▲' : down ? '▼' : '▬'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cls}`} title={`${cur} vs ${prev} no período anterior`}>
      {arrow} {Math.abs(change)}%
    </span>
  )
}

function CompareCard({ label, cur, prev, format }: { label: string; cur: number; prev: number; format?: (n: number) => string }) {
  const fmt = format ?? ((n: number) => String(n))
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex-1 min-w-[180px]">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-2xl font-black text-gray-800">{fmt(cur)}</p>
        <Delta cur={cur} prev={prev} />
      </div>
      <p className="text-xs text-gray-400 mt-1">30 dias anteriores: {fmt(prev)}</p>
    </div>
  )
}

function OriginBadge({ row }: { row?: { utm_source?: string | null } }) {
  if (!row?.utm_source) return <span className="text-gray-300 text-xs">direto</span>
  const SOURCE_NORMALIZE: Record<string, string> = { ig: 'instagram', fb: 'facebook', an: 'audience_network', msg: 'messenger' }
  const src = SOURCE_NORMALIZE[row.utm_source.toLowerCase()] ?? row.utm_source.toLowerCase()
  const srcColors: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    google: 'bg-yellow-100 text-yellow-700',
    email: 'bg-purple-100 text-purple-700',
  }
  const cls = srcColors[src] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {src}
    </span>
  )
}

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const sp = await searchParams
  const rawRange = Number(sp.range)
  const rangeDays = ALLOWED_RANGES.includes(rawRange) ? rawRange : DEFAULT_RANGE
  const periodLabel = RANGES.find(r => r.days === rangeDays)?.label ?? `${rangeDays} dias`

  const service = await createServiceClient()
  const now = Date.now()
  const nowISO = new Date(now).toISOString()
  const monthISO = new Date(now - rangeDays * 86400000).toISOString()
  const prevMonthISO = new Date(now - 2 * rangeDays * 86400000).toISOString()

  const [visitsMonthRes, visitsPrevRes, visitsRawRes, visitsTotalRes, pixRes] = await Promise.all([
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', monthISO),
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', prevMonthISO).lt('created_at', monthISO),
    service.from('page_visits').select('created_at,utm_source,utm_content,referer').eq('page', '/ebook').gte('created_at', monthISO).order('created_at', { ascending: false }).limit(60000),
    service.from('page_visits').select('id', { count: 'exact', head: true }),
    service.from('pix_charges').select('*').order('created_at', { ascending: false }),
  ])

  const dbErrors = [
    visitsMonthRes.error && `page_visits count: ${visitsMonthRes.error.message}`,
    visitsRawRes.error  && `page_visits data: ${visitsRawRes.error.message}`,
    pixRes.error        && `pix_charges: ${pixRes.error.message}`,
  ].filter(Boolean) as string[]

  const visitsMonth = visitsMonthRes.count ?? 0
  const toDay = (iso: string) => new Date(iso).toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })

  const visitsRaw: RawEvent[] = (visitsRawRes.data ?? []).map(r => ({ date: r.created_at, utm: r.utm_source, referer: r.referer }))
  const checkoutsRaw: RawEvent[] = (pixRes.data ?? [])
    .filter(r => toDay(r.created_at) >= toDay(monthISO))
    .map(r => ({ date: r.created_at, utm: r.utm_source }))
  const confirmedRows = (pixRes.data ?? []).filter(p => p.status === 'confirmed')

  // Comparação: últimos 30 dias vs. 30 dias anteriores
  const confInWindow = (start: string, end: string) =>
    confirmedRows.filter(c => c.created_at >= start && c.created_at < end)
  const sumRev = (rows: typeof confirmedRows) => rows.reduce((s, c) => s + rowValue(c), 0)
  const curConf = confInWindow(monthISO, nowISO)
  const prevConf = confInWindow(prevMonthISO, monthISO)
  const curViews = visitsMonthRes.count ?? 0
  const prevViews = visitsPrevRes.count ?? 0
  const cur = { views: curViews, conv: curConf.length, rev: sumRev(curConf), rate: curViews > 0 ? (curConf.length / curViews) * 100 : 0 }
  const prev = { views: prevViews, conv: prevConf.length, rev: sumRev(prevConf), rate: prevViews > 0 ? (prevConf.length / prevViews) * 100 : 0 }
  const conversionsRaw: RawEvent[] = confirmedRows
    .filter(r => (r.confirmed_at ?? r.created_at) >= monthISO)
    .map(r => ({ date: r.confirmed_at ?? r.created_at, utm: r.utm_source }))

  const adConversionsRaw: RawConversion[] = (pixRes.data ?? [])
    .filter(r => r.status === 'confirmed' && (r.utm_term || r.utm_content))
    .map(r => ({ date: r.confirmed_at ?? r.created_at, adset: r.utm_term ?? null, ad: r.utm_content ?? null }))

  // UTM breakdown
  const utmCounts: Record<string, number> = {}
  for (const e of visitsRaw) {
    const src = normVisitSrc(e.utm, e.referer)
    utmCounts[src] = (utmCounts[src] ?? 0) + 1
  }
  const utmBreakdown = Object.entries(utmCounts).sort((a, b) => b[1] - a[1])

  // Ad breakdown
  const adVisits: Record<string, number> = {}
  for (const r of visitsRawRes.data ?? []) {
    if (r.utm_content) adVisits[r.utm_content] = (adVisits[r.utm_content] ?? 0) + 1
  }
  const adConversions: Record<string, number> = {}
  for (const p of pixRes.data ?? []) {
    if (p.utm_content && p.status === 'confirmed' && toDay(p.created_at) >= toDay(monthISO)) {
      adConversions[p.utm_content] = (adConversions[p.utm_content] ?? 0) + 1
    }
  }
  const adBreakdown = Object.entries(
    Object.fromEntries(
      [...new Set([...Object.keys(adVisits), ...Object.keys(adConversions)])].map(ad => [
        ad,
        { visits: adVisits[ad] ?? 0, conversions: adConversions[ad] ?? 0 },
      ])
    )
  ).sort((a, b) => b[1].conversions - a[1].conversions || b[1].visits - a[1].visits)

  // Acessos até a conversão (visit_count gravado no checkout) — filtrado pelo período
  const visitCountsRaw = curConf
    .map(r => (r as { visit_count?: number | null }).visit_count)
    .filter((v): v is number => v != null && v > 0)
  const missingVisitData = curConf.length - visitCountsRaw.length
  const visitBuckets: { label: string; conversions: number }[] = (() => {
    const b: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6+': 0 }
    for (const v of visitCountsRaw) b[v >= 6 ? '6+' : String(v)]++
    return Object.entries(b).map(([label, conversions]) => ({ label, conversions }))
  })()
  const visitSorted = [...visitCountsRaw].sort((a, b) => a - b)
  const avgVisits = visitSorted.length ? visitSorted.reduce((a, b) => a + b, 0) / visitSorted.length : 0
  const medianVisits = visitSorted.length
    ? (visitSorted.length % 2 ? visitSorted[(visitSorted.length - 1) / 2] : (visitSorted[visitSorted.length / 2 - 1] + visitSorted[visitSorted.length / 2]) / 2)
    : 0
  const firstVisitConv = visitBuckets.find(b => b.label === '1')?.conversions ?? 0
  const maxBucket = Math.max(1, ...visitBuckets.map(b => b.conversions))

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      {/* Seletor de período — filtra toda a página */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <PeriodSelector />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {dbErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 space-y-1">
            <p className="font-bold">Erro ao carregar dados:</p>
            {dbErrors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {/* Resumo */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: `Visitas /ebook (${periodLabel})`, value: visitsMonth },
            { label: 'Visitas totais (histórico)', value: visitsTotalRes.count ?? 0 },
            { label: 'Cobranças geradas (total)', value: pixRes.data?.length ?? 0 },
            { label: 'Confirmadas (total)', value: confirmedRows.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex-1 min-w-[160px]">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-black text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Comparação de período */}
        <div>
          <SectionHeader title={`${periodLabel} vs. ${periodLabel} anteriores`} />
          <div className="flex gap-4 flex-wrap">
            <CompareCard label="Visitas /ebook" cur={cur.views} prev={prev.views} />
            <CompareCard label="Conversões" cur={cur.conv} prev={prev.conv} />
            <CompareCard label="Taxa de conversão" cur={cur.rate} prev={prev.rate} format={n => `${Math.round(n * 100) / 100}%`} />
            <CompareCard label="Faturamento" cur={cur.rev} prev={prev.rev} format={n => `R$ ${Math.round(n).toLocaleString('pt-BR')}`} />
          </div>
        </div>

        {/* Gráficos de tendência */}
        <div>
          <SectionHeader title="Tendência — /ebook" />
          <TrafficChart visits={visitsRaw} checkouts={checkoutsRaw} conversions={conversionsRaw} days={rangeDays} />
        </div>

        {/* Conversões por adset · ad */}
        {adConversionsRaw.length > 0 && (
          <div>
            <SectionHeader title="Conversões por adset · anúncio" />
            <AdPerformanceChart conversions={adConversionsRaw} days={rangeDays} />
          </div>
        )}

        {/* Origens & Anúncios */}
        {(utmBreakdown.length > 0 || adBreakdown.length > 0) && (
          <div>
            <SectionHeader title={`Origens & anúncios — ${periodLabel}`} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {utmBreakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-base">
                    <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
                      <tr>
                        <th className="text-left px-4 py-3">Origem</th>
                        <th className="text-right px-4 py-3">Visitas</th>
                        <th className="text-right px-4 py-3 text-gray-400">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {utmBreakdown.map(([src, count]) => (
                        <tr key={src} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3"><OriginBadge row={{ utm_source: src === 'direto' ? undefined : src }} /></td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{count}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-sm">
                            {visitsMonth > 0 ? Math.round((count / visitsMonth) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {adBreakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-base">
                    <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
                      <tr>
                        <th className="text-left px-4 py-3">Anúncio (utm_content)</th>
                        <th className="text-right px-4 py-3">Visitas</th>
                        <th className="text-right px-4 py-3">Vendas</th>
                        <th className="text-right px-4 py-3 text-gray-400">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {adBreakdown.map(([ad, { visits, conversions }]) => (
                        <tr key={ad} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium max-w-xs truncate" title={ad}>{ad}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{visits}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#1b4332]">{conversions}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-sm">
                            {visits > 0 ? Math.round((conversions / visits) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acessos até a conversão */}
        <div>
          <SectionHeader title="Acessos até a conversão" />
          {visitCountsRaw.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500">
              Ainda sem dados de acessos por compra. A partir de agora cada compra registra quantos acessos o comprador teve até converter.
              {missingVisitData > 0 && ` (${missingVisitData} compras anteriores à instrumentação não têm o dado.)`}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 grid grid-cols-2 gap-4 content-start">
                {[
                  { label: 'Média de acessos', value: Math.round(avgVisits * 10) / 10 },
                  { label: 'Mediana', value: medianVisits },
                  { label: 'Converteram na 1ª visita', value: `${firstVisitConv} (${Math.round((firstVisitConv / visitCountsRaw.length) * 100)}%)` },
                  { label: 'Sem dado (histórico)', value: missingVisitData },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-xl font-black text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-base">
                  <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
                    <tr>
                      <th className="text-left px-4 py-3">Acessos até comprar</th>
                      <th className="text-left px-4 py-3 w-1/2">Conversões</th>
                      <th className="text-right px-4 py-3 text-gray-400">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visitBuckets.map(({ label, conversions }) => (
                      <tr key={label} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-semibold text-gray-700">{label === '6+' ? '6 ou mais' : label}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 rounded-full bg-[#52b788]" style={{ width: `${Math.max(4, (conversions / maxBucket) * 100)}%` }} />
                            <span className="text-sm font-bold text-gray-800">{conversions}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 text-sm">
                          {Math.round((conversions / visitCountsRaw.length) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
