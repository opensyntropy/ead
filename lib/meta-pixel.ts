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
  fbc,
  fbp,
}: {
  email: string
  value: number
  currency?: string
  eventId?: string
  fbc?: string | null
  fbp?: string | null
}) {
  const token = process.env.META_PIXEL_ACCESS_TOKEN
  if (!token) {
    console.warn('[meta-pixel] META_PIXEL_ACCESS_TOKEN não configurado — CAPI ignorada')
    return
  }

  const user_data: Record<string, unknown> = { em: [hashEmail(email)] }
  if (fbc) user_data.fbc = fbc
  if (fbp) user_data.fbp = fbp

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
          user_data,
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

export async function sendMetaPageView({
  eventId,
  fbc,
  fbp,
  ip,
  userAgent,
  sourceUrl,
}: {
  eventId: string
  fbc?: string | null
  fbp?: string | null
  ip?: string | null
  userAgent?: string | null
  sourceUrl: string
}) {
  const token = process.env.META_PIXEL_ACCESS_TOKEN
  if (!token) return

  const user_data: Record<string, string> = {}
  if (fbc) user_data.fbc = fbc
  if (fbp) user_data.fbp = fbp
  if (ip) user_data.client_ip_address = ip
  if (userAgent) user_data.client_user_agent = userAgent

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'PageView',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: eventId,
          event_source_url: sourceUrl,
          user_data,
        }],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[meta-pixel] CAPI PageView error:', err)
  }
}
