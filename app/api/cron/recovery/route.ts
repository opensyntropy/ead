import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendRecoveryEmail } from '@/lib/email'
import { PRODUCTS } from '@/config/products'
import type { ProductId } from '@/config/products'

export const maxDuration = 60

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

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

        await sendRecoveryEmail(charge.email, charge.name, productName(charge.product), `${BASE_URL}/ebook`, attempt)
        await supabase.from('pix_charges').update({ [column]: now }).eq('id', charge.id)
        sent++
      } catch (err) {
        console.error(`cron/recovery: erro para ${charge.email} (tentativa ${attempt}):`, err)
      }
    }
    return sent
  }

  // 1º lembrete em 10 min, 2º lembrete em 12h (720 min)
  const sent1 = await processReminders('recovery_sent_at', 1, 10)
  const sent2 = await processReminders('recovery_sent_at_2', 2, 720)
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
  console.log(`cron/recovery: ${sent} e-mails enviados (${sent1} 1º + ${sent2} 2º), ${expiredCount} cobranças arquivadas`)
  return NextResponse.json({ sent, sent1, sent2, expired: expiredCount })
}
