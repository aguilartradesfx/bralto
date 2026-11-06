import { horaCR } from '../../calendario/fechas.ts'
import { hora12 } from '../asistente.ts'
import type { Publicacion } from '../publicacion/tipos.ts'
import type { Metricas, Prueba, ResultadoPrueba } from './tipos.ts'

// La decisión de cada prueba (lógica pura). Las 5 versiones de un reel corren 72 h con gente que no sigue la cuenta;
// después gana la que más gente se quedó viendo pasados los primeros 3 segundos, las demás se borran, la ganadora
// sale en Facebook y Alejandro recibe el aviso para tocar «Compartir con seguidores» (Meta no deja hacerlo por la
// API). Cada paso queda en `resultado` apenas termina: si una corrida se corta, la siguiente sigue sin repetir.
// Las conexiones reales están en servidor.ts; acá todo llega por `EfectosPrueba`, para probarlo.

export const ESPERA_MS = 72 * 3600_000
export const GRACIA_MS = 24 * 3600_000 // Meta puede tardar hasta 48 h en dar las métricas
const TARDE_MS = 3 * 3600_000 // un borrador cuya hora pasó hace más de esto ya no va a salir

export type CambiosPrueba = Partial<Pick<Prueba, 'estado' | 'decidir_en' | 'ganadora' | 'resultado'>> & { ultimo_error?: string | null }

export type EfectosPrueba = {
  metricas(mediaId: string): Promise<Metricas | 'sin_datos' | 'no_existe'>
  borrar(mediaId: string): Promise<void>
  publicarFacebook(p: Publicacion): Promise<{ postId: string | null; url: string | null }>
  crearComentaFb(postId: string, p: Publicacion): Promise<string>
  guardar(grupo: string, cambios: CambiosPrueba): Promise<void>
  avisar(texto: string): Promise<void>
  ahora(): number
}

const mensaje = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300)
const esMedida = (m: unknown): m is Metricas => typeof m === 'object' && m !== null

// Cuánta gente se quedó después del gancho: las vistas menos las que la pasaron en los primeros 3 segundos
export function puntaje(m: Metricas): number {
  return m.views * (1 - (m.skip ?? 100) / 100)
}

// La de mayor puntaje; si empatan, la que vieron más tiempo y después la más compartida y guardada.
// null si ninguna tuvo vistas
export function elegirGanadora(medidas: Record<string, Metricas>): string | null {
  const conVistas = Object.entries(medidas).filter(([, m]) => m.views > 0)
  if (!conVistas.length) return null
  conVistas.sort(
    ([, a], [, b]) =>
      puntaje(b) - puntaje(a) || (b.promedioMs ?? 0) - (a.promedioMs ?? 0) || b.shares + b.saved - (a.shares + a.saved),
  )
  return conVistas[0][0]
}

// De cada 10 personas, cuántas se quedaron después del gancho (null si Meta no dio el dato)
const deCada10 = (m: Metricas) => (m.skip === null ? null : Math.round(10 * (1 - m.skip / 100)))
const salida = (v: Publicacion) => v.resultado?.instagram?.en ?? v.publicar_en

function linea(v: Publicacion, m: Metricas | 'sin_datos' | 'no_existe' | undefined): string {
  const inicio = `${v.version} · ${hora12(horaCR(salida(v)))}`
  if (m === 'no_existe') return `${inicio} · ya no estaba en Instagram`
  if (!esMedida(m)) return `${inicio} · sin datos todavía`
  const quedan = deCada10(m)
  return `${inicio} · ${m.views.toLocaleString('en-US')} vistas${quedan === null ? '' : ` · ${quedan} de cada 10 se quedaron`}`
}

// El mensaje de Telegram: tuteo y que se entienda a la primera
export function avisoGanadora(p: Prueba, versiones: Publicacion[], r: ResultadoPrueba): string {
  const salieron = versiones.filter((v) => v.resultado?.instagram).sort((a, b) => (a.version ?? 0) - (b.version ?? 0))
  const lineas = salieron.map((v) => linea(v, r.metricas?.[v.id]))
  const g = salieron.find((v) => v.id === r.ganadora)
  const partes: string[] = []
  if (g) {
    const m = r.metricas?.[g.id]
    const quedan = esMedida(m) ? deCada10(m) : null
    partes.push(`🏆 Ganó la versión ${g.version} de «${p.titulo}»`)
    if (quedan !== null) partes.push(`De cada 10 personas, ${quedan} se quedaron después del gancho.`)
    partes.push(`Ábrela aquí y toca «Compartir con seguidores»: ${g.resultado?.instagram?.permalink ?? '(no tengo el enlace: búscala en tus reels de prueba)'}`)
  } else {
    partes.push(`😕 Ninguna versión de «${p.titulo}» tuvo vistas, así que no borré nada. Revísalas en tus reels de prueba.`)
  }
  partes.push('', 'Cómo le fue a cada una:', ...lineas)
  const fallidas = Object.values(r.borradas ?? {}).filter((b) => b !== 'ok').length
  if (fallidas) partes.push('', `⚠️ No pude borrar ${fallidas} ${fallidas === 1 ? 'versión' : 'versiones'}: bórrala${fallidas === 1 ? '' : 's'} tú en Instagram.`)
  if (r.facebook?.error) partes.push('', `⚠️ En Facebook no salió: ${r.facebook.error}`)
  return partes.join('\n')
}

// ¿Todavía puede salir? Programada o publicándose, o en borrador con su hora por delante (o recién pasada)
function pendiente(v: Publicacion, ahora: number): boolean {
  if (v.estado === 'programado' || v.estado === 'publicando') return true
  return v.estado === 'borrador' && Date.parse(v.publicar_en) >= ahora - TARDE_MS
}

// Un paso del grupo. Devuelve qué hizo, en una línea, para el log
export async function avanzarGrupo(p: Prueba, versiones: Publicacion[], e: EfectosPrueba): Promise<string> {
  if (p.estado === 'decidida' || p.estado === 'cancelada' || p.estado === 'error') return 'nada que hacer'
  const ahora = e.ahora()
  const salieron = versiones.filter((v) => v.resultado?.instagram)

  if (p.estado === 'programada') {
    if (versiones.some((v) => pendiente(v, ahora))) return 'faltan versiones por salir'
    if (!salieron.length) {
      await e.guardar(p.grupo, { estado: 'cancelada' })
      return 'cancelada: no salió ninguna versión'
    }
    const ultima = Math.max(...salieron.map((v) => Date.parse(v.resultado.instagram!.en)))
    const decidir_en = new Date(ultima + ESPERA_MS).toISOString()
    await e.guardar(p.grupo, { estado: 'corriendo', decidir_en })
    return `corriendo: decide el ${decidir_en}`
  }

  if (!p.decidir_en || ahora < Date.parse(p.decidir_en)) return 'todavía no'
  const r: ResultadoPrueba = structuredClone(p.resultado ?? {})

  // 1. Las métricas de cada versión que salió (lo ya leído no se vuelve a pedir)
  r.metricas ??= {}
  let leidas = false
  for (const v of salieron) {
    if (esMedida(r.metricas[v.id]) || r.metricas[v.id] === 'no_existe') continue
    r.metricas[v.id] = await e.metricas(v.resultado.instagram!.id)
    leidas = true
  }
  if (leidas) await e.guardar(p.grupo, { resultado: r })
  const faltan = salieron.some((v) => r.metricas![v.id] === 'sin_datos')
  if (faltan && ahora < Date.parse(p.decidir_en) + GRACIA_MS) return 'espera métricas'

  // 2. La ganadora
  if (r.ganadora === undefined) {
    const medidas: Record<string, Metricas> = {}
    for (const v of salieron) {
      const m = r.metricas[v.id]
      if (esMedida(m)) medidas[v.id] = m
    }
    r.ganadora = elegirGanadora(medidas)
    await e.guardar(p.grupo, { resultado: r })
  }
  const ganadora = salieron.find((v) => v.id === r.ganadora) ?? null

  if (ganadora) {
    // 3. Borrar las demás (las que ya no existen, no)
    r.borradas ??= {}
    for (const v of salieron) {
      if (v.id === ganadora.id || r.metricas[v.id] === 'no_existe' || r.borradas[v.id] === 'ok') continue
      try {
        await e.borrar(v.resultado.instagram!.id)
        r.borradas[v.id] = 'ok'
      } catch (err) {
        r.borradas[v.id] = mensaje(err)
      }
      await e.guardar(p.grupo, { resultado: r })
    }

    // 4. Facebook: solo la ganadora, con su «Comenta»
    if (p.facebook && !r.facebook) {
      try {
        r.facebook = { ...(await e.publicarFacebook(ganadora)) }
      } catch (err) {
        r.facebook = { postId: null, url: null, error: mensaje(err) }
      }
      await e.guardar(p.grupo, { resultado: r })
    }
    if (r.facebook?.postId && ganadora.comenta && !r.facebook.automatizacion && !r.facebook.error) {
      try {
        r.facebook.automatizacion = await e.crearComentaFb(r.facebook.postId, ganadora)
      } catch (err) {
        r.facebook.error = `el «Comenta» de Facebook: ${mensaje(err)}`
      }
      await e.guardar(p.grupo, { resultado: r })
    }
  }

  // 5. El aviso, una sola vez
  if (!r.aviso) {
    await e.avisar(avisoGanadora(p, versiones, r))
    r.aviso = new Date(ahora).toISOString()
  }
  await e.guardar(p.grupo, { estado: 'decidida', ganadora: r.ganadora ?? null, resultado: r, ultimo_error: null })
  return ganadora ? `decidida: ganó la versión ${ganadora.version}` : 'decidida: ninguna versión tuvo vistas'
}
