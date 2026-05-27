import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TrafficChart, { type RawEvent } from '../TrafficChart'
import AdminHeader from '../AdminHeader'
import { AB_TESTS } from '@/config/ab-tests'

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

function OriginBadge({ row }: { row?: { utm_source?: string | null } }) {
  if (!row?.utm_source) return <span className="text-gray-300 text-xs">direto</span>
  const srcColors: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    google: 'bg-yellow-100 text-yellow-700',
    email: 'bg-purple-100 text-purple-700',
  }
  const cls = srcColors[row.utm_source.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {row.utm_source}
    </span>
  )
}

export default async function RelatoriosPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()
  const monthISO = new Date(Date.now() - 30 * 86400000).toISOString()

  const [visitsMonthRes, visitsRawRes, pixRes, abRes] = await Promise.all([
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', monthISO),
    service.from('page_visits').select('created_at,utm_source,utm_content,referer').eq('page', '/ebook').gte('created_at', monthISO),
    service.from('pix_charges').select('*').order('created_at', { ascending: false }),
    service.from('page_visits').select('ab_variant').eq('page', '/ebook/checkout').gte('created_at', monthISO).not('ab_variant', 'is', null),
  ])

  const visitsMonth = visitsMonthRes.count ?? 0
  const toDay = (iso: string) => new Date(iso).toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })

  const visitsRaw: RawEvent[] = (visitsRawRes.data ?? []).map(r => ({ date: r.created_at, utm: r.utm_source, referer: r.referer }))
  const checkoutsRaw: RawEvent[] = (pixRes.data ?? [])
    .filter(r => toDay(r.created_at) >= toDay(monthISO))
    .map(r => ({ date: r.created_at, utm: r.utm_source }))
  const confirmedRows = (pixRes.data ?? []).filter(p => p.status === 'confirmed')
  const conversionsRaw: RawEvent[] = confirmedRows
    .filter(r => (r.confirmed_at ?? r.created_at) >= monthISO)
    .map(r => ({ date: r.confirmed_at ?? r.created_at, utm: r.utm_source }))

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

  // A/B
  const abReach: Record<string, Record<string, number>> = {}
  for (const r of abRes.data ?? []) {
    if (!r.ab_variant) continue
    const colonIdx = r.ab_variant.indexOf(':')
    if (colonIdx < 0) continue
    const testId = r.ab_variant.slice(0, colonIdx)
    const variant = r.ab_variant.slice(colonIdx + 1)
    if (!abReach[testId]) abReach[testId] = {}
    abReach[testId][variant] = (abReach[testId][variant] ?? 0) + 1
  }
  const abConv: Record<string, Record<string, number>> = {}
  for (const p of pixRes.data ?? []) {
    if (p.status !== 'confirmed' || !p.ab_variant) continue
    const colonIdx = p.ab_variant.indexOf(':')
    if (colonIdx < 0) continue
    const testId = p.ab_variant.slice(0, colonIdx)
    const variant = p.ab_variant.slice(colonIdx + 1)
    if (!abConv[testId]) abConv[testId] = {}
    abConv[testId][variant] = (abConv[testId][variant] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Gráficos de tendência */}
        <div>
          <SectionHeader title="Tendência — /ebook" />
          <TrafficChart visits={visitsRaw} checkouts={checkoutsRaw} conversions={conversionsRaw} />
        </div>

        {/* Origens & Anúncios */}
        {(utmBreakdown.length > 0 || adBreakdown.length > 0) && (
          <div>
            <SectionHeader title="Origens & anúncios — 30 dias" />
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

        {/* Testes A/B */}
        <div id="ab-test" className="space-y-6">
          {AB_TESTS.map(test => {
            const reach = abReach[test.id] ?? {}
            const conv = abConv[test.id] ?? {}
            const total = Object.values(reach).reduce((s, n) => s + n, 0)
            return (
              <div key={test.id}>
                <SectionHeader title={`Teste A/B — ${test.name} (30 dias)`} />
                {total === 0 ? (
                  <p className="text-gray-400 text-sm">Sem dados ainda — aguardando visitantes chegarem à seção de checkout.</p>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-base">
                      <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
                        <tr>
                          <th className="text-left px-4 py-3">Variante</th>
                          <th className="text-right px-4 py-3">Checkout</th>
                          <th className="text-right px-4 py-3">Vendas</th>
                          <th className="text-right px-4 py-3 text-gray-400">Conv.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(test.variants).map(([variantId, label]) => {
                          const r = reach[variantId] ?? 0
                          const c = conv[variantId] ?? 0
                          return (
                            <tr key={variantId} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3">
                                <span className="font-bold text-gray-800 mr-2">Variante {variantId}</span>
                                <span className="text-sm text-gray-500 italic">&quot;{label}&quot;</span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">{r}</td>
                              <td className="px-4 py-3 text-right font-bold text-[#1b4332]">{c}</td>
                              <td className="px-4 py-3 text-right text-gray-400 text-sm">
                                {r > 0 ? Math.round((c / r) * 100) : 0}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
