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
