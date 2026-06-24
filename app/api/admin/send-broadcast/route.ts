import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.NODE_ENV === 'production'
  ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
  : 'Michel Bottan <onboarding@resend.dev>'

function buildEmailHtml(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif}
    img{max-width:100%;height:auto;border-radius:8px}
    a{color:#476B18}
    p{margin:0 0 16px;color:#1a1a1a;font-size:16px;line-height:1.7}
    h1{color:#1b4332;font-size:22px;margin:0 0 16px}
    h2{color:#1b4332;font-size:18px;margin:0 0 12px}
    ul,ol{color:#1a1a1a;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px}
    blockquote{border-left:3px solid #7DC142;padding:12px 16px;background:#f8f8f4;margin:0 0 16px;border-radius:4px;color:#555}
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">

        <tr>
          <td style="background:#141F0C;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;font-family:Arial,sans-serif">${subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;line-height:1.6">
              Michel Bottan · OpenSyntropy<br>
              Você recebeu este e-mail porque realizou uma compra em opensyntropy.earth
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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
  }

  const { subject, body: bodyHtml, filter, product, preview } = body

  if (!subject?.trim()) return NextResponse.json({ message: 'Assunto obrigatório.' }, { status: 400 })
  if (!bodyHtml?.trim()) return NextResponse.json({ message: 'Conteúdo obrigatório.' }, { status: 400 })

  const html = buildEmailHtml(subject, bodyHtml)

  if (preview) {
    return NextResponse.json({ html })
  }

  // Collect recipient emails
  const service = await createServiceClient()

  let emails: string[] = []

  if (filter === 'all') {
    const { data: pixRows } = await service
      .from('pix_charges')
      .select('email')
      .eq('status', 'confirmed')
    emails = [...new Set((pixRows ?? []).map(r => r.email?.toLowerCase().trim()).filter(Boolean) as string[])]
  } else {
    const { data: pixRows } = await service
      .from('pix_charges')
      .select('email')
      .eq('status', 'confirmed')
      .eq('product', product ?? 'ebook')
    emails = [...new Set((pixRows ?? []).map(r => r.email?.toLowerCase().trim()).filter(Boolean) as string[])]
  }

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
        const { error } = await resend.emails.send({ from: FROM, to, subject, html })
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
