import { Resend } from 'resend'
import { SITE_URL, WHATSAPP_COMMUNITY } from '@/lib/site'
import { videoUnsubscribePageUrl, videoUnsubscribeOneClickUrl } from '@/lib/unsubscribe'
import { htmlToText } from '@/lib/broadcast-template'

// E-mails da lista "Novos vídeos" do Guia Agrofloresta: boas-vindas e aviso de aula nova.
// Mesmo remetente pessoal dos comunicados (convida resposta, ajuda na entregabilidade).

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_AVISOS = process.env.NODE_ENV === 'production'
  ? process.env.BROADCAST_FROM?.trim() || 'Michel Bottan <michel@opensyntropy.earth>'
  : 'Michel Bottan <onboarding@resend.dev>'
const REPLY_TO = process.env.BROADCAST_REPLY_TO?.trim() || undefined

export const DEV_DESTINO = 'devops@opensyntropy.earth'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`)

export type AulaEmail = { titulo: string; resumo?: string; imagem?: string; href: string }

// Texto livre do admin: parágrafos separados por linha em branco, sem HTML.
function paragrafos(texto: string): string {
  return texto.trim().split(/\n\s*\n/).filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;color:#2B1A15;font-size:16px;line-height:1.65">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

function botao(href: string, rotulo: string, fundo = '#F9B978', cor = '#271612') {
  return `<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:${fundo};color:${cor};font-weight:700;font-size:15px;text-decoration:none;font-family:Arial,sans-serif">${esc(rotulo)}</a>`
}

function cartaoAula(aula: AulaEmail) {
  const href = abs(aula.href)
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border:1px solid #EADBC8;border-radius:14px;overflow:hidden">
  ${aula.imagem ? `<tr><td><a href="${esc(href)}"><img src="${esc(abs(aula.imagem))}" alt="" width="520" style="display:block;width:100%;height:auto;border:0"></a></td></tr>` : ''}
  <tr><td style="padding:20px 22px">
    <p style="margin:0 0 4px;color:#E98059;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:700">Aula nova</p>
    <p style="margin:0 0 8px;color:#2B1A15;font-size:20px;font-weight:700;line-height:1.3;font-family:Arial,sans-serif">${esc(aula.titulo)}</p>
    ${aula.resumo ? `<p style="margin:0 0 16px;color:#6E5248;font-size:15px;line-height:1.55">${esc(aula.resumo)}</p>` : ''}
    ${botao(href, 'Assistir à aula →', '#642D48', '#ffffff')}
  </td></tr>
</table>`
}

function blocoComunidade() {
  if (!WHATSAPP_COMMUNITY) return ''
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;background:#E7F8EE;border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="margin:0 0 6px;color:#0F6B3A;font-size:16px;font-weight:700;font-family:Arial,sans-serif">Grupo de avisos do Michel no WhatsApp</p>
    <p style="margin:0 0 14px;color:#2B1A15;font-size:15px;line-height:1.55">Só eu envio mensagens, sem bate-papo: aulas novas e novidades direto no seu celular.</p>
    ${botao(WHATSAPP_COMMUNITY, 'Entrar no grupo de avisos', '#1FAF5A', '#ffffff')}
  </td></tr>
</table>`
}

// Moldura Desperto (ameixa + âmbar). {{sair}} vira o link de descadastro de cada destinatário.
function moldura(titulo: string, corpo: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:#FBF5EC;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5EC;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFDF9;border-radius:16px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#642D48;padding:26px 36px">
          <p style="margin:0;color:#F9B978;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:700">Guia Agrofloresta</p>
          <p style="margin:8px 0 0;color:#ffffff;font-size:21px;font-weight:700;line-height:1.3;font-family:Arial,sans-serif">${esc(titulo)}</p>
        </td></tr>
        <tr><td style="padding:32px 36px 28px">
          ${corpo}
          <p style="margin:24px 0 0;color:#2B1A15;font-size:16px;line-height:1.6">Um abraço,<br>Michel Bottan</p>
        </td></tr>
        <tr><td style="background:#F4EADF;padding:18px 36px;text-align:center">
          <p style="margin:0;color:#8C7166;font-size:12px;line-height:1.6;font-family:Arial,sans-serif">
            Guia Agrofloresta · um projeto Desperto · <a href="${SITE_URL}" style="color:#8C7166">${SITE_URL.replace(/^https?:\/\//, '')}</a><br>
            Você recebe este e-mail porque se inscreveu para receber os avisos de novas aulas.<br>
            <a href="{{sair}}" style="color:#8C7166">Não quero mais receber estes avisos</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function htmlBoasVindas() {
  const corpo = `${paragrafos(`Que bom ter você por aqui! A partir de agora, sempre que eu gravar uma aula nova no Desperto, você recebe um aviso neste e-mail.

As aulas são a parte prática do livro Guia de Introdução à Agrofloresta Sintrópica: uma espécie ou um manejo por vez, gravados no campo, cada uma ligada ao capítulo do livro que explica a teoria.`)}
<p style="margin:0 0 24px">${botao(`${SITE_URL}/biblioteca`, 'Ver as aulas da Biblioteca →')}</p>
${blocoComunidade()}
${paragrafos(`\n\nE se quiser a base completa, o livro está em ${SITE_URL.replace(/^https?:\/\//, '')}/guia-agrofloresta.`)}`
  return moldura('Inscrição confirmada: você vai receber as próximas aulas', corpo)
}

export function htmlNovaAula(assunto: string, mensagem: string, aula: AulaEmail) {
  const corpo = `${mensagem.trim() ? paragrafos(mensagem) : ''}
${cartaoAula(aula)}
${blocoComunidade()}`
  return moldura(assunto, corpo)
}

// Mensagem pronta para um destinatário: link de descadastro e List-Unsubscribe (RFC 8058) próprios.
export function mensagem(to: string, subject: string, html: string) {
  const final = html.replaceAll('{{sair}}', videoUnsubscribePageUrl(to))
  return {
    from: FROM_AVISOS,
    to,
    subject,
    html: final,
    text: htmlToText(final),
    ...(REPLY_TO && { replyTo: REPLY_TO }),
    headers: {
      'List-Unsubscribe': `<${videoUnsubscribeOneClickUrl(to)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

export async function enviarBoasVindas(email: string) {
  const to = process.env.NODE_ENV === 'production' ? email : DEV_DESTINO
  const { error } = await resend.emails.send(mensagem(to, 'Inscrição confirmada no Guia Agrofloresta', htmlBoasVindas()))
  if (error) throw new Error(`Resend: ${error.message}`)
}

export async function enviarUm(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send(mensagem(to, subject, html))
  if (error) throw new Error(error.message)
}

// Resend: lote de até 100 e-mails por requisição, 10 req/s; espera e tenta de novo no 429.
export async function enviarEmLotes(destinos: string[], subject: string, html: string) {
  let enviados = 0
  const falhas: string[] = []
  const LOTE = 100
  for (let i = 0; i < destinos.length; i += LOTE) {
    const parte = destinos.slice(i, i + LOTE)
    const payload = parte.map(to => mensagem(to, subject, html))
    for (let tentativa = 1; ; tentativa++) {
      const { data, error } = await resend.batch.send(payload, { batchValidation: 'permissive' })
      if (error) {
        if (error.name === 'rate_limit_exceeded' && tentativa < 5) {
          await new Promise(r => setTimeout(r, 1000 * tentativa))
          continue
        }
        falhas.push(...parte.map(to => `${to}: ${error.message}`))
        break
      }
      const erros = data.errors ?? []
      for (const e of erros) falhas.push(`${parte[e.index]}: ${e.message}`)
      enviados += parte.length - erros.length
      break
    }
    if (i + LOTE < destinos.length) await new Promise(r => setTimeout(r, 250))
  }
  return { enviados, falhas }
}
