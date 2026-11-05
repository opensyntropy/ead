import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminHeader from '../AdminHeader'
import AvisarAula from './AvisarAula'
import { createServiceClient } from '@/lib/supabase/server'
import { getInscritos, getDestinosEmail, type Inscrito } from '@/lib/inscritos'
import { getConteudo } from '@/lib/conteudo'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

const data = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

export default async function InscritosPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  let inscritos: Inscrito[] = []
  let erro = ''
  try {
    inscritos = await getInscritos()
  } catch (e) {
    erro = (e as Error).message
  }
  const destinos = erro ? [] : await getDestinosEmail(inscritos)
  const comWhats = inscritos.filter(i => i.whatsapp).length

  const aulas = (await getConteudo())
    .filter(i => i.tipo === 'Aula')
    .sort((a, b) => b.data.localeCompare(a.data))
    .map(i => ({ href: i.href, titulo: i.titulo, data: i.data }))

  const service = createServiceClient()
  const { data: historico } = await service.from('video_avisos').select('href, assunto, enviados, falhas, created_at').order('created_at', { ascending: false }).limit(20)

  // mensagem pronta para o WhatsApp de cada inscrito, sobre a aula mais recente
  const ultima = aulas[0]
  const textoWhats = ultima ? `Oi! Saiu aula nova no Guia Agrofloresta: ${ultima.titulo}\n${SITE_URL}${ultima.href}` : 'Oi! Saiu aula nova no Guia Agrofloresta.'

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-[#52b788]" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Inscritos: avisos de novas aulas</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {inscritos.length} inscrito(s) · {destinos.length} recebem por e-mail · {comWhats} com WhatsApp
              </p>
            </div>
          </div>
          <a href="/api/admin/export-inscritos" className="text-sm font-semibold text-[#1b4332] border border-[#1b4332]/30 hover:border-[#1b4332] rounded-lg px-4 py-2">
            ⬇ Exportar CSV
          </a>
        </div>

        {erro && <p className="rounded-lg bg-red-50 text-red-700 text-sm p-4">Erro ao ler video_subscribers: {erro}. A migration foi aplicada?</p>}

        <AvisarAula aulas={aulas} destinos={destinos.length} />

        {historico && historico.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-3">Avisos enviados</h2>
            <ul className="text-sm divide-y">
              {historico.map(h => (
                <li key={h.created_at} className="py-2 flex flex-wrap gap-x-4">
                  <span className="text-gray-500">{data(h.created_at)}</span>
                  <span className="font-medium text-gray-800">{h.assunto}</span>
                  <span className="text-gray-500">{h.enviados} enviados{h.falhas ? ` · ${h.falhas} falhas` : ''}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Origem</th>
                <th className="px-4 py-3 font-semibold">Inscrito em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inscritos.length === 0 && !erro && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Ainda ninguém inscrito.</td></tr>
              )}
              {inscritos.map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-2.5">
                    {i.email ?? <span className="text-gray-300">—</span>}
                    {i.email_descadastrado_em && <span className="ml-2 text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">saiu do e-mail</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {i.whatsapp
                      ? <a className="text-[#128C4A] hover:underline" href={`https://wa.me/${i.whatsapp}?text=${encodeURIComponent(textoWhats)}`} target="_blank" rel="noopener noreferrer">+{i.whatsapp} ↗</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{i.origem ?? ''}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{data(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
