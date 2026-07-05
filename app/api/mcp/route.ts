import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, fetchFunnelData, fetchUnpaidData, fetchBySourceData, toSpDay, toSpHour, pct, PRODUCT_PRICE, rowValue } from '@/lib/analytics'

// MCP server via Streamable HTTP (protocol 2025-03-26)
// Stateless — cada POST é uma chamada independente, sem sessão SSE

const SERVER_INFO = { name: 'ebook-analytics', version: '1.0.0' }
const PROTOCOL    = '2025-03-26'

const TOOLS = [
  {
    name: 'analytics_funnel',
    description: 'Retorna métricas diárias do funil de conversão do ebook: pageviews, cliques, cobranças geradas (PIX e cartão separados), pagamentos confirmados, faturamento, ticket médio, taxas de conversão entre etapas e split por versão da página (normal vs. retorno).',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Data inicial YYYY-MM-DD (fuso horário São Paulo)' },
        to:   { type: 'string', description: 'Data final YYYY-MM-DD (fuso horário São Paulo, inclusivo)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'analytics_unpaid',
    description: 'Retorna cobranças geradas e não concluídas no período, separadas por método: PIX (pendentes, expirados, tempo médio até confirmação) e cartão (confirmados, recusados com motivo).',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Data inicial YYYY-MM-DD' },
        to:   { type: 'string', description: 'Data final YYYY-MM-DD (inclusivo)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'analytics_hourly',
    description: 'Retorna o funil de conversão agregado hora a hora (fuso São Paulo): pageviews, cliques no checkout, cobranças geradas, pagamentos confirmados, faturamento e taxa de conversão por hora. Útil para identificar os horários de maior conversão.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Data inicial YYYY-MM-DD (fuso horário São Paulo)' },
        to:   { type: 'string', description: 'Data final YYYY-MM-DD (fuso horário São Paulo, inclusivo)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'analytics_conversions_by_visits',
    description: 'Retorna a distribuição de quantos acessos à página do ebook cada comprador teve até converter (contador ebook_visits gravado no momento do checkout). Inclui histograma por nº de acessos, média/mediana e quantas compras não têm o dado (cobranças anteriores à instrumentação).',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Data inicial YYYY-MM-DD' },
        to:   { type: 'string', description: 'Data final YYYY-MM-DD (inclusivo)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'analytics_by_source',
    description: 'Retorna o funil de conversão agrupado por utm_source / utm_campaign: pageviews, cliques, cobranças, vendas, faturamento e taxa de conversão por origem de tráfego.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Data inicial YYYY-MM-DD' },
        to:   { type: 'string', description: 'Data final YYYY-MM-DD (inclusivo)' },
      },
      required: ['from', 'to'],
    },
  },
]

type JsonRpcRequest = { jsonrpc: '2.0'; id: number | string | null; method: string; params?: Record<string, unknown> }

function ok(id: JsonRpcRequest['id'], result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function err(id: JsonRpcRequest['id'], code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })
}

async function callFunnel(args: Record<string, string>) {
  const { from, to } = args
  const { visits, clicks, charges } = await fetchFunnelData(from, to)
  const days = new Set<string>()
  visits.forEach(r => days.add(toSpDay(r.created_at)))
  clicks.forEach(r => days.add(toSpDay(r.created_at)))
  charges.forEach(r => days.add(toSpDay(r.created_at)))

  const result = Array.from(days).sort().map(date => {
    const dv = visits.filter(r => toSpDay(r.created_at) === date)
    const dc = clicks.filter(r => toSpDay(r.created_at) === date)
    const dh = charges.filter(r => toSpDay(r.created_at) === date)
    const cf = dh.filter(r => r.status === 'confirmed')
    const pageviews = dv.length
    const checkout_clicks = dc.length
    const charges_pix  = dh.filter(r => r.payment_method === 'pix').length
    const charges_card = dh.filter(r => r.payment_method === 'card').length
    const confirmed_pix  = cf.filter(r => r.payment_method === 'pix').length
    const confirmed_card = cf.filter(r => r.payment_method === 'card').length
    const confirmed_total = cf.length
    const charges_total = dh.length
    const revenue = cf.reduce((s, r) => s + (rowValue(r)), 0)
    const visitors_normal    = dv.filter(r => r.page_version !== 'returning').length
    const visitors_returning = dv.filter(r => r.page_version === 'returning').length
    const purchases_normal    = cf.filter(r => r.page_version !== 'returning').length
    const purchases_returning = cf.filter(r => r.page_version === 'returning').length
    return {
      date, pageviews, checkout_clicks, charges_pix, charges_card, charges_total,
      confirmed_pix, confirmed_card, confirmed_total,
      revenue: Math.round(revenue * 100) / 100,
      avg_ticket: confirmed_total > 0 ? Math.round((revenue / confirmed_total) * 100) / 100 : 0,
      rate_view_to_click:     pct(checkout_clicks, pageviews),
      rate_click_to_charge:   pct(charges_total, checkout_clicks),
      rate_charge_to_confirm: pct(confirmed_total, charges_total),
      rate_view_to_confirm:   pct(confirmed_total, pageviews),
      by_page_version: {
        normal:    { purchases: purchases_normal,    visitors: visitors_normal,    conversion_rate: pct(purchases_normal,    visitors_normal) },
        returning: { purchases: purchases_returning, visitors: visitors_returning, conversion_rate: pct(purchases_returning, visitors_returning) },
      },
    }
  })
  const totals = result.reduce((a, d) => ({
    pageviews: a.pageviews + d.pageviews, checkout_clicks: a.checkout_clicks + d.checkout_clicks,
    charges_total: a.charges_total + d.charges_total, confirmed_total: a.confirmed_total + d.confirmed_total,
    revenue: Math.round((a.revenue + d.revenue) * 100) / 100,
  }), { pageviews: 0, checkout_clicks: 0, charges_total: 0, confirmed_total: 0, revenue: 0 })
  return { period: { from, to }, summary: { ...totals, rate_overall: pct(totals.confirmed_total, totals.pageviews) }, days: result }
}

async function callHourly(args: Record<string, string>) {
  const { from, to } = args
  const { visits, clicks, charges } = await fetchFunnelData(from, to)
  const hours = new Set<string>()
  visits.forEach(r => hours.add(toSpHour(r.created_at)))
  clicks.forEach(r => hours.add(toSpHour(r.created_at)))
  charges.forEach(r => hours.add(toSpHour(r.created_at)))

  const result = Array.from(hours).sort().map(hour => {
    const pageviews       = visits.filter(r => toSpHour(r.created_at) === hour).length
    const checkout_clicks = clicks.filter(r => toSpHour(r.created_at) === hour).length
    const hc = charges.filter(r => toSpHour(r.created_at) === hour)
    const cf = hc.filter(r => r.status === 'confirmed')
    const revenue = cf.reduce((s, r) => s + rowValue(r), 0)
    return {
      hour,
      pageviews, checkout_clicks,
      charges_total: hc.length,
      confirmed_total: cf.length,
      revenue: Math.round(revenue * 100) / 100,
      rate_view_to_confirm: pct(cf.length, pageviews),
    }
  })

  // Perfil por hora-do-dia (0-23), agregando todos os dias do período
  const byHourOfDay: Record<number, { pageviews: number; confirmed: number; revenue: number }> = {}
  for (let h = 0; h < 24; h++) byHourOfDay[h] = { pageviews: 0, confirmed: 0, revenue: 0 }
  for (const r of visits) byHourOfDay[Number(toSpHour(r.created_at).slice(11, 13))].pageviews++
  for (const r of charges) if (r.status === 'confirmed') {
    const h = Number(toSpHour(r.created_at).slice(11, 13))
    byHourOfDay[h].confirmed++
    byHourOfDay[h].revenue += rowValue(r)
  }
  const hour_of_day_profile = Object.entries(byHourOfDay).map(([h, v]) => ({
    hour: Number(h),
    pageviews: v.pageviews,
    confirmed: v.confirmed,
    revenue: Math.round(v.revenue * 100) / 100,
    conversion_rate: pct(v.confirmed, v.pageviews),
  }))

  return { period: { from, to }, hours: result, hour_of_day_profile }
}

async function callConversionsByVisits(args: Record<string, string>) {
  const { from, to } = args
  const { charges } = await fetchFunnelData(from, to)
  const confirmed = charges.filter(r => r.status === 'confirmed')
  const withData = confirmed.filter(r => r.visit_count != null).map(r => r.visit_count as number)
  const missing  = confirmed.length - withData.length

  const histogram: Record<number, number> = {}
  for (const v of withData) histogram[v] = (histogram[v] ?? 0) + 1
  const distribution = Object.entries(histogram)
    .map(([visits, count]) => ({ visits: Number(visits), conversions: count }))
    .sort((a, b) => a.visits - b.visits)

  const sorted = [...withData].sort((a, b) => a - b)
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null
  const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null

  return {
    period: { from, to },
    summary: {
      confirmed_total: confirmed.length,
      with_visit_data: withData.length,
      missing_visit_data: missing,
      avg_visits_to_convert: avg != null ? Math.round(avg * 10) / 10 : null,
      median_visits_to_convert: median,
      converted_on_first_visit: histogram[1] ?? 0,
    },
    distribution,
  }
}

async function callUnpaid(args: Record<string, string>) {
  const { from, to } = args
  const { charges, failed } = await fetchUnpaidData(from, to)
  const now = Date.now()
  const days = new Set<string>()
  charges.forEach(r => days.add(toSpDay(r.created_at)))
  failed.forEach(r => days.add(toSpDay(r.created_at)))

  const result = Array.from(days).sort().map(date => {
    const dh = charges.filter(r => toSpDay(r.created_at) === date)
    const df = failed.filter(r => toSpDay(r.created_at) === date)
    const pixAll = dh.filter(r => r.payment_method === 'pix')
    const pixConfirmed = pixAll.filter(r => r.status === 'confirmed')
    const pixPending   = pixAll.filter(r => r.status === 'pending')
    const pixExpired   = pixAll.filter(r => r.status === 'expired')
    const pixPendingLong = pixPending.filter(r => (now - new Date(r.created_at).getTime()) > 86400000)
    const times = pixConfirmed.filter(r => r.confirmed_at).map(r => (new Date(r.confirmed_at).getTime() - new Date(r.created_at).getTime()) / 3600000)
    const cardAll = dh.filter(r => r.payment_method === 'card')
    const decline_reasons: Record<string, number> = {}
    for (const f of df) { const k = f.reason ?? 'desconhecido'; decline_reasons[k] = (decline_reasons[k] ?? 0) + 1 }
    return {
      date,
      pix: { generated: pixAll.length, confirmed: pixConfirmed.length, pending: pixPending.length - pixPendingLong.length, expired: pixExpired.length + pixPendingLong.length, avg_hours_to_confirm: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10 : null },
      card: { generated: cardAll.length, confirmed: cardAll.filter(r => r.status === 'confirmed').length, declined: df.length, decline_reasons: Object.keys(decline_reasons).length ? decline_reasons : undefined },
    }
  })
  const summary = result.reduce((a, d) => ({ pix_generated: a.pix_generated + d.pix.generated, pix_confirmed: a.pix_confirmed + d.pix.confirmed, pix_expired: a.pix_expired + d.pix.expired, card_generated: a.card_generated + d.card.generated, card_confirmed: a.card_confirmed + d.card.confirmed, card_declined: a.card_declined + d.card.declined }), { pix_generated: 0, pix_confirmed: 0, pix_expired: 0, card_generated: 0, card_confirmed: 0, card_declined: 0 })
  return { period: { from, to }, summary, days: result }
}

async function callBySource(args: Record<string, string>) {
  const { from, to } = args
  const { visits, clicks, charges } = await fetchBySourceData(from, to)
  type Row = { source: string; campaign: string | null; pageviews: number; checkout_clicks: number; charges_generated: number; payments_confirmed: number; revenue: number }
  const map: Record<string, Row> = {}
  const key = (r: { utm_source?: string | null; utm_campaign?: string | null }) => {
    const s = r.utm_source ?? 'direto'; const c = r.utm_campaign ?? ''; return c ? `${s}/${c}` : s
  }
  const ensure = (r: { utm_source?: string | null; utm_campaign?: string | null }) => {
    const k = key(r); if (!map[k]) map[k] = { source: r.utm_source ?? 'direto', campaign: r.utm_campaign ?? null, pageviews: 0, checkout_clicks: 0, charges_generated: 0, payments_confirmed: 0, revenue: 0 }; return map[k]
  }
  for (const r of visits)  ensure(r).pageviews++
  for (const r of clicks)  ensure(r).checkout_clicks++
  for (const r of charges) { ensure(r).charges_generated++; if (r.status === 'confirmed') { ensure(r).payments_confirmed++; ensure(r).revenue += rowValue(r) } }
  return { period: { from, to }, sources: Object.values(map).map(r => ({ ...r, revenue: Math.round(r.revenue * 100) / 100, conversion_rate: pct(r.payments_confirmed, r.pageviews) })).sort((a, b) => b.payments_confirmed - a.payments_confirmed) }
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
}

function cors(res: NextResponse): NextResponse {
  Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

function unauthorized() {
  return cors(new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Bearer realm="${BASE}", error="unauthorized"` },
  }))
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function DELETE() {
  // MCP session close — stateless, nada a limpar
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()

  let body: JsonRpcRequest
  try { body = await req.json() } catch { return cors(err(null, -32700, 'Parse error')) }

  const { id, method, params = {} } = body

  if (method === 'initialize') {
    return cors(ok(id, { protocolVersion: PROTOCOL, capabilities: { tools: {} }, serverInfo: SERVER_INFO }))
  }

  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 204, headers: CORS })
  }

  if (method === 'tools/list') {
    return cors(ok(id, { tools: TOOLS }))
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params as { name: string; arguments: Record<string, string> }
    try {
      let data: unknown
      if (name === 'analytics_funnel')                    data = await callFunnel(args)
      else if (name === 'analytics_hourly')               data = await callHourly(args)
      else if (name === 'analytics_conversions_by_visits') data = await callConversionsByVisits(args)
      else if (name === 'analytics_unpaid')               data = await callUnpaid(args)
      else if (name === 'analytics_by_source')            data = await callBySource(args)
      else return cors(err(id, -32602, `Tool desconhecida: ${name}`))
      return cors(ok(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }))
    } catch (e) {
      return cors(err(id, -32603, e instanceof Error ? e.message : 'Erro interno'))
    }
  }

  return cors(err(id, -32601, `Method not found: ${method}`))
}

// GET: health-check / discovery
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()
  return cors(NextResponse.json({ server: SERVER_INFO, protocol: PROTOCOL, tools: TOOLS.map(t => t.name) }))
}
