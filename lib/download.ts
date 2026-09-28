import { createServiceClient } from '@/lib/supabase/server'

export type EbookLang = 'pt' | 'en'

// Master PDFs shipped with /api/download (see outputFileTracingIncludes)
export const EBOOK_FILES: Record<EbookLang, { file: string; downloadName: string; watermark: string }> = {
  pt: { file: 'ebook.pdf', downloadName: 'Agrofloresta-Sintropica-Michel-Bottan.pdf', watermark: 'Licenciado para' },
  en: { file: 'ebook_en.pdf', downloadName: 'Syntropic-Agroforestry-Michel-Bottan.pdf', watermark: 'Licensed to' },
}

// The token's storage_path holds the master file; unknown/empty means Portuguese
export function ebookForStoragePath(storagePath: string | null | undefined) {
  return Object.values(EBOOK_FILES).find(e => e.file === storagePath) ?? EBOOK_FILES.pt
}

export async function createDownloadToken(
  email: string,
  product: string,
  options?: { noLimit?: boolean; lang?: EbookLang },
): Promise<string> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('download_tokens')
    .insert({
      email,
      product,
      no_limit: options?.noLimit ?? false,
      storage_path: EBOOK_FILES[options?.lang ?? 'pt'].file,
    })
    .select('token')
    .single()
  if (error) throw new Error(`createDownloadToken: ${error.message}`)
  return data.token as string
}
