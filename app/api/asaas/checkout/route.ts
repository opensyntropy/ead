import { NextResponse } from 'next/server'
import { PRODUCTS, type ProductId } from '@/config/products'
import { findOrCreateCustomer, createCreditCardCharge, createPixCharge, getPixQrCode } from '@/lib/asaas'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail, sendSessionPurchaseEmail } from '@/lib/email'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    productId, email, name, cpf, paymentMethod = 'pix',
    cardNumber, cardExpiry, cardCvv, cardPostalCode, cardAddressNumber,
    utm_source, utm_medium, utm_campaign, utm_content,
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
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
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
      const charge = await createPixCharge({
        customerId: customer.id,
        value: product.price,
        description: product.asaasDescription,
        externalReference: `${productId}:${email}`,
      })
      const qr = await getPixQrCode(charge.id)

      // Registra tentativa de PIX para rastreamento (confirmação vem pelo webhook)
      const supabase = await createServiceClient()
      await supabase.from('pix_charges').upsert(
        {
          asaas_payment_id: charge.id, email, name: name || email.split('@')[0],
          product: productId, status: 'pending',
          utm_source, utm_medium, utm_campaign, utm_content,
        },
        { onConflict: 'asaas_payment_id' }
      )

      return NextResponse.json({
        pixQrCode: qr.encodedImage,
        pixPayload: qr.payload,
        pixExpirationDate: qr.expirationDate,
      })
    }

    // Cartão de crédito direto
    if (!cardNumber || !cardExpiry || !cardCvv || !cardPostalCode || !cardAddressNumber || !cpfCnpj) {
      return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 })
    }

    const [expiryMonth, expiryYearShort] = cardExpiry.split('/')
    const expiryYear = expiryYearShort.length === 2 ? `20${expiryYearShort}` : expiryYearShort

    const charge = await createCreditCardCharge({
      customerId: customer.id,
      value: product.price,
      description: product.asaasDescription,
      externalReference: `${productId}:${email}`,
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
      },
    })

    let postError: string | null = null
    if (charge.status === 'CONFIRMED') {
      try {
        await grantAccessAndSendEmail(email, productId as ProductId, charge.id)
      } catch (postErr) {
        postError = postErr instanceof Error ? postErr.message : String(postErr)
        console.error('Erro pós-pagamento (acesso/email):', postError)
      }
    }

    return NextResponse.json({ cardSuccess: true, chargeStatus: charge.status, postError })
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

  if (productId === 'ebook' || productId === 'bundle') {
    const token = await createDownloadToken(email, 'ebook')
    await sendDownloadEmail(email, token)
  }
  if (productId === 'session') {
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
