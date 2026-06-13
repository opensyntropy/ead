import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendRecoveryEmail, sendCardRecoveryEmail } from '@/lib/email'
import { getPaymentStatus } from '@/lib/asaas'
import { PRODUCTS } from '@/config/products'
import type { ProductId } from '@/config/products'

export const maxDuration = 60

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

// Status da Asaas que indicam pagamento recebido — não devem receber lembrete.
const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'])

function productName(product: string): string {
  return (PRODUCTS[product as ProductId] as { name: string } | undefined)?.name ?? product
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()

  // Já existe compra confirmada do mesmo produto para este e-mail?
  async function hasConfirmedPurchase(email: string, product: string) {
    const { data } = await supabase
      .from('pix_charges')
      .select('id')
      .eq('email', email)
      .eq('product', product)
      .eq('status', 'confirmed')
      .limit(1)
    return !!data && data.length > 0
  }

  // Processa uma leva de cobranças pendentes, enviando o lembrete e marcando
  // a coluna informada (1º lembrete em 10 min, 2º em 12h).
  async function processReminders(
    column: 'recovery_sent_at' | 'recovery_sent_at_2',
    attempt: 1 | 2,
    olderThanMinutes: number,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString()

    let query = supabase
      .from('pix_charges')
      .select('*')
      .eq('status', 'pending')
      // Só PIX: cartão também grava linha em pix_charges, mas não deve receber
      // lembrete de "complete seu PIX". payment_method null = PIX legado.
      .or('payment_method.is.null,payment_method.neq.card')
      .is(column, null)
      .lt('created_at', cutoff)

    // O 2º lembrete só vale depois que o 1º já saiu.
    if (column === 'recovery_sent_at_2') {
      query = query.not('recovery_sent_at', 'is', null)
    }

    const { data: charges, error } = await query
    if (error) {
      console.error(`cron/recovery: erro ao buscar charges (${column})`, error)
      return 0
    }
    if (!charges || charges.length === 0) return 0

    let sent = 0
    for (const charge of charges) {
      try {
        const now = new Date().toISOString()

        if (await hasConfirmedPurchase(charge.email, charge.product)) {
          await supabase.from('pix_charges').update({ [column]: now }).eq('id', charge.id)
          console.log(`cron/recovery: pulando ${charge.email} — já possui compra confirmada`)
          continue
        }

        // Re-checa ao vivo na Asaas: o webhook pode ter atrasado e a cobrança já
        // estar paga mesmo com status local 'pending'. Se falhar, segue com o envio.
        try {
          const liveStatus = await getPaymentStatus(charge.asaas_payment_id)
          if (PAID_STATUSES.has(liveStatus)) {
            await supabase.from('pix_charges').update({ [column]: now }).eq('id', charge.id)
            console.log(`cron/recovery: pulando ${charge.email} — Asaas reporta ${liveStatus} (webhook atrasado)`)
            continue
          }
        } catch (err) {
          console.error(`cron/recovery: falha ao consultar status Asaas de ${charge.asaas_payment_id}:`, err)
        }

        // Link tagueado para atribuir a venda à recuperação quando o cliente
        // volta pelo e-mail (checkout marca via_recovery na nova cobrança).
        const checkoutUrl = `${BASE_URL}/ebook?utm_source=email&utm_medium=recovery&utm_content=attempt${attempt}`
        await sendRecoveryEmail(charge.email, charge.name, productName(charge.product), checkoutUrl, attempt)
        await supabase.from('pix_charges').update({ [column]: now }).eq('id', charge.id)
        sent++
      } catch (err) {
        console.error(`cron/recovery: erro para ${charge.email} (tentativa ${attempt}):`, err)
      }
    }
    return sent
  }

  // Recuperação de cartão recusado: um único lembrete, após 30 min (dá tempo de
  // uma 2ª tentativa na mesma sessão dar certo antes de mandar e-mail).
  async function processCardRecovery(olderThanMinutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString()

    const { data: attempts, error } = await supabase
      .from('failed_card_attempts')
      .select('*')
      .is('recovery_sent_at', null)
      .lt('created_at', cutoff)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('cron/recovery: erro ao buscar cartões recusados', error)
      return 0
    }
    if (!attempts || attempts.length === 0) return 0

    // Agrupa por email+produto: uma pessoa pode ter várias recusas — um e-mail só,
    // e marcamos todas as tentativas do grupo como tratadas.
    const groups = new Map<string, { rep: (typeof attempts)[number]; ids: string[] }>()
    for (const a of attempts) {
      const key = `${a.email.toLowerCase()}|${a.product}`
      const g = groups.get(key)
      if (g) g.ids.push(a.id)
      else groups.set(key, { rep: a, ids: [a.id] }) // rep = mais recente (ordenado desc)
    }

    let sent = 0
    for (const { rep, ids } of groups.values()) {
      try {
        // Se já comprou (cartão na 2ª tentativa, PIX, etc.), não manda — só marca.
        if (!(await hasConfirmedPurchase(rep.email, rep.product))) {
          const checkoutUrl = `${BASE_URL}/ebook?utm_source=email&utm_medium=recovery&utm_content=card`
          await sendCardRecoveryEmail(rep.email, rep.name, productName(rep.product), checkoutUrl)
          sent++
        }
        await supabase
          .from('failed_card_attempts')
          .update({ recovery_sent_at: new Date().toISOString() })
          .in('id', ids)
      } catch (err) {
        console.error(`cron/recovery: erro cartão para ${rep.email}:`, err)
      }
    }
    return sent
  }

  // 1º lembrete em 10 min, 2º lembrete em 12h (720 min)
  const sent1 = await processReminders('recovery_sent_at', 1, 10)
  const sent2 = await processReminders('recovery_sent_at_2', 2, 720)
  const sentCard = await processCardRecovery(30)
  const sent = sent1 + sent2

  // Arquiva todos os PIX pendentes há mais de 25h (dueDate do Asaas é 24h)
  const expiryCutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  const { data: expired } = await supabase
    .from('pix_charges')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', expiryCutoff)
    .select('id')

  const expiredCount = expired?.length ?? 0
  console.log(`cron/recovery: ${sent} e-mails PIX (${sent1} 1º + ${sent2} 2º) + ${sentCard} de cartão, ${expiredCount} cobranças arquivadas`)
  return NextResponse.json({ sent, sent1, sent2, sentCard, expired: expiredCount })
}
