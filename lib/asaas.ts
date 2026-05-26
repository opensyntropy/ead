const ASAAS_BASE = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

const headers = () => ({
  'Content-Type': 'application/json',
  'access_token': process.env.ASAAS_API_KEY!,
})

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

export interface AsaasCharge {
  id: string
  invoiceUrl: string
  status: string
  customer: string
  value: number
  description: string
  externalReference?: string
}

export async function findOrCreateCustomer(email: string, name: string, cpfCnpj?: string): Promise<AsaasCustomer> {
  const searchRes = await fetch(`${ASAAS_BASE}/customers?email=${encodeURIComponent(email)}&limit=1`, {
    headers: headers(),
  })
  if (!searchRes.ok) throw new Error(`Asaas customer search failed: ${searchRes.status}`)
  const searchData = await searchRes.json()

  if (searchData.data && searchData.data.length > 0) {
    const existing = searchData.data[0] as AsaasCustomer
    if (cpfCnpj && !existing.cpfCnpj) {
      const updateRes = await fetch(`${ASAAS_BASE}/customers/${existing.id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ name: existing.name, email, cpfCnpj }),
      })
      if (updateRes.ok) return updateRes.json() as Promise<AsaasCustomer>
    }
    return existing
  }

  const createRes = await fetch(`${ASAAS_BASE}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, email, ...(cpfCnpj ? { cpfCnpj } : {}) }),
  })
  if (!createRes.ok) {
    const err = await createRes.json()
    throw new Error(JSON.stringify(err.errors ?? err))
  }
  return createRes.json() as Promise<AsaasCustomer>
}

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

export async function createPixCharge(params: {
  customerId: string
  value: number
  description: string
  externalReference: string
}): Promise<AsaasCharge> {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const res = await fetch(`${ASAAS_BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'PIX',
      value: params.value / 100,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err.errors ?? err))
  }
  return res.json() as Promise<AsaasCharge>
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  const res = await fetch(`${ASAAS_BASE}/payments/${paymentId}/pixQrCode`, {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err.errors ?? err))
  }
  return res.json() as Promise<AsaasPixQrCode>
}

export async function createCreditCardCharge(params: {
  customerId: string
  value: number
  description: string
  externalReference: string
  installmentCount?: number
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    mobilePhone?: string
  }
}): Promise<AsaasCharge> {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const totalReais = params.value / 100
  const installmentCount = params.installmentCount && params.installmentCount > 1 ? params.installmentCount : undefined
  const installmentValue = installmentCount
    ? Math.ceil(params.value / installmentCount) / 100
    : undefined

  const res = await fetch(`${ASAAS_BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'CREDIT_CARD',
      value: totalReais,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference,
      ...(installmentCount ? { installmentCount, installmentValue } : {}),
      creditCard: params.creditCard,
      creditCardHolderInfo: params.creditCardHolderInfo,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err.errors ?? err))
  }
  return res.json() as Promise<AsaasCharge>
}

export async function createCharge(params: {
  customerId: string
  value: number
  description: string
  externalReference: string
  redirectUrl?: string
}): Promise<AsaasCharge> {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const res = await fetch(`${ASAAS_BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED',
      value: params.value / 100,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference,
      ...(params.redirectUrl ? { callback: { successUrl: params.redirectUrl } } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err.errors ?? err))
  }
  return res.json() as Promise<AsaasCharge>
}
