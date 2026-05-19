export default function SuccessEn() {
  return (
    <div className="min-h-screen bg-[#141F0C] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h1 className="text-3xl font-serif font-bold text-[#7DC142] mb-4">Payment confirmed!</h1>
        <p className="text-white/70 text-lg leading-relaxed mb-8">
          Thank you for your purchase. You'll receive an email with your download link within a few minutes.
        </p>
        <p className="text-white/40 text-sm">
          Didn't receive it? Check your spam folder or visit{' '}
          <a href="/reenviar" className="text-[#52b788] underline">opensyntropy.earth/reenviar</a>{' '}
          to request a new link.
        </p>
      </div>
    </div>
  )
}
