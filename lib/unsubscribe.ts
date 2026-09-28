import { createHmac, timingSafeEqual } from 'node:crypto'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

// Signed links, so nobody can unsubscribe someone else by editing the URL.
function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('UNSUBSCRIBE_SECRET/SUPABASE_SERVICE_ROLE_KEY ausente')
  return s
}

function sign(email: string): string {
  return createHmac('sha256', secret()).update(`unsubscribe:${email}`).digest('base64url')
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = Buffer.from(sign(normalizeEmail(email)))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

function query(email: string): string {
  const e = normalizeEmail(email)
  return `e=${encodeURIComponent(e)}&t=${sign(e)}`
}

// Page with a confirm button (link scanners open GETs, so GET never unsubscribes)
export function unsubscribePageUrl(email: string): string {
  return `${BASE_URL}/descadastro?${query(email)}`
}

// RFC 8058 one-click target for the List-Unsubscribe header (POST only)
export function unsubscribeOneClickUrl(email: string): string {
  return `${BASE_URL}/api/unsubscribe?${query(email)}`
}
