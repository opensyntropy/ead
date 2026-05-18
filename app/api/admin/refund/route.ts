import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  return !!data
}

export async function PATCH(request: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })

  const service = await createServiceClient()
  const { error } = await service
    .from('refund_requests')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
