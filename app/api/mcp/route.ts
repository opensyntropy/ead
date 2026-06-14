import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, fetchFunnelData, fetchUnpaidData, fetchBySourceData, toSpDay, pct, PRODUCT_PRICE } from '@/lib/analytics'

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
    const revenue = cf.reduce((s, r) => s + (PRODUCT_PRICE[r.product] ?? 87), 0)
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
  for (const r of charges) { ensure(r).charges_generated++; if (r.status === 'confirmed') { ensure(r).payments_confirmed++; ensure(r).revenue += PRODUCT_PRICE[r.product] ?? 87 } }
  return { period: { from, to }, sources: Object.values(map).map(r => ({ ...r, revenue: Math.round(r.revenue * 100) / 100, conversion_rate: pct(r.payments_confirmed, r.pageviews) })).sort((a, b) => b.payments_confirmed - a.payments_confirmed) }
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth'

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Bearer realm="${BASE}", error="unauthorized"` },
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()

  let body: JsonRpcRequest
  try { body = await req.json() } catch { return err(null, -32700, 'Parse error') }

  const { id, method, params = {} } = body

  if (method === 'initialize') {
    return ok(id, { protocolVersion: PROTOCOL, capabilities: { tools: {} }, serverInfo: SERVER_INFO })
  }

  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 204 })
  }

  if (method === 'tools/list') {
    return ok(id, { tools: TOOLS })
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params as { name: string; arguments: Record<string, string> }
    try {
      let data: unknown
      if (name === 'analytics_funnel')    data = await callFunnel(args)
      else if (name === 'analytics_unpaid')    data = await callUnpaid(args)
      else if (name === 'analytics_by_source') data = await callBySource(args)
      else return err(id, -32602, `Tool desconhecida: ${name}`)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })
    } catch (e) {
      return err(id, -32603, e instanceof Error ? e.message : 'Erro interno')
    }
  }

  return err(id, -32601, `Method not found: ${method}`)
}

// GET: responde 200 com capabilities para health-check / discovery
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()
  return NextResponse.json({ server: SERVER_INFO, protocol: PROTOCOL, tools: TOOLS.map(t => t.name) })
}
