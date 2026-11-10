import { MAX_INTENTOS, type Publicacion, type Resultado } from './tipos.ts'

// Los avisos por Telegram a Alejandro: qué salió y qué quedó funcionando, o por qué no salió.

type Datos = Pick<Publicacion, 'titulo' | 'colaborador' | 'facebook' | 'historias'> & { comenta: { palabras: string[] } | null }

// Hora de Costa Rica, con espacios normales («10:00 a. m.»)
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Costa_Rica' }).replace(/\s/g, ' ')

// También lo usa el aviso de la ganadora de las pruebas
export function estadoTikTok(t: NonNullable<Resultado['tiktok']>, conComenta: boolean): string {
  if (!t.zernioId) return `no salió (${t.error ?? 'sin motivo'})`
  let estado = t.programado ? `sale a las ${hora(t.programado)}` : 'programado'
  if (conComenta) estado += t.automatizacion ? ' · respuestas activas' : ` · SIN respuestas${t.errorComenta ? ` (${t.errorComenta})` : ''}`
  return estado
}

export function avisoListo(p: Datos, r: Resultado): string {
  const ig = r.instagram
  const lineas = [`✅ Ya salió ${p.titulo}${ig ? ` (${hora(ig.en)})` : ''}`, `Instagram: ${ig?.permalink ?? ig?.id ?? 'sin datos'}`]
  if (p.comenta) {
    const c = r.comentaIg
    const estado = c && 'id' in c ? 'activos' : `FALLARON (${c && 'error' in c ? c.error : 'sin crear'})`
    const palabra = p.comenta.palabras[0]
    lineas.push(`Mensajes ${palabra ? `de «Comenta ${palabra.toUpperCase()}»` : 'del «Comenta»'}: ${estado}`)
  }
  if (p.facebook) {
    const f = r.facebook
    let estado = 'no salió'
    if (f?.error) estado = `no salió (${f.error})`
    else if (f) {
      estado = f.url ?? f.postId ?? (f.estado ? `en proceso en Zernio (${f.estado})` : 'publicado')
      if (p.comenta) estado += f.automatizacion ? ' · mensajes activos' : ` · SIN mensajes${f.errorComenta ? ` (${f.errorComenta})` : ''}`
    }
    lineas.push(`Facebook: ${estado}`)
  }
  if (r.tiktok) lineas.push(`TikTok: ${estadoTikTok(r.tiktok, Boolean(p.comenta))}`)
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

// Una publicación que se cortó a la mitad y ya no se reintenta: si Instagram alcanzó a salir, no se dice
// que no salió (invitaría a publicarla otra vez a mano)
export function avisoCortada(titulo: string, intento: number, r: Resultado): string {
  const ig = r.instagram
  if (ig) return `⚠️ ${titulo} salió en Instagram (${ig.permalink ?? ig.id}), pero la publicación se cortó a la mitad. Revisa Facebook, la collab y las historias.`
  return avisoError(titulo, intento, 'se cortó a la mitad; revisa qué alcanzó a salir')
}
