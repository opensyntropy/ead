import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail, sendSessionPurchaseEmail } from '@/lib/email'

export async function POST(request: Request) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { email, product } = await request.json() as { email: string; product: string }
  if (!email || !product) {
    return NextResponse.json({ error: 'email e product obrigatórios' }, { status: 400 })
  }

  const token = await createDownloadToken(email, 'ebook')

  if (product === 'session') {
    await sendSessionPurchaseEmail(email, token)
  } else {
    await sendDownloadEmail(email, token)
  }

  return NextResponse.json({ ok: true })
}
