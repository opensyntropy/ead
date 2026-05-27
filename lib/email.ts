import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

export async function sendDownloadEmail(email: string, token: string) {
  const downloadUrl = `${BASE_URL}/api/download?token=${token}`
  const reenviarUrl = `${BASE_URL}/reenviar`

  const { error: sendError } = await resend.emails.send({
    from: process.env.NODE_ENV === 'production'
      ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
      : 'Michel Bottan <onboarding@resend.dev>',
    to: process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth',
    subject: 'Seu Guia de Introdução à Agrofloresta Sintrópica',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">

        <tr>
          <td style="background:#141F0C;padding:36px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3">
              Guia de Introdução à<br>Agrofloresta Sintrópica
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Olá,
            </p>
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Obrigado pela sua compra. Seu guia está pronto para download.
            </p>
            <p style="margin:0 0 8px;color:#476B18;font-size:13px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase">
              Importante
            </p>
            <p style="margin:0 0 32px;color:#555;font-size:14px;line-height:1.6;padding:16px;background:#f8f8f4;border-left:3px solid #7DC142;border-radius:4px">
              Este link de download é de <strong>uso único</strong>. Após clicar, ele não poderá ser usado novamente. Guarde o PDF em um lugar seguro após baixar.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${downloadUrl}" style="display:inline-block;background:#7DC142;color:#141F0C;font-family:Arial,sans-serif;font-size:17px;font-weight:700;text-decoration:none;padding:18px 40px;border-radius:10px">
                  Baixar meu Guia →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 40px">
            <hr style="border:none;border-top:1px solid #e8e8e0;margin:0 0 28px">
            <p style="margin:0 0 8px;color:#888;font-size:13px;font-family:Arial,sans-serif;line-height:1.6">
              Precisar baixar novamente no futuro? Acesse o link abaixo e informe seu e-mail — enviaremos um novo link:
            </p>
            <p style="margin:0">
              <a href="${reenviarUrl}" style="color:#476B18;font-size:13px;font-family:Arial,sans-serif">${reenviarUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif">
              Michel Bottan · OpenSyntropy<br>
              Você recebeu este e-mail porque realizou uma compra em opensyntropy.earth
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (sendError) throw new Error(`Resend error: ${JSON.stringify(sendError)}`)
}

const CALENDLY_SESSION_URL = 'https://calendly.com/michel-bottan/consultoria-individual-1-hora'

export async function sendSessionPurchaseEmail(email: string, downloadToken: string) {
  const downloadUrl = `${BASE_URL}/api/download?token=${downloadToken}`
  const reenviarUrl = `${BASE_URL}/reenviar`

  const { error: sendError2 } = await resend.emails.send({
    from: process.env.NODE_ENV === 'production'
      ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
      : 'Michel Bottan <onboarding@resend.dev>',
    to: process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth',
    subject: 'Seu Guia + Link para Agendar sua Sessão',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">

        <tr>
          <td style="background:#141F0C;padding:36px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3">
              Ebook + Sessão Individual
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">Olá,</p>
            <p style="margin:0 0 28px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Obrigado pela sua compra. Seu guia está pronto e você já pode agendar sua sessão de 1 hora comigo.
            </p>

            <p style="margin:0 0 8px;color:#476B18;font-size:13px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase">
              1. Baixar o Guia
            </p>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.6;padding:16px;background:#f8f8f4;border-left:3px solid #7DC142;border-radius:4px">
              Este link é de <strong>uso único</strong>. Guarde o PDF após baixar.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr><td align="center">
                <a href="${downloadUrl}" style="display:inline-block;background:#7DC142;color:#141F0C;font-family:Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px">
                  Baixar meu Guia →
                </a>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;color:#476B18;font-size:13px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase">
              2. Agendar a Sessão
            </p>
            <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;line-height:1.6">
              Escolha o melhor horário para você diretamente pelo link abaixo:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${CALENDLY_SESSION_URL}" style="display:inline-block;background:#141F0C;color:#7DC142;font-family:Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px">
                  Agendar minha Sessão →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 40px">
            <hr style="border:none;border-top:1px solid #e8e8e0;margin:0 0 28px">
            <p style="margin:0;color:#888;font-size:13px;font-family:Arial,sans-serif;line-height:1.6">
              Precisa baixar o guia novamente? <a href="${reenviarUrl}" style="color:#476B18">${reenviarUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif">
              Michel Bottan · OpenSyntropy<br>
              Você recebeu este e-mail porque realizou uma compra em opensyntropy.earth
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (sendError2) throw new Error(`Resend error: ${JSON.stringify(sendError2)}`)
}

export async function sendRecoveryEmail(email: string, name: string | null, productName: string, checkoutUrl: string) {
  const greeting = name ? `Olá, ${name.split(' ')[0]},` : 'Olá,'
  const { error } = await resend.emails.send({
    from: process.env.NODE_ENV === 'production'
      ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
      : 'Michel Bottan <onboarding@resend.dev>',
    to: process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth',
    subject: `Você não finalizou sua compra — ${productName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">

        <tr>
          <td style="background:#141F0C;padding:36px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3">
              Falta pouco para finalizar
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">${greeting}</p>
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Você iniciou a compra de <strong>${productName}</strong> mas não chegou a finalizar o pagamento.
            </p>
            <p style="margin:0 0 32px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Se ainda tiver interesse, o botão abaixo leva direto para o checkout:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${checkoutUrl}" style="display:inline-block;background:#7DC142;color:#141F0C;font-family:Arial,sans-serif;font-size:17px;font-weight:700;text-decoration:none;padding:18px 40px;border-radius:10px">
                  Finalizar minha compra →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif">
              Michel Bottan · OpenSyntropy<br>
              Você recebeu este e-mail porque iniciou uma compra em opensyntropy.earth
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

export async function sendPurchaseNotification(buyerEmail: string, productId: string, paymentId: string) {
  const { error: sendError3 } = await resend.emails.send({
    from: process.env.NODE_ENV === 'production'
      ? 'OpenSyntropy <nao-responda@opensyntropy.earth>'
      : 'OpenSyntropy <onboarding@resend.dev>',
    to: 'michel.bottan@gmail.com',
    subject: `Nova venda: ${productId} — ${buyerEmail}`,
    html: `
<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
  <strong>Nova compra confirmada</strong><br><br>
  <strong>Produto:</strong> ${productId}<br>
  <strong>Comprador:</strong> ${buyerEmail}<br>
  <strong>ID Asaas:</strong> ${paymentId}
</p>`,
  })
  if (sendError3) throw new Error(`Resend error: ${JSON.stringify(sendError3)}`)
}

const FROM = process.env.NODE_ENV === 'production'
  ? 'Michel Bottan <nao-responda@opensyntropy.earth>'
  : 'Michel Bottan <onboarding@resend.dev>'

function emailHtml(downloadUrl: string, resendUrl: string, content: {
  tagline: string; title: string; greeting: string; body: string;
  importantLabel: string; importantText: string; btnText: string;
  resendLabel: string; footer: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr>
          <td style="background:#141F0C;padding:36px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <h1 style="margin:12px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3">${content.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">${content.greeting}</p>
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">${content.body}</p>
            <p style="margin:0 0 8px;color:#476B18;font-size:13px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase">${content.importantLabel}</p>
            <p style="margin:0 0 32px;color:#555;font-size:14px;line-height:1.6;padding:16px;background:#f8f8f4;border-left:3px solid #7DC142;border-radius:4px">${content.importantText}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${downloadUrl}" style="display:inline-block;background:#7DC142;color:#141F0C;font-family:Arial,sans-serif;font-size:17px;font-weight:700;text-decoration:none;padding:18px 40px;border-radius:10px">${content.btnText}</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 40px">
            <hr style="border:none;border-top:1px solid #e8e8e0;margin:0 0 28px">
            <p style="margin:0;color:#888;font-size:13px;font-family:Arial,sans-serif;line-height:1.6">
              ${content.resendLabel} <a href="${resendUrl}" style="color:#476B18">${resendUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif">${content.footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendDownloadEmailEn(email: string, token: string) {
  const downloadUrl = `${BASE_URL}/api/download?token=${token}`
  const resendUrl = `${BASE_URL}/reenviar`
  const to = process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth'

  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: 'Your Guide to Syntropic Agroforestry',
    html: emailHtml(downloadUrl, resendUrl, {
      tagline: 'OpenSyntropy',
      title: 'Introduction to Syntropic Agroforestry',
      greeting: 'Hello,',
      body: 'Thank you for your purchase. Your guide is ready to download.',
      importantLabel: 'Important',
      importantText: 'This download link is <strong>single-use</strong>. Once clicked, it cannot be used again. Save the PDF in a safe place after downloading.',
      btnText: 'Download my Guide →',
      resendLabel: 'Need to download again in the future? Visit:',
      footer: 'Michel Bottan · OpenSyntropy<br>You received this email because you made a purchase at opensyntropy.earth',
    }),
  })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

export async function sendRefundEmail(email: string) {
  const to = process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth'
  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: 'Sua devolução foi aprovada — OpenSyntropy',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F0E9;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr>
          <td style="background:#141F0C;padding:36px 40px;text-align:center">
            <p style="margin:0;color:#7DC142;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">OpenSyntropy</p>
            <h1 style="margin:12px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3">Devolução Aprovada</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">Olá,</p>
            <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.7">
              Seu pedido de devolução foi recebido e aprovado.
            </p>
            <p style="margin:0 0 32px;color:#555;font-size:14px;line-height:1.6;padding:16px;background:#f8f8f4;border-left:3px solid #7DC142;border-radius:4px">
              O estorno será realizado em até <strong>24 horas úteis</strong> no mesmo método de pagamento utilizado na compra.
            </p>
            <p style="margin:0;color:#888;font-size:14px;line-height:1.6">
              Se tiver qualquer dúvida, basta responder este e-mail.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f3ee;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif">
              Michel Bottan · OpenSyntropy<br>
              Você recebeu este e-mail porque solicitou uma devolução em opensyntropy.earth
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

export async function sendDownloadEmailEs(email: string, token: string) {
  const downloadUrl = `${BASE_URL}/api/download?token=${token}`
  const resendUrl = `${BASE_URL}/reenviar`
  const to = process.env.NODE_ENV === 'production' ? email : 'devops@opensyntropy.earth'

  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: 'Tu Guía de Introducción a la Agroforestería Sintrópica',
    html: emailHtml(downloadUrl, resendUrl, {
      tagline: 'OpenSyntropy',
      title: 'Introducción a la Agroforestería Sintrópica',
      greeting: 'Hola,',
      body: 'Gracias por tu compra. Tu guía está lista para descargar.',
      importantLabel: 'Importante',
      importantText: 'Este enlace de descarga es de <strong>un solo uso</strong>. Una vez que hagas clic, no podrá usarse nuevamente. Guarda el PDF en un lugar seguro después de descargarlo.',
      btnText: 'Descargar mi Guía →',
      resendLabel: '¿Necesitas descargar de nuevo en el futuro? Visita:',
      footer: 'Michel Bottan · OpenSyntropy<br>Recibiste este correo porque realizaste una compra en opensyntropy.earth',
    }),
  })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}
