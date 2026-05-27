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

  // PIX pendentes há mais de 1 hora sem e-mail de recuperação enviado
  const cutoff = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()

  const { data: charges, error } = await supabase
    .from('pix_charges')
    .select('*')
    .eq('status', 'pending')
    .is('recovery_sent_at', null)
    .lt('created_at', cutoff)

  if (error) {
    console.error('cron/recovery: erro ao buscar charges', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!charges || charges.length === 0) {
    console.log('cron/recovery: nenhum PIX elegível')
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const charge of charges) {
    try {
      // Não enviar se o e-mail já tem uma compra confirmada do mesmo produto
      const { data: existing } = await supabase
        .from('pix_charges')
        .select('id')
        .eq('email', charge.email)
        .eq('product', charge.product)
        .eq('status', 'confirmed')
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase
          .from('pix_charges')
          .update({ recovery_sent_at: new Date().toISOString() })
          .eq('id', charge.id)
        console.log(`cron/recovery: pulando ${charge.email} — já possui compra confirmada`)
        continue
      }

      await sendRecoveryEmail(charge.email, charge.name, productName(charge.product), `${BASE_URL}/ebook`)
      await supabase
        .from('pix_charges')
        .update({ recovery_sent_at: new Date().toISOString() })
        .eq('id', charge.id)
      sent++
    } catch (err) {
      console.error(`cron/recovery: erro para ${charge.email}:`, err)
    }
  }

  // Arquiva todos os PIX pendentes há mais de 25h (dueDate do Asaas é 24h)
  const expiryCutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  const { data: expired } = await supabase
    .from('pix_charges')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', expiryCutoff)
    .select('id')

  const expiredCount = expired?.length ?? 0
  console.log(`cron/recovery: ${sent} e-mails enviados, ${expiredCount} cobranças arquivadas`)
  return NextResponse.json({ sent, expired: expiredCount })
}
