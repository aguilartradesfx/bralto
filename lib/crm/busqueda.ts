// El buscador de contactos: lo que se escribe, en los términos que se buscan en crm_contactos.busqueda (todo en
// minúsculas y sin tildes). Un teléfono se busca solo por sus números: «8888-1234» encuentra +50688881234.

export const POR_PAGINA = 30

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function terminosDeBusqueda(q: unknown): string[] {
  if (typeof q !== 'string') return []
  const texto = q.trim().slice(0, 100)
  if (!texto) return []
  // Parece teléfono: solo números, espacios, guiones, paréntesis y el +
  if (/^[+\d\s().-]+$/.test(texto)) {
    const digitos = texto.replace(/\D/g, '')
    return digitos.length >= 3 ? [digitos] : []
  }
  return sinTildes(texto.toLowerCase())
    .replace(/ñ/g, 'n')
    .replace(/[%_*\\,()"]/g, ' ') // comodines y caracteres del filtro: fuera
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
}

// ?pagina=3 → 3; cualquier otra cosa, la primera
export function leerPagina(valor: unknown): number {
  const n = typeof valor === 'string' && /^\d{1,5}$/.test(valor) ? Number(valor) : 1
  return n >= 1 ? n : 1
}

export const totalPaginas = (total: number) => Math.max(1, Math.ceil(total / POR_PAGINA))

// Los enlaces de la lista conservan la búsqueda y el filtro
export function enlaceLista(params: { q?: string; etiqueta?: string; pagina?: number }): string {
  const u = new URLSearchParams()
  if (params.q?.trim()) u.set('q', params.q.trim())
  if (params.etiqueta) u.set('etiqueta', params.etiqueta)
  if (params.pagina && params.pagina > 1) u.set('pagina', String(params.pagina))
  const s = u.toString()
  return s ? `/crm?${s}` : '/crm'
}
