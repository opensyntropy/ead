import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeEmail, verifyUnsubscribeToken } from '@/lib/unsubscribe'

// One-click unsubscribe (RFC 8058): Gmail/Outlook POST here from their own
// "Cancelar inscrição" button, and the /descadastro page posts here too.
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('e') ?? ''
  const token = req.nextUrl.searchParams.get('t') ?? ''
  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ message: 'Link inválido.' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { error } = await service
    .from('email_unsubscribes')
    .upsert({ email: normalizeEmail(email) }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) {
    console.error('[unsubscribe]', error)
    return NextResponse.json({ message: 'Erro ao descadastrar.' }, { status: 500 })
  }
  return NextResponse.json({ message: 'Descadastrado.' })
}
