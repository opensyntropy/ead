export default function SuccessEs() {
  return (
    <div className="min-h-screen bg-[#141F0C] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h1 className="text-3xl font-serif font-bold text-[#7DC142] mb-4">¡Pago confirmado!</h1>
        <p className="text-white/70 text-lg leading-relaxed mb-8">
          Gracias por tu compra. Recibirás un correo con tu enlace de descarga en pocos minutos.
        </p>
        <p className="text-white/40 text-sm">
          ¿No lo recibiste? Revisa tu carpeta de spam o visita{' '}
          <a href="/reenviar" className="text-[#52b788] underline">opensyntropy.earth/reenviar</a>{' '}
          para solicitar un nuevo enlace.
        </p>
      </div>
    </div>
  )
}
