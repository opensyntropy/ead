// Telefones são armazenados como digitados no checkout: brasileiros com máscara
// "(11) 91234-5678" (sem código de país) e estrangeiros com "+" e DDI, ex.
// "+351912345678". Estas funções normalizam os dois formatos.

export function isInternationalPhone(raw: string): boolean {
  const t = raw.trim()
  return t.startsWith('+') && !t.replace(/\D/g, '').startsWith('55')
}

// Máscara do input: BR quando não começa com "+", senão livre (até 15 dígitos, E.164).
export function formatPhoneInput(value: string): string {
  if (value.trim().startsWith('+')) {
    // Sem agrupar: o tamanho do DDI varia (1 a 3 dígitos).
    return '+' + value.replace(/\D/g, '').slice(0, 15)
  }
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// Número completo com DDI, só dígitos (formato do wa.me).
export function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return digits
  return digits.startsWith('55') ? digits : `55${digits}`
}

// Celular brasileiro sem DDI (DDD + número), ou null se for estrangeiro/vazio.
export function toBrazilianLocal(raw: string): string | null {
  if (!raw.trim() || isInternationalPhone(raw)) return null
  const digits = raw.replace(/\D/g, '')
  const local = raw.trim().startsWith('+') ? digits.slice(2) : digits
  return local || null
}
