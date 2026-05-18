import { NextResponse } from 'next/server'
import { PRODUCTS, type ProductId } from '@/config/products'
import { findOrCreateCustomer, createCreditCardCharge, createPixCharge, getPixQrCode } from '@/lib/asaas'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    productId, email, name, cpf, paymentMethod = 'pix',
    cardNumber, cardExpiry, cardCvv, cardPostalCode, cardAddressNumber,
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    const charge = await createCreditCardCharge({
      customerId: customer.id,
      value: product.price,
      description: product.asaasDescription,
      externalReference: `${productId}:${email}`,
      redirectUrl: `${baseUrl}/ead?welcome=1`,
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

    return NextResponse.json({ cardSuccess: true, chargeStatus: charge.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Asaas checkout error:', msg)
    return NextResponse.json({ error: 'Erro ao criar cobrança', detail: msg }, { status: 500 })
  }
}
