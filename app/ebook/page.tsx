'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

const PAGES = [
  { src: '/preview/pagina_17.png', cap: 'Cap. 2', title: 'O Que É Sintropia' },
  { src: '/preview/pagina_57.png', cap: 'Cap. 4', title: 'A Dinâmica da Sucessão Natural' },
  { src: '/preview/pagina_77.png', cap: 'Cap. 6', title: 'O Objetivo Central do Consórcio' },
  { src: '/preview/pagina_87.png', cap: 'Cap. 7', title: 'Poda como Biomimetismo' },
]

function PageLightbox({ index, onClose, onPrev, onNext }: {
  index: number; onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  const pg = PAGES[index]
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}>
      {/* nav anterior */}
      <button onClick={e => { e.stopPropagation(); onPrev() }}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl flex items-center justify-center transition-colors"
        aria-label="Anterior">‹</button>

      {/* imagem */}
      <div className="relative max-h-[90vh] max-w-2xl w-full flex flex-col items-center gap-3"
        onClick={e => e.stopPropagation()}>
        <img src={pg.src} alt={pg.title}
          className="max-h-[82vh] w-auto rounded-xl shadow-2xl object-contain" />
        <p className="text-white/70 text-sm">
          <span className="font-bold" style={{ color: '#7DC142' }}>{pg.cap}</span>
          {': '}{pg.title}
          <span className="ml-4 text-white/40 text-xs">ESC para fechar · ← → para navegar</span>
        </p>
      </div>

      {/* nav próxima */}
      <button onClick={e => { e.stopPropagation(); onNext() }}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl flex items-center justify-center transition-colors"
        aria-label="Próxima">›</button>

      {/* fechar */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white text-lg flex items-center justify-center transition-colors"
        aria-label="Fechar">✕</button>
    </div>
  )
}

// Paleta extraída da capa.png (análise pixel-a-pixel, mai/2026)
const LIME   = '#7DC142'  // verde lima dos títulos
const DARK   = '#141F0C'  // fundo floresta escuro
const FOREST = '#476B18'  // verde floresta médio
const CREAM  = '#F2F0E9'  // creme parchment da barra inferior
const GOLD   = '#C69B2D'  // dourado âmbar dos acentos

const TRANSFORMATIONS = [
  { icon: '🌿', text: 'Entende a lógica por trás da floresta, não só as técnicas, mas o porquê de cada uma funcionar.' },
  { icon: '👁️', text: 'Sabe ler uma paisagem e identificar em que estágio de desenvolvimento ela está.' },
  { icon: '🌱', text: 'Consegue planejar um consórcio produtivo desde o início.' },
  { icon: '🧭', text: 'Sente segurança para dar o próximo passo: comprar terra, iniciar um projeto ou aprofundar o estudo.' },
]

const ALL_PARTS = [
  {
    num: 'I', title: 'Fundamentos', subtitle: 'Por que e o quê: a lógica da vida que sustenta o método',
    chapters: [
      { n: '01', title: 'O Problema que a Agricultura Convencional Criou' },
      { n: '02', title: 'O Que É Sintropia' },
      { n: '03', title: 'Conceitos, Princípios e Práticas da Agricultura Sintrópica' },
      { n: '04', title: 'Sucessão Natural: O Calendário da Floresta' },
      { n: '05', title: 'Estratos: A Arquitetura Vertical da Floresta' },
      { n: '06', title: 'Consórcios na Agrofloresta Sintrópica' },
      { n: '07', title: 'O Pulso da Poda' },
      { n: '08', title: 'Densidade e Diversidade' },
      { n: '09', title: 'Capina Seletiva: A Arte de Escolher o Que Fica' },
    ],
  },
  {
    num: 'II', title: 'Solo e Fertilidade', subtitle: 'Como o SAF constrói a própria fertilidade',
    chapters: [
      { n: '10', title: 'O Solo Como Organismo Vivo' },
      { n: '11', title: 'Produção de Biomassa' },
      { n: '12', title: 'Relação C/N: A Química da Sucessão' },
      { n: '13', title: 'O Papel das Gramíneas no SAF Sintrópico' },
      { n: '14', title: 'Adubação Verde: Fertilidade Construída por Dentro' },
    ],
  },
  {
    num: 'III', title: 'Como Planejar', subtitle: 'Do diagnóstico ao design',
    chapters: [
      { n: '15', title: 'Leia Sua Terra Antes de Desenhar' },
      { n: '16', title: 'Defina Seus Objetivos Antes de Escolher Espécies' },
      { n: '17', title: 'A Caixa de Ferramentas Sintrópica' },
      { n: '18', title: 'Linhas de Plantio e Arranjo Espacial' },
    ],
  },
  {
    num: 'IV', title: 'Modelos de SAF', subtitle: 'Diferentes formas de aplicar o método',
    chapters: [
      { n: '19', title: 'SAF Base: O Módulo Fundamental' },
      { n: '20', title: 'SAF + Horta: Uma Integração que Precisa Ser Entendida com Honestidade' },
      { n: '21', title: 'SAF para Mecanização: Produção em Escala' },
      { n: '22', title: 'SAF Café: O Modelo Sintrópico para Cafeicultura' },
      { n: '23', title: 'SAF Biodiverso: Quando a Floresta É o Produto' },
    ],
  },
  {
    num: 'V', title: 'Como Implantar e Manter', subtitle: 'Da terra vazia ao sistema vivo',
    chapters: [
      { n: '24', title: 'Implantação: Os Primeiros 12 Meses' },
      { n: '25', title: 'Muvuca de Sementes: Implantação com Baixo Custo e Alta Diversidade' },
      { n: '26', title: 'Lendo o Sistema: Como Saber se Está Funcionando' },
      { n: '27', title: 'É Difícil. É Verdade. E Vale a Pena.' },
    ],
  },
]

const INFOGRAPHICS = [
  { src: '/infograficos/cap1.png',  label: 'O Ciclo da Agricultura Convencional',       cap: 'Capítulo 01' },
  { src: '/infograficos/cap2.png',  label: 'O Que É Sintropia e Por Que Muda Tudo',   cap: 'Capítulo 02' },
  { src: '/infograficos/cap3.png',  label: 'A Gramática da Agricultura Sintrópica',      cap: 'Capítulo 03' },
  { src: '/infograficos/cap4.png',  label: 'Sucessão Natural',                           cap: 'Capítulo 04' },
  { src: '/infograficos/cap5.png',  label: 'A Arquitetura Vertical da Floresta',         cap: 'Capítulo 05' },
  { src: '/infograficos/cap6.png',  label: 'O Objetivo Central do Consórcio',            cap: 'Capítulo 06' },
  { src: '/infograficos/cap7.png',  label: 'Poda como Dinâmica de Clareira',             cap: 'Capítulo 07' },
  { src: '/infograficos/cap10.png', label: 'O Solo Como Organismo Vivo',                 cap: 'Capítulo 10' },
  { src: '/infograficos/cap15.png', label: 'As Quatro Leituras Essenciais da Terra',     cap: 'Capítulo 15' },
]

const PAIN_CARDS = [
  {
    label: 'Fundamentos',
    title: 'A lógica antes das técnicas',
    desc: 'Você entende por que a agricultura convencional degrada, o que é sintropia, como a sucessão natural funciona e qual é a arquitetura vertical da floresta.',
  },
  {
    label: 'Solo e Planejamento',
    title: 'Do solo ao consórcio',
    desc: 'Você aprende a construir fertilidade de dentro para fora, a ler a sua terra e a desenhar um consórcio funcional do zero.',
  },
  {
    label: 'Modelos e Implantação',
    title: 'O modelo certo para a sua realidade',
    desc: 'SAF base, SAF café, SAF biodiverso, integração com horta, mecanização. Você sabe qual modelo se encaixa nos seus objetivos e como dar o primeiro passo.',
  },
]


const TESTIMONIALS = [
  {
    name: '[Nome Sobrenome]',
    role: '[Estudante de agronomia, SP]',
    text: '[Depoimento: o que mudou na forma de ver e entender o campo depois de ler o guia. Como o conteúdo deu clareza ao que antes parecia complexo.]',
  },
  {
    name: '[Nome Sobrenome]',
    role: '[Em transição para o campo, MG]',
    text: '[Depoimento: como o guia deu segurança para dar o próximo passo. Sentiu que finalmente entendeu a lógica por trás do sistema.]',
  },
  {
    name: '[Nome Sobrenome]',
    role: '[Proprietário de sítio, PR]',
    text: '[Depoimento: como o guia mudou a abordagem no manejo da terra. O que aplicou logo após a leitura e o resultado que observou.]',
  },
]

const FAQ_ITEMS = [
  { q: 'Preciso ter terra para aproveitar?', a: 'Não. O guia é teórico-prático. Você pode estudar e planejar antes de plantar: a lógica é útil em qualquer escala e em qualquer fase.' },
  { q: 'O conteúdo funciona para qualquer clima ou região?', a: 'Sim. A lógica sintrópica é universal. O guia ensina os princípios, não um receituário específico de uma região. Você leva para qualquer bioma.' },
  { q: 'É só teoria ou tem parte prática?', a: 'As 6 práticas operacionais (cap. 03) e o exercício de leitura de paisagem (cap. 04) são completamente aplicáveis desde a primeira leitura.' },
  { q: 'Como acesso depois de comprar?', a: 'Imediatamente após a confirmação do pagamento você recebe acesso à plataforma por e-mail, com leitura online e download do PDF.' },
  { q: 'Este guia é baseado no trabalho de Ernst Götsch?', a: 'Sim. O guia é baseado nos princípios desenvolvidos por Götsch ao longo de décadas e aprofundados pela comunidade sintrópica brasileira.' },
  { q: 'Tem garantia?', a: 'Sim. 7 dias. Se você ler o guia e não achar que valeu cada centavo, devolvemos o pagamento integralmente, sem burocracia.' },
  { q: 'Como solicito devolução?', a: 'Acesse a página de devolução, informe o e-mail da compra e o motivo (opcional). Retornamos em até 24h.', link: { href: '/reembolso', label: 'Solicitar devolução →' } },
  { q: 'Perdi o link de acesso. Como baixo novamente?', a: 'Acesse a página de reenvio, informe o e-mail da compra e enviaremos um novo link imediatamente.', link: { href: '/reenviar', label: 'Receber novo link →' } },
]

function FaqItem({ q, a, link }: { q: string; a: string; link?: { href: string; label: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b-2 border-[#E8E0D4]">
      <button onClick={() => setOpen(v => !v)} className="w-full text-left py-6 flex items-center justify-between gap-4">
        <span className="font-bold text-[#141F0C] text-lg leading-snug">{q}</span>
        <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#7DC142] text-[#7DC142] font-bold text-xl flex items-center justify-center leading-none">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="pb-6 pr-8">
          <p className="text-base text-gray-600 leading-relaxed">{a}</p>
          {link && (
            <a href={link.href} className="inline-block mt-3 text-sm font-bold hover:underline" style={{ color: '#476B18' }}>
              {link.label}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5)
  return digits
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [cardSuccess, setCardSuccess] = useState(false)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})

  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardPostalCode, setCardPostalCode] = useState('')
  const [cardAddressNumber, setCardAddressNumber] = useState('')

  // Upsell (sessão pós-compra)
  const [upsellPaymentMethod, setUpsellPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [upsellLoading, setUpsellLoading] = useState(false)
  const [upsellPixData, setUpsellPixData] = useState<{ qrCode: string; payload: string } | null>(null)
  const [upsellSuccess, setUpsellSuccess] = useState(false)
  const [upsellCopied, setUpsellCopied] = useState(false)
  const [upsellError, setUpsellError] = useState('')
  const [upsellCardNumber, setUpsellCardNumber] = useState('')
  const [upsellCardExpiry, setUpsellCardExpiry] = useState('')
  const [upsellCardCvv, setUpsellCardCvv] = useState('')
  const [upsellCardPostalCode, setUpsellCardPostalCode] = useState('')
  const [upsellCardAddressNumber, setUpsellCardAddressNumber] = useState('')

  useEffect(() => {
    const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    const fromUrl: Record<string, string> = {}
    UTM_KEYS.forEach(k => { const v = searchParams.get(k); if (v) fromUrl[k] = v })

    if (Object.keys(fromUrl).length > 0) {
      sessionStorage.setItem('utm', JSON.stringify(fromUrl))
      setUtmParams(fromUrl)
    } else {
      try {
        const stored = sessionStorage.getItem('utm')
        if (stored) setUtmParams(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [searchParams])

  const inputCls = "border-2 border-gray-200 rounded-xl px-5 py-4 text-base text-gray-800 bg-white focus:outline-none focus:border-[#7DC142] transition-colors"

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    ;(window as any).fbq?.('track', 'InitiateCheckout', { value: 67, currency: 'BRL', num_items: 1 })
    setLoading(true)
    setError('')
    const res = await fetch('/api/asaas/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'ebook', email, name, cpf, paymentMethod,
        ...utmParams,
        ...(paymentMethod === 'card' ? { cardNumber, cardExpiry, cardCvv, cardPostalCode, cardAddressNumber } : {}),
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.pixQrCode) {
      setPixData({ qrCode: data.pixQrCode, payload: data.pixPayload })
      ;(window as any).fbq?.('track', 'Purchase', { value: 67, currency: 'BRL' })
    } else if (data.cardSuccess) {
      setCardSuccess(true)
      ;(window as any).fbq?.('track', 'Purchase', { value: 67, currency: 'BRL' })
    } else {
      setError(data.error ?? 'Erro ao processar pagamento. Tente novamente.')
    }
  }

  async function handleUpsell(e: React.FormEvent) {
    e.preventDefault()
    setUpsellLoading(true)
    setUpsellError('')
    const res = await fetch('/api/asaas/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'session_upsell', email, name, cpf,
        paymentMethod: upsellPaymentMethod,
        ...utmParams,
        ...(upsellPaymentMethod === 'card' ? {
          cardNumber: upsellCardNumber,
          cardExpiry: upsellCardExpiry,
          cardCvv: upsellCardCvv,
          cardPostalCode: upsellCardPostalCode,
          cardAddressNumber: upsellCardAddressNumber,
        } : {}),
      }),
    })
    const data = await res.json()
    setUpsellLoading(false)
    if (data.pixQrCode) {
      setUpsellPixData({ qrCode: data.pixQrCode, payload: data.pixPayload })
    } else if (data.cardSuccess) {
      setUpsellSuccess(true)
    } else {
      setUpsellError(data.error ?? 'Erro ao processar. Tente novamente.')
    }
  }

  function handleCopy() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pixData) {
    return (
      <div className="bg-white px-8 py-6 flex flex-col gap-6 items-center text-center">
        <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code PIX" className="w-52 h-52 rounded-2xl border-2 border-[#7DC142]" />
        <div className="w-full">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-semibold">PIX Copia e Cola</p>
          <div className="flex gap-2 items-stretch">
            <input readOnly value={pixData.payload} className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 bg-gray-50 font-mono truncate" />
            <button type="button" onClick={handleCopy} className="px-4 py-3 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0" style={{ backgroundColor: LIME }}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <div className="w-full rounded-2xl px-6 py-5 text-left" style={{ backgroundColor: '#f0fdf4', border: '2px solid #d8f3dc' }}>
          <p className="font-bold text-[#141F0C] text-base">Aguardando pagamento</p>
          <p className="text-[#476B18] text-sm mt-1 leading-relaxed">Você receberá um e-mail assim que o PIX for confirmado.</p>
        </div>
        <UpsellBump
          upsellPaymentMethod={upsellPaymentMethod} setUpsellPaymentMethod={setUpsellPaymentMethod}
          upsellLoading={upsellLoading} upsellPixData={upsellPixData} upsellSuccess={upsellSuccess}
          upsellCopied={upsellCopied} setUpsellCopied={setUpsellCopied} upsellError={upsellError}
          upsellCardNumber={upsellCardNumber} setUpsellCardNumber={setUpsellCardNumber}
          upsellCardExpiry={upsellCardExpiry} setUpsellCardExpiry={setUpsellCardExpiry}
          upsellCardCvv={upsellCardCvv} setUpsellCardCvv={setUpsellCardCvv}
          upsellCardPostalCode={upsellCardPostalCode} setUpsellCardPostalCode={setUpsellCardPostalCode}
          upsellCardAddressNumber={upsellCardAddressNumber} setUpsellCardAddressNumber={setUpsellCardAddressNumber}
          handleUpsell={handleUpsell}
        />
      </div>
    )
  }

  if (cardSuccess) {
    return (
      <div className="bg-white px-8 py-8 w-full flex flex-col gap-6">
        <div className="text-center flex flex-col gap-3">
          <p className="text-3xl">✓</p>
          <p className="font-bold text-[#141F0C] text-lg">Pagamento confirmado!</p>
          <p className="text-[#476B18] text-sm leading-relaxed">Você receberá um e-mail em instantes.</p>
        </div>
        <UpsellBump
          upsellPaymentMethod={upsellPaymentMethod} setUpsellPaymentMethod={setUpsellPaymentMethod}
          upsellLoading={upsellLoading} upsellPixData={upsellPixData} upsellSuccess={upsellSuccess}
          upsellCopied={upsellCopied} setUpsellCopied={setUpsellCopied} upsellError={upsellError}
          upsellCardNumber={upsellCardNumber} setUpsellCardNumber={setUpsellCardNumber}
          upsellCardExpiry={upsellCardExpiry} setUpsellCardExpiry={setUpsellCardExpiry}
          upsellCardCvv={upsellCardCvv} setUpsellCardCvv={setUpsellCardCvv}
          upsellCardPostalCode={upsellCardPostalCode} setUpsellCardPostalCode={setUpsellCardPostalCode}
          upsellCardAddressNumber={upsellCardAddressNumber} setUpsellCardAddressNumber={setUpsellCardAddressNumber}
          handleUpsell={handleUpsell}
        />
      </div>
    )
  }

  return (
    <>
      {/* cabeçalho escuro com preço */}
      <div className="px-8 py-7 text-center" style={{ backgroundColor: '#0D1608' }}>
        <div className="flex items-center justify-center gap-4 mb-1">
          <span className="text-gray-500 text-lg line-through">R$ 107</span>
          <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ backgroundColor: LIME + '22', color: LIME }}>41% OFF</span>
        </div>
        <div className="font-black text-white leading-none" style={{ fontSize: 'clamp(3.5rem, 14vw, 6rem)' }}>
          R$<span style={{ color: LIME }}>67</span>
        </div>
        <p className="text-gray-400 text-sm mt-2">Pagamento único · PIX ou cartão · Acesso permanente</p>
      </div>

      {/* formulário */}
      <div className="bg-white px-8 pt-7 pb-8">
        <form onSubmit={handleBuy} className="flex flex-col gap-4 w-full">
          <input type="text" required placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          <input type="email" required placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          <input type="text" required inputMode="numeric" placeholder="CPF (somente números)" value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))} className={inputCls} />

          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
            <button type="button" onClick={() => setPaymentMethod('pix')}
              className="flex-1 py-3.5 text-base font-bold transition-colors"
              style={paymentMethod === 'pix' ? { backgroundColor: LIME, color: '#fff' } : { backgroundColor: '#fff', color: FOREST }}>
              PIX
            </button>
            <button type="button" onClick={() => setPaymentMethod('card')}
              className="flex-1 py-3.5 text-base font-bold transition-colors border-l-2 border-gray-200"
              style={paymentMethod === 'card' ? { backgroundColor: LIME, color: '#fff' } : { backgroundColor: '#fff', color: FOREST }}>
              Cartão de crédito
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="flex flex-col gap-3">
              <input type="text" required inputMode="numeric" placeholder="Número do cartão" value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))} className={inputCls} />
              <div className="flex gap-3">
                <input type="text" required inputMode="numeric" placeholder="Validade (MM/AA)" value={cardExpiry}
                  onChange={e => setCardExpiry(formatExpiry(e.target.value))} className={inputCls + ' flex-1'} />
                <input type="text" required inputMode="numeric" placeholder="CVV" value={cardCvv}
                  onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputCls + ' w-28'} />
              </div>
              <div className="flex gap-3">
                <input type="text" required inputMode="numeric" placeholder="CEP" value={cardPostalCode}
                  onChange={e => setCardPostalCode(formatCep(e.target.value))} className={inputCls + ' flex-1'} />
                <input type="text" required placeholder="Número" value={cardAddressNumber}
                  onChange={e => setCardAddressNumber(e.target.value)} className={inputCls + ' w-28'} />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={loading}
            className="py-5 px-8 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100"
            style={{ backgroundColor: LIME, color: DARK }}>
            {loading ? 'Aguarde...' : paymentMethod === 'pix' ? 'Pagar com PIX →' : 'Pagar com cartão →'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span style={{ color: LIME }}>★★★★★</span>
          <span>Garantia de 7 dias · sem perguntas · sem burocracia</span>
        </div>
      </div>
    </>
  )
}

interface UpsellBumpProps {
  upsellPaymentMethod: 'pix' | 'card'
  setUpsellPaymentMethod: (v: 'pix' | 'card') => void
  upsellLoading: boolean
  upsellPixData: { qrCode: string; payload: string } | null
  upsellSuccess: boolean
  upsellCopied: boolean
  setUpsellCopied: (v: boolean) => void
  upsellError: string
  upsellCardNumber: string; setUpsellCardNumber: (v: string) => void
  upsellCardExpiry: string; setUpsellCardExpiry: (v: string) => void
  upsellCardCvv: string; setUpsellCardCvv: (v: string) => void
  upsellCardPostalCode: string; setUpsellCardPostalCode: (v: string) => void
  upsellCardAddressNumber: string; setUpsellCardAddressNumber: (v: string) => void
  handleUpsell: (e: React.FormEvent) => void
}

function UpsellBump({
  upsellPaymentMethod, setUpsellPaymentMethod,
  upsellLoading, upsellPixData, upsellSuccess,
  upsellCopied, setUpsellCopied, upsellError,
  upsellCardNumber, setUpsellCardNumber,
  upsellCardExpiry, setUpsellCardExpiry,
  upsellCardCvv, setUpsellCardCvv,
  upsellCardPostalCode, setUpsellCardPostalCode,
  upsellCardAddressNumber, setUpsellCardAddressNumber,
  handleUpsell,
}: UpsellBumpProps) {
  const inputCls = "border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#7DC142] transition-colors"

  function handleCopyUpsell() {
    if (!upsellPixData) return
    navigator.clipboard.writeText(upsellPixData.payload)
    setUpsellCopied(true)
    setTimeout(() => setUpsellCopied(false), 2000)
  }

  if (upsellSuccess) {
    return (
      <div className="w-full rounded-2xl px-6 py-5 text-center" style={{ backgroundColor: '#f0fdf4', border: '2px solid #d8f3dc' }}>
        <p className="text-2xl mb-2">✓</p>
        <p className="font-bold text-[#141F0C] text-base">Sessão adicionada!</p>
        <p className="text-[#476B18] text-sm mt-1">Você receberá o link de agendamento por e-mail em instantes.</p>
      </div>
    )
  }

  if (upsellPixData) {
    return (
      <div className="w-full rounded-2xl px-6 py-5 flex flex-col gap-4" style={{ border: '2px dashed #7DC142', backgroundColor: '#f0fdf4' }}>
        <p className="font-bold text-[#141F0C] text-sm text-center">PIX da sessão — escaneie para concluir</p>
        <div className="flex justify-center">
          <img src={`data:image/png;base64,${upsellPixData.qrCode}`} alt="QR Code PIX Sessão" className="w-44 h-44 rounded-xl border-2 border-[#7DC142]" />
        </div>
        <div className="flex gap-2 items-stretch">
          <input readOnly value={upsellPixData.payload} className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 bg-white font-mono truncate" />
          <button type="button" onClick={handleCopyUpsell} className="px-3 py-2.5 text-white rounded-xl text-xs font-bold flex-shrink-0" style={{ backgroundColor: LIME }}>
            {upsellCopied ? '✓' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-[#476B18] text-center">Você receberá o link de agendamento assim que o PIX for confirmado.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl px-6 py-5 flex flex-col gap-4" style={{ border: '2px dashed #7DC142', backgroundColor: '#f9fff5' }}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">💡</span>
        <div>
          <p className="font-black text-[#141F0C] text-base leading-tight">Oferta especial · só agora</p>
          <p className="text-[#476B18] text-sm mt-1 leading-relaxed">
            Adicione <strong>1hr de consultoria individual</strong> sobre agrofloresta sintrópica — tire dúvidas do seu projeto: escolha de espécies, desenho de consórcio, leitura de área.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm line-through">R$197</span>
        <span className="font-black text-[#141F0C] text-xl">R$140</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: LIME + '22', color: LIME }}>oferta exclusiva</span>
      </div>
      <form onSubmit={handleUpsell} className="flex flex-col gap-3">
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
          <button type="button" onClick={() => setUpsellPaymentMethod('pix')}
            className="flex-1 py-3 text-sm font-bold transition-colors"
            style={upsellPaymentMethod === 'pix' ? { backgroundColor: LIME, color: '#fff' } : { backgroundColor: '#fff', color: FOREST }}>
            PIX
          </button>
          <button type="button" onClick={() => setUpsellPaymentMethod('card')}
            className="flex-1 py-3 text-sm font-bold transition-colors border-l-2 border-gray-200"
            style={upsellPaymentMethod === 'card' ? { backgroundColor: LIME, color: '#fff' } : { backgroundColor: '#fff', color: FOREST }}>
            Cartão
          </button>
        </div>
        {upsellPaymentMethod === 'card' && (
          <div className="flex flex-col gap-2">
            <input type="text" required inputMode="numeric" placeholder="Número do cartão" value={upsellCardNumber}
              onChange={e => setUpsellCardNumber(formatCardNumber(e.target.value))} className={inputCls} />
            <div className="flex gap-2">
              <input type="text" required inputMode="numeric" placeholder="Validade (MM/AA)" value={upsellCardExpiry}
                onChange={e => setUpsellCardExpiry(formatExpiry(e.target.value))} className={inputCls + ' flex-1'} />
              <input type="text" required inputMode="numeric" placeholder="CVV" value={upsellCardCvv}
                onChange={e => setUpsellCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputCls + ' w-24'} />
            </div>
            <div className="flex gap-2">
              <input type="text" required inputMode="numeric" placeholder="CEP" value={upsellCardPostalCode}
                onChange={e => setUpsellCardPostalCode(formatCep(e.target.value))} className={inputCls + ' flex-1'} />
              <input type="text" required placeholder="Número" value={upsellCardAddressNumber}
                onChange={e => setUpsellCardAddressNumber(e.target.value)} className={inputCls + ' w-24'} />
            </div>
          </div>
        )}
        {upsellError && <p className="text-red-500 text-xs font-medium">{upsellError}</p>}
        <button type="submit" disabled={upsellLoading}
          className="py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100"
          style={{ backgroundColor: LIME, color: DARK }}>
          {upsellLoading ? 'Aguarde...' : 'Adicionar sessão por R$140 →'}
        </button>
      </form>
    </div>
  )
}

function InfographicsCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const n = INFOGRAPHICS.length

  const go = useCallback((i: number) => setActive((i + n) % n), [n])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => setActive(a => (a + 1) % n), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, n])

  return (
    <section className="py-28 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-4" style={{ color: LIME }}>
            Visual e direto
          </p>
          <h2 className="font-serif font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: DARK }}>
            O conhecimento que você vai carregar.
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            25+ infográficos criados exclusivamente para este guia.
            Visuais que explicam em segundos o que textos levam páginas.
          </p>
        </div>

        {/* imagem principal */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-6 bg-gray-50"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <Image
            key={active}
            src={INFOGRAPHICS[active].src}
            alt={INFOGRAPHICS[active].label}
            width={1200} height={675}
            className="w-full h-auto object-contain"
            priority
          />
          {/* legenda */}
          <div className="absolute bottom-0 inset-x-0 px-6 py-5"
            style={{ background: 'linear-gradient(to top, rgba(20,31,12,0.92) 0%, transparent 100%)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: LIME }}>
              {INFOGRAPHICS[active].cap}
            </p>
            <p className="text-white font-black text-lg leading-snug">
              {INFOGRAPHICS[active].label}
            </p>
          </div>
          {/* nav lateral */}
          <button onClick={() => go(active - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white text-xl flex items-center justify-center transition-colors"
            aria-label="Anterior">‹</button>
          <button onClick={() => go(active + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white text-xl flex items-center justify-center transition-colors"
            aria-label="Próximo">›</button>
        </div>

        {/* thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {INFOGRAPHICS.map((info, i) => (
            <button key={info.src} onClick={() => { setPaused(true); go(i) }}
              className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200"
              style={{
                width: 80, height: 56,
                outline: i === active ? `3px solid ${LIME}` : '3px solid transparent',
                opacity: i === active ? 1 : 0.5,
              }}>
              <Image src={info.src} alt={info.cap} width={80} height={56}
                className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* dots */}
        <div className="flex justify-center gap-2 mt-5">
          {INFOGRAPHICS.map((_, i) => (
            <button key={i} onClick={() => { setPaused(true); go(i) }}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: i === active ? LIME : '#d1d5db', transform: i === active ? 'scale(1.4)' : 'scale(1)' }}
              aria-label={`Ir para ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function EbookLandingPage() {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const prevPage = useCallback(() => setLightbox(i => i !== null ? (i - 1 + PAGES.length) % PAGES.length : null), [])
  const nextPage = useCallback(() => setLightbox(i => i !== null ? (i + 1) % PAGES.length : null), [])

  useEffect(() => {
    ;(window as any).fbq?.('track', 'ViewContent', { content_name: 'Guia Agrofloresta Sintrópica', content_type: 'product', value: 67, currency: 'BRL' })
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: '/ebook',
        utm_source: p.get('utm_source'),
        utm_medium: p.get('utm_medium'),
        utm_campaign: p.get('utm_campaign'),
        referer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#141F0C]">
      {lightbox !== null && (
        <PageLightbox index={lightbox} onClose={closeLightbox} onPrev={prevPage} onNext={nextPage} />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-12 md:py-28" style={{ backgroundColor: DARK }}>
        {/* background: hero_capa embaçada e escurecida */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero_capa.jpg" alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: 'brightness(0.75) saturate(0.9)', transformOrigin: 'center' }} />
        </div>
        {/* overlay: transparente no topo, escurece na base para leitura */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,16,6,0.05) 0%, rgba(10,16,6,0.55) 100%)' }} />

        {/* grid: mobile 1 col (título→capa→corpo), desktop 2 col (esq: título+corpo | dir: capa) */}
        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16">

          {/* 1 — título (mobile: row 1 | desktop: col 1 row 1) */}
          <div className="md:row-start-1 md:col-start-1 min-w-0 text-center md:text-left">
            <p className="font-sans text-white text-base md:text-lg font-semibold uppercase tracking-[0.2em] mb-3 md:mb-4">
              Guia de Introdução à
            </p>
            <h1 className="leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="block text-white" style={{ fontSize: 'clamp(4.5rem, 10vw, 8rem)' }}>
                AGROFLORESTA
              </span>
              <span className="block" style={{ fontSize: 'clamp(3.8rem, 8.5vw, 7.2rem)', color: LIME }}>
                SINTRÓPICA
              </span>
            </h1>
          </div>

          {/* 2 — capa (mobile: row 2 | desktop: col 2 abrange as 2 rows) */}
          <div className="md:row-start-1 md:row-end-3 md:col-start-2 flex justify-center md:justify-end md:items-center">
            <div className="relative w-full max-w-[260px] sm:max-w-[340px] md:max-w-[480px]">
              <div className="absolute -inset-6 rounded-3xl opacity-20 blur-3xl" style={{ backgroundColor: LIME }} />
              <Image
                src="/capa_livro.png"
                alt="Guia de Introdução à Agrofloresta Sintrópica, Michel Bottan"
                width={600} height={560}
                className="relative w-full drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.6))' }}
                priority
              />
            </div>
          </div>

          {/* 3 — corpo: voz na cabeça + bullets como pensamentos internos */}
          <div className="md:row-start-2 md:col-start-1 min-w-0 text-center md:text-left">
            <p className="font-sans text-xl md:text-2xl text-gray-200 leading-snug mb-5 font-semibold">
              A lógica da agrofloresta sintrópica, explicada do começo ao fim. Para você saber exatamente o que plantar, quando e por quê.
            </p>

            <p className="font-sans text-sm md:text-base uppercase tracking-widest mb-3 font-bold" style={{ color: LIME }}>
              Este guia é para você se reconhece algum destes pensamentos:
            </p>

            <div className="mb-0 flex flex-col gap-2.5 text-left">
              {[
                'Quero começar, mas tenho medo de tomar as decisões erradas logo no início.',
                'Preciso entender a lógica antes de plantar qualquer coisa.',
                'Tenho terra. Cada ano sem um sistema funcionando é um ano perdido.',
                'Ainda não tenho terra, mas quando vier, quero estar pronto.',
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-[7px] w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LIME }} />
                  <p className="font-sans text-gray-100 text-lg md:text-xl leading-snug font-semibold">{line}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── STRIP DE CREDIBILIDADE ───────────────────────────── */}
      <div style={{ backgroundColor: LIME, color: DARK }} className="py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
          <span>207 páginas</span>
          <span>·</span>
          <span>27 capítulos</span>
          <span>·</span>
          <span>25+ infográficos</span>
        </div>
      </div>

      {/* ── AGITAÇÃO ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: CREAM }} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center font-semibold uppercase tracking-[0.2em] text-sm mb-5" style={{ color: FOREST }}>
            O que está em jogo
          </p>
          <h2 className="font-serif font-black text-center mb-16 leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: DARK }}>
            A maioria começa errado. E só descobre depois.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Plantar diferente de como a natureza planta é ir contra ela.',
                body: 'A natureza tem uma lógica própria e ela sempre prevalece. Quando você ignora essa lógica, seus cultivos trabalham contra um sistema que é maior do que qualquer técnica.',
              },
              {
                title: 'Começar sem entender a lógica por trás é um gasto de energia.',
                body: 'Você se esforça, planta, poda, irriga e os resultados não aparecem como esperado. Não porque você fez pouco, mas porque fez sem o fundamento que transforma esforço em sistema.',
              },
              {
                title: 'Cada ano parado é um ano perdido.',
                body: 'Agrofloresta é construção de solo e de tempo. Um sistema mal planejado no início exige anos de correção. O tempo que você espera para começar certo não volta.',
              },
            ].map(card => (
              <div key={card.title} className="flex flex-col gap-3">
                <div className="w-8 h-px" style={{ backgroundColor: FOREST, opacity: 0.5 }} />
                <h3 className="font-serif font-black text-xl leading-snug" style={{ color: DARK }}>{card.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: '#4a5240' }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIMEIRO GUIA PONTA A PONTA ──────────────────────── */}
      <section style={{ backgroundColor: DARK }} className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center font-semibold uppercase tracking-[0.2em] text-sm mb-5" style={{ color: LIME }}>
            O que faltava
          </p>
          <h2 className="font-serif font-black text-center mb-6 leading-tight text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            O primeiro guia de ponta a ponta<br />sobre agrofloresta sintrópica.
          </h2>
          <p className="text-center text-gray-400 text-xl mb-16 max-w-2xl mx-auto leading-relaxed">
            Ao final, você entende a lógica da floresta, sabe ler a sua terra e consegue planejar um sistema produtivo. Você sai com o mapa antes de entrar na floresta.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PAIN_CARDS.map((card, i) => (
              <div key={card.title} className="rounded-2xl p-8 flex flex-col gap-4" style={{ backgroundColor: '#1A3410', border: '1px solid #2D5420' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: LIME }}>{card.label}</p>
                  <span className="text-xs font-bold tracking-widest" style={{ color: LIME, opacity: 0.4 }}>0{i + 1}</span>
                </div>
                <div className="w-8 h-px" style={{ backgroundColor: LIME, opacity: 0.4 }} />
                <h3 className="font-black text-lg leading-snug text-white">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── PIVOT — GÖTSCH ───────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto">

          {/* texto */}
          <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-6" style={{ color: FOREST }}>
            A virada de perspectiva
          </p>
          <blockquote className="font-serif font-black italic leading-tight mb-10" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: DARK }}>
            "E se criássemos o ambiente certo para as plantas, em vez de adaptar as plantas ao ambiente que não é o ideal para elas?"
          </blockquote>

          {/* foto + atribuição */}
          <div className="flex items-center gap-5 mb-10">
            <Image
              src="/ernst.png"
              alt="Ernst Götsch"
              width={1536} height={1024}
              className="rounded-xl object-cover flex-shrink-0"
              style={{ width: 220, height: 160 }}
            />
            <p className="text-base font-bold uppercase tracking-widest" style={{ color: FOREST }}>Ernst Götsch</p>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed">
            Götsch desenvolveu, ao longo de décadas numa fazenda no sul da Bahia, um sistema onde o oposto da degradação acontece.
            Não adapta as plantas ao solo. Constrói o ambiente certo para a vida florescer.
            Este guia traduz essa lógica do zero, em português, com infográficos, sem pular etapas.
          </p>

        </div>
      </section>

      <div style={{ height: 4, backgroundColor: LIME }} />

      {/* ── CARROSSEL DE INFOGRÁFICOS ────────────────────────── */}
      <InfographicsCarousel />

      {/* ── PÁGINAS DO GUIA ──────────────────────────────────── */}
      <div style={{ height: 4, backgroundColor: LIME }} />
      <section style={{ backgroundColor: CREAM }} className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-4" style={{ color: FOREST }}>
              Veja por dentro
            </p>
            <h2 className="font-serif font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: DARK }}>
              Espie por dentro do ebook.
            </h2>
            <p className="text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
              Texto e infográfico integrados em cada capítulo, do conceito à visualização.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAGES.map((pg, i) => (
              <button key={pg.src} onClick={() => setLightbox(i)}
                className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 rounded-xl"
                style={{ ['--ring-color' as string]: LIME }}>
                <div className="relative overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10
                  group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-300 w-full"
                  style={{ transform: `rotate(${i % 2 === 0 ? '-0.6' : '0.6'}deg)` }}>
                  <Image
                    src={pg.src}
                    alt={pg.title}
                    width={744} height={1052}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ color: DARK }}>
                      Ver página
                    </span>
                  </div>
                </div>
                <div className="mt-4 px-1">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>{pg.cap}</p>
                  <p className="text-sm font-semibold leading-snug" style={{ color: DARK }}>{pg.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPÍTULOS ────────────────────────────────────────── */}
      <section id="dentro" style={{ backgroundColor: CREAM }} className="pt-0 pb-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-4" style={{ color: FOREST }}>
            Conteúdo completo
          </p>
          <h2 className="font-serif font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: DARK }}>
            5 partes · 27 capítulos.
          </h2>
          <p className="text-xl text-gray-500 mb-14 max-w-xl leading-relaxed">
            Uma progressão sem lacunas: da lógica da floresta ao sistema vivo na sua terra.
          </p>

          <div className="flex flex-col gap-10">
            {ALL_PARTS.map(part => (
              <div key={part.num}>
                {/* cabeçalho da parte */}
                <div className="flex items-baseline gap-4 mb-5 pb-4 border-b-2" style={{ borderColor: LIME }}>
                  <span className="font-serif font-black leading-none" style={{ fontSize: '2.8rem', color: LIME, minWidth: '2.4rem' }}>
                    {part.num}
                  </span>
                  <div>
                    <p className="font-black text-lg leading-tight" style={{ color: DARK }}>{part.title}</p>
                    <p className="text-sm italic leading-snug mt-0.5" style={{ color: FOREST }}>{part.subtitle}</p>
                  </div>
                </div>
                {/* grid de capítulos */}
                <div className="grid sm:grid-cols-2 gap-1">
                  {part.chapters.map(ch => (
                    <div key={ch.n} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/70 transition-colors">
                      <span className="font-serif font-black text-base flex-shrink-0 mt-px" style={{ color: GOLD, minWidth: '1.8rem' }}>
                        {ch.n}
                      </span>
                      <span className="text-sm font-medium leading-snug" style={{ color: DARK }}>{ch.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl px-8 py-6 text-base font-semibold" style={{ backgroundColor: DARK, color: LIME }}>
            📘 <strong className="text-white">207 páginas · 27 capítulos · 25+ infográficos exclusivos</strong>. Tudo em português, do fundamento à prática.
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS (oculto temporariamente) ──────────────── */}

      {/* ── AUTOR ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: CREAM }} className="py-28 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          {/* foto */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Image src="/michel.jpg" alt="Michel Bottan" width={400} height={400} className="w-full rounded-2xl shadow-xl object-cover" />
            <p className="font-black text-lg mt-4 text-center" style={{ color: DARK }}>Michel Bottan</p>
            <p className="text-sm text-center mt-1" style={{ color: FOREST }}>Agrofloresteiro, Permacultor · Fundador do Desperto e OpenSyntropy</p>
          </div>
          {/* texto */}
          <div className="min-w-0">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-6" style={{ color: FOREST }}>Sobre o autor</p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Michel Bottan deixou uma carreira executiva em tecnologia para se dedicar integralmente à agrofloresta.
              Há 10 anos trabalha com sistemas agroflorestais sintrópicos: em 2016 passou três meses numa formação intensiva
              com Ernst Götsch, comprou um sítio em Caçapava (SP) e construiu o <strong>Desperto</strong> (desperto.earth),
              uma propriedade que se tornou escola e laboratório.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Formado em Design em Restauração de Ecossistemas e Biorregionalização pela <strong>Gaia Education</strong>,
              participou de imersões com agricultores e educadores sintrópicos por todo o Brasil e atualmente cursa o PDC
              com <strong>David Holmgren</strong>, cocriador da permacultura.
            </p>
          </div>
        </div>
      </section>

      {/* ── GARANTIA ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-10 flex flex-col md:flex-row gap-8 items-start shadow-lg border-2" style={{ borderColor: LIME }}>
            <span className="text-6xl flex-shrink-0">🛡️</span>
            <div>
              <h3 className="font-black text-2xl mb-3" style={{ color: DARK }}>Garantia de 7 dias, sem burocracia</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Se você ler o guia e não achar que valeu cada centavo, devolvemos o pagamento integralmente.
                Sem perguntas, sem processo complicado.
                <strong className="text-[#141F0C]"> Você tem 7 dias a partir da compra.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPRAR ───────────────────────────────────────────── */}
      <section id="comprar" style={{ backgroundColor: DARK }} className="py-20 md:py-28 px-6">
        <div className="max-w-xl mx-auto">

          {/* cabeçalho da seção */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: LIME, color: DARK }}>
              ⚡ Preço de lançamento, encerra em breve
            </div>
            <h2 className="font-serif font-black text-white leading-tight mb-3"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}>
              Comece com o mapa certo.
            </h2>
          </div>

          {/* card de compra */}
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ border: `2px solid ${LIME}30` }}>
            <Suspense>
              <CheckoutForm />
            </Suspense>
          </div>

          {/* nota de urgência abaixo do card */}
          <p className="text-center text-xs text-gray-500 mt-5 leading-relaxed">
            Após o período de lançamento o preço volta a <strong className="text-gray-400">R$ 107</strong>.
            Compre agora e garanta o valor atual para sempre.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: CREAM }} className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif font-black text-center mb-14" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: DARK }}>
            Dúvidas frequentes
          </h2>
          {FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} link={item.link} />)}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ backgroundColor: DARK, borderTop: `3px solid ${LIME}` }} className="py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <a href="/reenviar" className="hover:text-white transition-colors">Já comprei</a>
            <a href="/reembolso" className="hover:text-white transition-colors">Pedir devolução</a>
          </div>
          <div className="flex items-center gap-3">
            <Image src="/opensyntropy.jpg" alt="OpenSyntropy" width={28} height={28} className="rounded-full opacity-70" />
            <p className="text-gray-500 text-xs tracking-widest uppercase">© {new Date().getFullYear()} OpenSyntropy</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
