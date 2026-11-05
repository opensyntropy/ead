import { Montserrat } from 'next/font/google'

// Página de vendas na identidade Desperto: Montserrat, como na home e nos vídeos.
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap' })

export default function GuiaAgroflorestaLayout({ children }: { children: React.ReactNode }) {
  return <div className={montserrat.className}>{children}</div>
}
