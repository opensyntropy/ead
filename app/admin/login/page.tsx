import { adminLogin } from '../actions'

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
      <div className="bg-white rounded-2xl border border-[#b7e4c7] p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-xl font-serif font-bold text-[#1b4332] mb-6 text-center">Admin</h1>
        <form action={adminLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#1b4332] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#2d6a4f]"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
