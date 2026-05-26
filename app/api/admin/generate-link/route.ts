import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createDownloadToken } from '@/lib/download'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export async function POST(request: Request) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const token = await createDownloadToken(email, 'ebook')
  return NextResponse.json({ url: `${BASE_URL}/api/download?token=${token}` })
}
