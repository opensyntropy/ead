import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, fetchUnpaidData, toSpDay } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from e to são obrigatórios (YYYY-MM-DD)' }, { status: 400 })

  const { charges, failed } = await fetchUnpaidData(from, to)
  const now = Date.now()

  const days = new Set<string>()
  charges.forEach(r => days.add(toSpDay(r.created_at)))
  failed.forEach(r => days.add(toSpDay(r.created_at)))

  const result = Array.from(days).sort().map(date => {
    const dayCharges = charges.filter(r => toSpDay(r.created_at) === date)
    const dayFailed  = failed.filter(r => toSpDay(r.created_at) === date)

    const pixAll      = dayCharges.filter(r => r.payment_method === 'pix')
    const pixPending  = pixAll.filter(r => r.status === 'pending')
    const pixExpired  = pixAll.filter(r => r.status === 'expired')
    const pixConfirmed = pixAll.filter(r => r.status === 'confirmed')

    // avg hours from creation to confirmation (only confirmed)
    const pixConfirmedTimes = pixConfirmed
      .filter(r => r.confirmed_at)
      .map(r => (new Date(r.confirmed_at).getTime() - new Date(r.created_at).getTime()) / 3600000)
    const pix_avg_hours_to_confirm = pixConfirmedTimes.length > 0
      ? Math.round((pixConfirmedTimes.reduce((a, b) => a + b, 0) / pixConfirmedTimes.length) * 10) / 10
      : null

    // PIX pendentes há mais de 24h são provavelmente expirados não sinalizados
    const pixPendingLong = pixPending.filter(r => (now - new Date(r.created_at).getTime()) > 86400000)

    const cardAll       = dayCharges.filter(r => r.payment_method === 'card')
    const cardPending   = cardAll.filter(r => r.status === 'pending')
    const cardConfirmed = cardAll.filter(r => r.status === 'confirmed')
    const cardDeclined  = dayFailed.length

    const decline_reasons: Record<string, number> = {}
    for (const f of dayFailed) {
      const reason = f.reason ?? 'desconhecido'
      decline_reasons[reason] = (decline_reasons[reason] ?? 0) + 1
    }

    return {
      date,
      pix: {
        generated:  pixAll.length,
        confirmed:  pixConfirmed.length,
        pending:    pixPending.length - pixPendingLong.length,
        expired:    pixExpired.length + pixPendingLong.length,
        avg_hours_to_confirm: pix_avg_hours_to_confirm,
      },
      card: {
        generated: cardAll.length,
        confirmed: cardConfirmed.length,
        pending:   cardPending.length,
        declined:  cardDeclined,
        decline_reasons: Object.keys(decline_reasons).length > 0 ? decline_reasons : undefined,
      },
    }
  })

  const summary = result.reduce((acc, d) => ({
    pix_generated:  acc.pix_generated  + d.pix.generated,
    pix_confirmed:  acc.pix_confirmed  + d.pix.confirmed,
    pix_expired:    acc.pix_expired    + d.pix.expired,
    card_generated: acc.card_generated + d.card.generated,
    card_confirmed: acc.card_confirmed + d.card.confirmed,
    card_declined:  acc.card_declined  + d.card.declined,
  }), { pix_generated: 0, pix_confirmed: 0, pix_expired: 0, card_generated: 0, card_confirmed: 0, card_declined: 0 })

  return NextResponse.json({ period: { from, to }, summary, days: result })
}
