import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, fetchFunnelData, toSpDay, pct, rowValue } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from e to são obrigatórios (YYYY-MM-DD)' }, { status: 400 })

  const { visits, clicks, charges } = await fetchFunnelData(from, to)

  // collect all days in range
  const days = new Set<string>()
  visits.forEach(r => days.add(toSpDay(r.created_at)))
  clicks.forEach(r => days.add(toSpDay(r.created_at)))
  charges.forEach(r => days.add(toSpDay(r.created_at)))

  const result = Array.from(days).sort().map(date => {
    const dayVisits   = visits.filter(r => toSpDay(r.created_at) === date)
    const dayClicks   = clicks.filter(r => toSpDay(r.created_at) === date)
    const dayCharges  = charges.filter(r => toSpDay(r.created_at) === date)
    const dayConfirmed = dayCharges.filter(r => r.status === 'confirmed')

    const pageviews       = dayVisits.length
    const checkout_clicks = dayClicks.length
    const charges_pix     = dayCharges.filter(r => r.payment_method === 'pix').length
    const charges_card    = dayCharges.filter(r => r.payment_method === 'card').length
    const charges_total   = dayCharges.length
    const confirmed_pix   = dayConfirmed.filter(r => r.payment_method === 'pix').length
    const confirmed_card  = dayConfirmed.filter(r => r.payment_method === 'card').length
    const confirmed_total = dayConfirmed.length

    const revenue = dayConfirmed.reduce((sum, r) => sum + (rowValue(r)), 0)
    const avg_ticket = confirmed_total > 0 ? Math.round((revenue / confirmed_total) * 100) / 100 : 0

    const visitors_normal    = dayVisits.filter(r => r.page_version !== 'returning').length
    const visitors_returning = dayVisits.filter(r => r.page_version === 'returning').length
    const purchases_normal    = dayConfirmed.filter(r => r.page_version !== 'returning').length
    const purchases_returning = dayConfirmed.filter(r => r.page_version === 'returning').length

    return {
      date,
      pageviews,
      checkout_clicks,
      charges_pix,
      charges_card,
      charges_total,
      confirmed_pix,
      confirmed_card,
      confirmed_total,
      revenue,
      avg_ticket,
      rate_view_to_click:   pct(checkout_clicks, pageviews),
      rate_click_to_charge: pct(charges_total, checkout_clicks),
      rate_charge_to_confirm: pct(confirmed_total, charges_total),
      rate_view_to_confirm: pct(confirmed_total, pageviews),
      by_page_version: {
        normal:    { purchases: purchases_normal,    visitors: visitors_normal,    conversion_rate: pct(purchases_normal,    visitors_normal) },
        returning: { purchases: purchases_returning, visitors: visitors_returning, conversion_rate: pct(purchases_returning, visitors_returning) },
      },
    }
  })

  const totals = result.reduce((acc, d) => ({
    pageviews:        acc.pageviews        + d.pageviews,
    checkout_clicks:  acc.checkout_clicks  + d.checkout_clicks,
    charges_total:    acc.charges_total    + d.charges_total,
    confirmed_total:  acc.confirmed_total  + d.confirmed_total,
    revenue:          Math.round((acc.revenue + d.revenue) * 100) / 100,
  }), { pageviews: 0, checkout_clicks: 0, charges_total: 0, confirmed_total: 0, revenue: 0 })

  return NextResponse.json({ period: { from, to }, summary: { ...totals, rate_overall: pct(totals.confirmed_total, totals.pageviews) }, days: result })
}
