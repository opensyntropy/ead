import { NextResponse } from 'next/server'
import { PRODUCTS, type ProductId } from '@/config/products'
import { findOrCreateCustomer, createCreditCardCharge, createPixCharge, createCharge, getPixQrCode } from '@/lib/asaas'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail, sendSessionPurchaseEmail, sendPurchaseNotification } from '@/lib/email'
import { sendPurchaseEvent } from '@/lib/meta-pixel'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    productId, email, name, cpf, paymentMethod = 'pix',
    cardNumber, cardExpiry, cardCvv, cardPostalCode, cardAddressNumber,
    installmentCount, whatsapp,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    page_version,
  } = body as {
    productId: string
    email: string
    name: string
    cpf?: string
    paymentMethod?: 'pix' | 'card'
    cardNumber?: string
    cardExpiry?: string
    cardCvv?: string
    cardPostalCode?: string
    cardAddressNumber?: string
    installmentCount?: number
    whatsapp?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
    page_version?: string
  }

  if (!productId || !email) {
    return NextResponse.json({ error: 'productId e email são obrigatórios' }, { status: 400 })
  }

  const product = PRODUCTS[productId as ProductId]
  if (!product) {
    return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
  }

  try {
    const cpfCnpj = cpf ? cpf.replace(/\D/g, '') : undefined
    const customer = await findOrCreateCustomer(email, name || email.split('@')[0], cpfCnpj)

    if (paymentMethod === 'pix') {
      try {
        const charge = await createPixCharge({
          customerId: customer.id,
          value: product.price,
          description: product.asaasDescription,
          externalReference: `${productId}:${email}`,
        })
        const qr = await getPixQrCode(charge.id)

        const supabase = await createServiceClient()
        const { error: upsertErr } = await supabase.from('pix_charges').upsert(
          {
            asaas_payment_id: charge.id, email, name: name || email.split('@')[0],
            product: productId, status: 'pending', payment_method: 'pix',
            value: product.price,
            whatsapp: whatsapp || null,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            page_version: page_version || null,
            pix_payload: qr.payload || null,
            via_recovery: utm_medium === 'recovery',
          },
          { onConflict: 'asaas_payment_id' }
        )
        if (upsertErr) console.error('[checkout] pix_charges upsert error:', JSON.stringify(upsertErr))

        return NextResponse.json({
          pixQrCode: qr.encodedImage,
          pixPayload: qr.payload,
          pixExpirationDate: qr.expirationDate,
          pixChargeId: charge.id,
        })
      } catch (pixErr) {
        const pixMsg = pixErr instanceof Error ? pixErr.message : String(pixErr)
        if (!pixMsg.includes('invalid_billingType')) throw pixErr

        // Fallback: PIX direto indisponível, redireciona para link Asaas
        console.warn('[checkout] PIX direto indisponível, usando fallback invoiceUrl')
        const charge = await createCharge({
          customerId: customer.id,
          value: product.price,
          description: product.asaasDescription,
          externalReference: `${productId}:${email}`,
        })

        const supabase = await createServiceClient()
        await supabase.from('pix_charges').upsert(
          {
            asaas_payment_id: charge.id, email, name: name || email.split('@')[0],
            product: productId, status: 'pending', payment_method: 'pix',
            value: product.price,
            whatsapp: whatsapp || null,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            page_version: page_version || null,
            via_recovery: utm_medium === 'recovery',
          },
          { onConflict: 'asaas_payment_id' }
        )

        return NextResponse.json({ invoiceUrl: charge.invoiceUrl })
      }
    }

    // Cartão de crédito direto
    if (!cardNumber || !cardExpiry || !cardCvv || !cardPostalCode || !cardAddressNumber || !cpfCnpj) {
      return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 })
    }

    const [expiryMonth, expiryYearShort] = cardExpiry.split('/')
    const expiryYear = expiryYearShort.length === 2 ? `20${expiryYearShort}` : expiryYearShort

    let charge
    try {
      charge = await createCreditCardCharge({
        customerId: customer.id,
        value: product.price,
        description: product.asaasDescription,
        externalReference: `${productId}:${email}`,
        installmentCount: installmentCount && installmentCount > 1 ? installmentCount : undefined,
        creditCard: {
          holderName: name || email.split('@')[0],
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: expiryMonth.trim(),
          expiryYear,
          ccv: cardCvv.trim(),
        },
        creditCardHolderInfo: {
          name: name || email.split('@')[0],
          email,
          cpfCnpj,
          postalCode: cardPostalCode.replace(/\D/g, ''),
          addressNumber: cardAddressNumber.trim(),
          mobilePhone: (whatsapp || '').replace(/\D/g, '') || undefined,
        },
      })
    } catch (cardErr) {
      // Cartão recusado: a Asaas não gera cobrança, então registramos só o contato
      // (NUNCA número/CVV) para a recuperação de cartão enviar e-mail depois.
      const reason = friendlyAsaasError(cardErr instanceof Error ? cardErr.message : String(cardErr))
      try {
        const supabase = await createServiceClient()
        await supabase.from('failed_card_attempts').insert({
          email, name: name || email.split('@')[0], whatsapp: whatsapp || null,
          product: productId, reason,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        })
      } catch (logErr) {
        console.error('[checkout] falha ao registrar cartão recusado:', logErr)
      }
      throw cardErr // mantém a mensagem amigável pro cliente (catch externo)
    }

    // Registra cobrança de cartão na pix_charges para aparecer no admin
    const supabase = await createServiceClient()
    await supabase.from('pix_charges').upsert(
      {
        asaas_payment_id: charge.id, email, name: name || email.split('@')[0],
        product: productId, status: charge.status === 'CONFIRMED' ? 'confirmed' : 'pending',
        // Preenche confirmed_at na confirmação síncrona para que o guard de
        // idempotência do webhook (.is('confirmed_at', null)) não reprocesse e
        // reenvie e-mail/notificação/CAPI quando o PAYMENT_CONFIRMED chegar.
        confirmed_at: charge.status === 'CONFIRMED' ? new Date().toISOString() : null,
        payment_method: 'card',
        value: product.price,
        installment_count: installmentCount && installmentCount > 1 ? installmentCount : null,
        whatsapp: whatsapp || null,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        page_version: page_version || null,
        via_recovery: utm_medium === 'recovery',
      },
      { onConflict: 'asaas_payment_id' }
    )

    let postError: string | null = null
    let downloadUrl: string | null = null
    if (charge.status === 'CONFIRMED') {
      try {
        await grantAccessAndSendEmail(email, productId as ProductId, charge.id)
      } catch (postErr) {
        postError = postErr instanceof Error ? postErr.message : String(postErr)
        console.error('Erro pós-pagamento (acesso/email):', postError)
      }
      if (productId === 'ebook' || productId === 'bundle') {
        try {
          const token = await createDownloadToken(email, 'ebook')
          downloadUrl = `/api/download?token=${token}`
        } catch { /* não bloqueia a resposta */ }
      }
    }

    return NextResponse.json({ cardSuccess: true, chargeId: charge.id, chargeStatus: charge.status, postError, downloadUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Asaas checkout error:', msg)
    return NextResponse.json({ error: friendlyAsaasError(msg) }, { status: 500 })
  }
}

async function grantAccessAndSendEmail(email: string, productId: ProductId, paymentId: string) {
  const supabase = await createServiceClient()
  let userId: string | null = null

  // Tenta criar/encontrar usuário, mas não bloqueia o envio do email se falhar
  try {
    const { data: users } = await supabase.auth.admin.listUsers()
    userId = users?.users?.find(u => u.email === email)?.id ?? null

    if (!userId) {
      const { data: newUser } = await supabase.auth.admin.createUser({ email, email_confirm: true })
      userId = newUser?.user?.id ?? null
    }

    if (userId) {
      await supabase.from('user_products').upsert(
        { user_id: userId, product: productId, asaas_payment_id: paymentId },
        { onConflict: 'user_id,product' }
      )
    }
  } catch (authErr) {
    console.error('Aviso: erro ao registrar usuário (acesso será liberado pelo webhook):', authErr)
  }

  // Meta Conversions API PRIMEIRO — a conversão é prioridade e não pode ser perdida
  // se o envio do e-mail abaixo falhar. Como o checkout seta confirmed_at, o webhook
  // faz no-op e NÃO dispara a CAPI de backup; então este é o único disparo server-side.
  // Mesmo eventId (charge.id) do fbq do navegador para o Meta deduplicar os dois.
  try {
    const value = (PRODUCTS[productId]?.price ?? 6700) / 100
    await sendPurchaseEvent({ email, value, eventId: paymentId })
  } catch (err) {
    console.error('Erro CAPI (checkout):', err)
  }

  try {
    await sendPurchaseNotification(email, productId, paymentId)
  } catch (err) {
    console.error('Erro ao enviar notificação de venda:', err)
  }

  // E-mail do comprador por último: se falhar, propaga pro caller sinalizar postError,
  // mas conversão e notificação já foram disparadas.
  if (productId === 'ebook' || productId === 'bundle') {
    const token = await createDownloadToken(email, 'ebook')
    await sendDownloadEmail(email, token)
  }
  if (productId === 'session' || productId === 'session_upsell') {
    const token = await createDownloadToken(email, 'ebook')
    await sendSessionPurchaseEmail(email, token)
  }
}

function friendlyAsaasError(raw: string): string {
  try {
    const errors: { code: string; description: string }[] = JSON.parse(raw)
    const desc = errors[0]?.description ?? ''

    if (/cpf|cnpj/i.test(desc)) return 'CPF inválido. Verifique o número digitado.'
    if (/cartão recusado|declined|card_declined/i.test(desc)) return 'Cartão recusado. Verifique os dados ou tente outro cartão.'
    if (/número.*cartão|card.*number|invalid_card/i.test(desc)) return 'Número de cartão inválido.'
    if (/vencid|expirad|expired/i.test(desc)) return 'Cartão vencido. Verifique a data de validade.'
    if (/cvv|cvc|security code/i.test(desc)) return 'CVV inválido.'
    if (/saldo|funds/i.test(desc)) return 'Saldo insuficiente no cartão.'
    if (/cep|postal|endereço/i.test(desc)) return 'CEP ou endereço inválido.'
    if (/domínio|domain/i.test(desc)) return 'Erro de configuração. Entre em contato com o suporte.'
    if (desc) return desc

  } catch { /* não é JSON, retorna mensagem genérica */ }

  return 'Não foi possível processar o pagamento. Tente novamente ou use outro cartão.'
}
