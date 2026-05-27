import crypto from 'crypto'

const PIXEL_ID = '1292728729653308'

function hashEmail(email: string) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

export async function sendPurchaseEvent({
  email,
  value,
  currency = 'BRL',
  eventId,
}: {
  email: string
  value: number
  currency?: string
  eventId?: string
}) {
  const token = process.env.META_PIXEL_ACCESS_TOKEN
  if (!token) {
    console.warn('[meta-pixel] META_PIXEL_ACCESS_TOKEN não configurado — CAPI ignorada')
    return
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: eventId,
          user_data: { em: [hashEmail(email)] },
          custom_data: { currency, value },
        }],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[meta-pixel] CAPI error:', err)
  }
}
