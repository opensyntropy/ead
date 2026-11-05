import { createServiceClient } from '@/lib/supabase/server'

export type Inscrito = {
  id: string
  email: string | null
  whatsapp: string | null
  origem: string | null
  created_at: string
  email_descadastrado_em: string | null
}

// Lista de inscritos dos avisos de vídeo, mais recentes primeiro (PostgREST devolve no máximo 1000 por vez).
export async function getInscritos(): Promise<Inscrito[]> {
  const service = createServiceClient()
  const todos: Inscrito[] = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await service.from('video_subscribers')
      .select('id, email, whatsapp, origem, created_at, email_descadastrado_em')
      .order('created_at', { ascending: false })
      .range(de, de + 999)
    if (error) throw new Error(error.message)
    todos.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return todos
}

// Quem recebe o aviso por e-mail: tem e-mail, não saiu desta lista nem do descadastro geral (email_unsubscribes).
export async function getDestinosEmail(inscritos?: Inscrito[]): Promise<string[]> {
  const lista = inscritos ?? await getInscritos()
  const service = createServiceClient()
  const { data } = await service.from('email_unsubscribes').select('email')
  const fora = new Set((data ?? []).map(r => r.email?.toLowerCase().trim()))
  return [...new Set(lista.filter(i => i.email && !i.email_descadastrado_em && !fora.has(i.email)).map(i => i.email!))]
}
