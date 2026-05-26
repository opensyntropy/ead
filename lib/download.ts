import { createServiceClient } from '@/lib/supabase/server'

export async function createDownloadToken(email: string, product: string, options?: { noLimit?: boolean }): Promise<string> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('download_tokens')
    .insert({ email, product, no_limit: options?.noLimit ?? false })
    .select('token')
    .single()
  if (error) throw new Error(`createDownloadToken: ${error.message}`)
  return data.token as string
}
