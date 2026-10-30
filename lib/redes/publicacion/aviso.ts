import { MAX_INTENTOS, type Publicacion, type Resultado } from './tipos.ts'

// Los avisos por Telegram a Alejandro: qué salió y qué quedó funcionando, o por qué no salió.

type Datos = Pick<Publicacion, 'titulo' | 'colaborador' | 'facebook' | 'historias'> & { comenta: { palabras: string[] } | null }

// Hora de Costa Rica, con espacios normales («10:00 a. m.»)
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Costa_Rica' }).replace(/\s/g, ' ')

export function avisoListo(p: Datos, r: Resultado): string {
  const ig = r.instagram
  const lineas = [`✅ Ya salió ${p.titulo}${ig ? ` (${hora(ig.en)})` : ''}`, `Instagram: ${ig?.permalink ?? ig?.id ?? 'sin datos'}`]
  if (p.comenta) {
    const c = r.comentaIg
    const estado = c && 'id' in c ? 'activos' : `FALLARON (${c && 'error' in c ? c.error : 'sin crear'})`
    lineas.push(`Mensajes de «Comenta ${p.comenta.palabras[0].toUpperCase()}»: ${estado}`)
  }
  if (p.facebook) {
    const f = r.facebook
    let estado = 'no salió'
    if (f?.error) estado = `no salió (${f.error})`
    else if (f) {
      estado = f.url ?? f.postId ?? 'publicado'
      if (p.comenta) estado += f.automatizacion ? ' · mensajes activos' : ` · SIN mensajes${f.errorComenta ? ` (${f.errorComenta})` : ''}`
    }
    lineas.push(`Facebook: ${estado}`)
  }
  if (p.colaborador) lineas.push(`Collab con @${p.colaborador}: ${r.collab ?? 'sin datos'}`)
  if (p.historias.length) {
    const bien = (r.historias ?? []).filter((h) => h && !h.startsWith('error')).length
    lineas.push(`Historias: ${bien} de ${p.historias.length}`)
  }
  return lineas.join('\n')
}

// intento null: no se reintenta (al post le falta algo)
export function avisoError(titulo: string, intento: number | null, motivo: string): string {
  return intento === null ? `❌ ${titulo} no salió: ${motivo}` : `❌ ${titulo} no salió (intento ${intento} de ${MAX_INTENTOS}): ${motivo}`
}
