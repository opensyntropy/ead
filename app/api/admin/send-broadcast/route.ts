import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmailHtml, buildPlainEmailHtml, firstName, personalize, htmlToText } from '@/lib/broadcast-template'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.NODE_ENV === 'production'
  ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
  : 'Michel Bottan <onboarding@resend.dev>'

// A monitored address improves deliverability: replies land somewhere and the
// List-Unsubscribe header gives Gmail/Outlook a one-click opt-out.
const REPLY_TO = process.env.BROADCAST_REPLY_TO?.trim() || undefined

const SAMPLE_NAME = 'Maria'

function buildMessage(subject: string, html: string, name: string) {
  const personalHtml = personalize(html, name)
  return {
    subject: personalize(subject, name, false),
    html: personalHtml,
    text: htmlToText(personalHtml),
    ...(REPLY_TO && {
      replyTo: REPLY_TO,
      headers: { 'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=Descadastrar>` },
    }),
  }
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
  }

  const { subject, body: bodyHtml, filter, product, preview, useTemplate = true, testTo } = body

  if (!subject?.trim()) return NextResponse.json({ message: 'Assunto obrigatório.' }, { status: 400 })
  if (!bodyHtml?.trim()) return NextResponse.json({ message: 'Conteúdo obrigatório.' }, { status: 400 })

  const html = useTemplate ? buildEmailHtml(subject, bodyHtml) : buildPlainEmailHtml(bodyHtml)

  if (preview) {
    return NextResponse.json({ html: personalize(html, SAMPLE_NAME) })
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
    const msg = buildMessage(subject, html, name)
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
  const emails = [...names.keys()]

  if (emails.length === 0) {
    return NextResponse.json({ message: 'Nenhum destinatário encontrado.', sent: 0 })
  }

  // In dev, send only to admin
  const recipients = process.env.NODE_ENV === 'production'
    ? emails
    : ['devops@opensyntropy.earth']

  let sent = 0
  const errors: string[] = []

  // Send in batches of 10 to avoid rate limits
  const BATCH = 10
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (to) => {
        const { error } = await resend.emails.send({ from: FROM, to, ...buildMessage(subject, html, names.get(to) ?? '') })
        if (error) errors.push(`${to}: ${error.message}`)
        else sent++
      })
    )
    // Small delay between batches to respect rate limits
    if (i + BATCH < recipients.length) await new Promise(r => setTimeout(r, 500))
  }

  if (errors.length > 0 && sent === 0) {
    return NextResponse.json({ message: `Falha ao enviar: ${errors[0]}` }, { status: 500 })
  }

  const message = errors.length > 0
    ? `Enviado para ${sent} destinatário(s). ${errors.length} falha(s).`
    : `Email enviado com sucesso para ${sent} destinatário(s)!`

  return NextResponse.json({ message, sent })
}
