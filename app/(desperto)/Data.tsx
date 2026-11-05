// Data de publicação no padrão do site: "4 de novembro de 2026" (longa) ou "4 de nov. de 2026" (curta).
// As datas do frontmatter são só dia (AAAA-MM-DD); fixar meio-dia em UTC evita virar o dia por fuso.

export function formataData(iso: string, curta = false) {
  const d = new Date(`${iso}T12:00:00Z`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', curta
    ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function Data({ iso, curta, className }: { iso?: string; curta?: boolean; className?: string }) {
  if (!iso) return null
  return <time dateTime={iso} className={className}>{formataData(iso, curta)}</time>
}

// "Publicado em …" e, se houver revisão posterior, "Atualizado em …", como itens da lista .meta.
export function DatasMeta({ publicado, atualizado }: { publicado?: string; atualizado?: string }) {
  return (
    <>
      {publicado && <li>Publicado em <Data iso={publicado} /></li>}
      {atualizado && atualizado !== publicado && <li>Atualizado em <Data iso={atualizado} /></li>}
    </>
  )
}
