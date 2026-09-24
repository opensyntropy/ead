// Shared by the broadcast API route and the admin live preview (client).
export function buildEmailHtml(subject: string, bodyHtml: string): string {
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

export function isFullHtmlDocument(html: string): boolean {
  return /^\s*(<!doctype|<html)/i.test(html)
}
