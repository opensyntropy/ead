'use client'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export default function AnalyticsScripts() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  const cybereco = process.env.NEXT_PUBLIC_CYBERECO_URL

  return (
    <>
      {cybereco && <Script src={`${cybereco}/t.js`} data-site="ead" strategy="afterInteractive" />}
      <Script src="/clarity-init.js" strategy="afterInteractive" />
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','1292728729653308');
        if (window.location.pathname !== '/ebook') { fbq('track','PageView'); }
      `}</Script>
    </>
  )
}
