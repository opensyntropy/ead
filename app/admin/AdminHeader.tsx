'use client'
import { useState } from 'react'
import AdminActions from './AdminActions'
import { adminLogout } from './actions'

export default function AdminHeader() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="bg-[#1b4332] text-white px-6 py-4 flex items-center justify-between font-sans">
        <div className="flex items-center gap-3">
          <span className="text-[#52b788] font-bold tracking-widest uppercase">OpenSyntropy</span>
          <span className="text-[#52b788]/40">·</span>
          <span className="text-white/70 font-medium">Painel Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/relatorios"
            className="text-sm font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-4 py-1.5 transition-colors"
          >
            Relatórios
          </a>
          <a
            href="/admin/devolucoes"
            className="text-sm font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-4 py-1.5 transition-colors"
          >
            Devoluções
          </a>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-4 py-1.5 transition-colors flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Acesso manual</span>
          </button>
          <form action={adminLogout}>
            <button
              type="submit"
              className="text-sm text-white/50 hover:text-white/90 transition-colors border border-white/20 rounded-lg px-3 py-1.5"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-[#52b788]" />
                <h2 className="text-xl font-bold text-[#1b4332]">Adicionar acesso manual</h2>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <AdminActions mode="add" />
          </div>
        </div>
      )}
    </>
  )
}
