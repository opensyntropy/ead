import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, fetchBySourceData, pct, PRODUCT_PRICE } from '@/lib/analytics'

function srcKey(r: { utm_source?: string | null; utm_campaign?: string | null }): string {
  const src = r.utm_source ?? 'direto'
  const cmp = r.utm_campaign ?? ''
  return cmp ? `${src} / ${cmp}` : src
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from e to são obrigatórios (YYYY-MM-DD)' }, { status: 400 })

  const { visits, clicks, charges } = await fetchBySourceData(from, to)

  const map: Record<string, {
    source: string
    campaign: string | null
    pageviews: number
    checkout_clicks: number
    charges_generated: number
    payments_confirmed: number
    revenue: number
  }> = {}

  const ensure = (r: { utm_source?: string | null; utm_campaign?: string | null }) => {
    const key = srcKey(r)
    if (!map[key]) map[key] = {
      source:   r.utm_source   ?? 'direto',
      campaign: r.utm_campaign ?? null,
      pageviews: 0, checkout_clicks: 0, charges_generated: 0, payments_confirmed: 0, revenue: 0,
    }
    return map[key]
  }

  for (const r of visits)  ensure(r).pageviews++
  for (const r of clicks)  ensure(r).checkout_clicks++
  for (const r of charges) {
    ensure(r).charges_generated++
    if (r.status === 'confirmed') {
      ensure(r).payments_confirmed++
      ensure(r).revenue += PRODUCT_PRICE[r.product] ?? 87
    }
  }

  const rows = Object.values(map)
    .map(r => ({
      ...r,
      revenue: Math.round(r.revenue * 100) / 100,
      conversion_rate: pct(r.payments_confirmed, r.pageviews),
    }))
    .sort((a, b) => b.payments_confirmed - a.payments_confirmed || b.pageviews - a.pageviews)

  return NextResponse.json({ period: { from, to }, sources: rows })
}
