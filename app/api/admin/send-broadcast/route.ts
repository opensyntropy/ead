import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmailHtml, buildPlainEmailHtml, firstName, personalize, htmlToText, withUnsubscribeLink, fillUnsubscribeLink } from '@/lib/broadcast-template'
import { unsubscribePageUrl, unsubscribeOneClickUrl } from '@/lib/unsubscribe'

const resend = new Resend(process.env.RESEND_API_KEY)

// A personal sender (not "nao-responda@") invites replies, which mailbox
// providers read as a sign the email is wanted.
const FROM = process.env.NODE_ENV === 'production'
  ? process.env.BROADCAST_FROM?.trim() || 'Michel Bottan <michel@opensyntropy.earth>'
  : 'Michel Bottan <onboarding@resend.dev>'

const REPLY_TO = process.env.BROADCAST_REPLY_TO?.trim() || undefined

const SAMPLE_NAME = 'Maria'

function buildMessage(subject: string, html: string, name: string, to: string) {
  const personalHtml = fillUnsubscribeLink(personalize(html, name), unsubscribePageUrl(to))
  return {
    subject: personalize(subject, name, false),
    html: personalHtml,
    text: htmlToText(personalHtml),
    ...(REPLY_TO && { replyTo: REPLY_TO }),
    // One-click unsubscribe (RFC 8058): Gmail/Outlook show their own
    // "Cancelar inscrição" button instead of users hitting "Denunciar spam".
    headers: {
      'List-Unsubscribe': `<${unsubscribeOneClickUrl(to)}>${REPLY_TO ? `, <mailto:${REPLY_TO}?subject=Descadastrar>` : ''}`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

// Recipients Resend already accepted an email with one of these exact
// subjects, so a resend after a partial failure doesn't hit the same people twice. Built
// up front from the account's send log, 100 emails per request, paced well
// under the 10 req/s limit.
async function alreadySentTo(subjects: string[]): Promise<Set<string>> {
  const sent = new Set<string>()
  let after: string | undefined
  for (let page = 0; page < 100; page++) {
    let res = await resend.emails.list({ limit: 100, ...(after && { after }) })
    for (let attempt = 1; res.error?.name === 'rate_limit_exceeded' && attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 1000 * attempt))
      res = await resend.emails.list({ limit: 100, ...(after && { after }) })
    }
    const { data, error } = res
    if (error) throw new Error(`Resend: ${error.message}`)
    for (const e of data.data) {
      if (subjects.includes(e.subject?.trim() ?? '')) for (const to of e.to) sent.add(to.toLowerCase().trim())
    }
    if (!data.has_more || data.data.length === 0) break
    after = data.data[data.data.length - 1].id
    await new Promise(r => setTimeout(r, 250))
  }
  return sent
}

export async function POST(req: NextRequest) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
  }

  const body = await req.json() as {
    subject: string
    body: string
    filter: 'all' | 'product'
    product?: string
    preview?: boolean
    useTemplate?: boolean
    testTo?: string
    excludeSubjects?: string[]
    dryRun?: boolean
  }

  const { subject, body: bodyHtml, filter, product, preview, useTemplate = true, testTo, excludeSubjects = [], dryRun } = body

  // dryRun only computes the recipient list, so it needs no content
  if (!dryRun && !subject?.trim()) return NextResponse.json({ message: 'Assunto obrigatório.' }, { status: 400 })
  if (!dryRun && !bodyHtml?.trim()) return NextResponse.json({ message: 'Conteúdo obrigatório.' }, { status: 400 })

  const html = dryRun ? '' : withUnsubscribeLink(useTemplate ? buildEmailHtml(subject, bodyHtml) : buildPlainEmailHtml(bodyHtml))

  if (preview) {
    return NextResponse.json({ html: fillUnsubscribeLink(personalize(html, SAMPLE_NAME), '#') })
  }

  // Test send: only to the given address, regardless of environment
  if (testTo !== undefined) {
    const to = testTo.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ message: 'Email de teste inválido.' }, { status: 400 })
    }
    // Use the buyer's real name when the test address is a customer, else a sample
    const service = await createServiceClient()
    const { data: rows } = await service
      .from('pix_charges')
      .select('name')
      .ilike('email', to)
      .not('name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    const name = firstName(rows?.[0]?.name) || SAMPLE_NAME
    const msg = buildMessage(subject, html, name, to)
    const { error } = await resend.emails.send({ from: FROM, to, ...msg, subject: `Teste: ${msg.subject}` })
    if (error) return NextResponse.json({ message: `Falha ao enviar teste: ${error.message}` }, { status: 500 })
    return NextResponse.json({ message: `Email de teste enviado para ${to} ({{nome}} = "${name}").`, sent: 1 })
  }

  // Collect recipient emails
  const service = await createServiceClient()

  let query = service
    .from('pix_charges')
    .select('email, name')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('product', product ?? 'ebook')
  const { data: pixRows } = await query

  // email → first name, taking the most recent charge that has a name
  const names = new Map<string, string>()
  for (const r of pixRows ?? []) {
    const email = r.email?.toLowerCase().trim()
    if (!email) continue
    if (!names.get(email)) names.set(email, firstName(r.name))
  }
  const { data: unsubRows } = await service.from('email_unsubscribes').select('email')
  const unsubscribed = new Set((unsubRows ?? []).map(r => r.email))
  let alreadySent = new Set<string>()
  const subjects = excludeSubjects.map(x => x.trim()).filter(Boolean)
  if (subjects.length > 0) {
    try {
      alreadySent = await alreadySentTo(subjects)
    } catch (e) {
      return NextResponse.json({ message: `Não foi possível consultar os envios anteriores: ${(e as Error).message}` }, { status: 502 })
    }
    if (alreadySent.size === 0) {
      return NextResponse.json({ message: 'Nenhum envio anterior encontrado com esses assuntos.' }, { status: 400 })
    }
  }
  const emails = [...names.keys()].filter(e => !unsubscribed.has(e) && !alreadySent.has(e))
  const skipped = names.size - emails.length

  if (dryRun) return NextResponse.json({ count: emails.length, emails, skipped })

  if (emails.length === 0) {
    return NextResponse.json({ message: 'Nenhum destinatário encontrado.', sent: 0 })
  }

  // In dev, send only to admin
  const recipients = process.env.NODE_ENV === 'production'
    ? emails
    : ['devops@opensyntropy.earth']

  let sent = 0
  const errors: string[] = []

  // Resend allows 10 requests/s; firing emails individually in parallel blew
  // past it and ~half the sends got 429. The batch API takes up to 100 emails
  // per request, so even large lists need only a handful of requests.
  const BATCH = 100
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH)
    const payload = chunk.map(to => ({ from: FROM, to, ...buildMessage(subject, html, names.get(to) ?? '', to) }))

    for (let attempt = 1; ; attempt++) {
      const { data, error } = await resend.batch.send(payload, { batchValidation: 'permissive' })
      if (error) {
        if (error.name === 'rate_limit_exceeded' && attempt < 5) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
          continue
        }
        errors.push(...chunk.map(to => `${to}: ${error.message}`))
        break
      }
      const failed = data.errors ?? []
      for (const e of failed) errors.push(`${chunk[e.index]}: ${e.message}`)
      sent += chunk.length - failed.length
      break
    }

    if (i + BATCH < recipients.length) await new Promise(r => setTimeout(r, 250))
  }

  if (errors.length > 0) console.error('[send-broadcast] falhas:', errors)

  if (errors.length > 0 && sent === 0) {
    return NextResponse.json({ message: `Falha ao enviar: ${errors[0]}` }, { status: 500 })
  }

  const message = errors.length > 0
    ? `Enviado para ${sent} destinatário(s). ${errors.length} falha(s) — ex.: ${errors[0]}`
    : `Email enviado com sucesso para ${sent} destinatário(s)!`
  const skippedNote = skipped > 0 ? ` ${skipped} ignorado(s) (já receberam ou se descadastraram).` : ''

  return NextResponse.json({ message: message + skippedNote, sent })
}
