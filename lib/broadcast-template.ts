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

// No branding: used when the admin opts out of the OpenSyntropy template.
// Full documents pass through untouched; fragments get a bare, readable shell.
export function buildPlainEmailHtml(bodyHtml: string): string {
  if (isFullHtmlDocument(bodyHtml)) return bodyHtml
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:24px 16px;background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;font-size:16px;line-height:1.6}
    img{max-width:100%;height:auto}
    p{margin:0 0 16px}
  </style>
</head>
<body>
  <div style="max-width:600px;margin:0 auto">
    ${bodyHtml}
  </div>
</body>
</html>`
}

export function isFullHtmlDocument(html: string): boolean {
  return /^\s*(<!doctype|<html)/i.test(html)
}

// "Maria da Silva" → "Maria"; bad/missing names yield ''.
export function firstName(fullName: string | null | undefined): string {
  const first = (fullName ?? '').trim().split(/\s+/)[0] ?? ''
  if (!first || first.includes('@')) return ''
  return first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1).toLocaleLowerCase('pt-BR')
}

// Replaces {{nome}} (any case/spacing). Without a name, the placeholder and the
// space before it are dropped, so "Olá {{nome}}," becomes "Olá,".
export function personalize(text: string, name: string, escapeHtml = true): string {
  const safe = escapeHtml ? name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : name
  return text.replace(/(\s*)\{\{\s*nome\s*\}\}/gi, (_, space: string) => (safe ? space + safe : ''))
}

// Plain-text alternative: HTML-only emails score worse with spam filters.
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|head|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => `${label.replace(/<[^>]+>/g, '')} (${href})`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
