// El contexto del día y el pedido a Claude para la tertulia de la Oficina de Knox.
// Todo es puro: recibe datos ya leídos y devuelve texto o estructuras.

import type { Agente, FilaSemana, Marca } from './tipos.ts'
import type { CtxValidar } from './validar.ts'
import { TOPES, LARGOS, taparClientes } from './validar.ts'
import { fechaCR, horaCR } from './horario.ts'

export type DatosRonda = {
  agentes: Agente[]
  marcas: Marca[]
  semana: FilaSemana[]
  pruebas: { titulo: string, estado: string, actualizado_en: string }[]
  reels: { titulo: string, version: number | null, vistas: number | null, guardados: number | null, publicado_en: string }[]
  ideasNuevas: { texto: string, de: string }[]
  foroReciente: { id: string, de: string, tipo: string, titulo: string, comentarios: number }[]
  conFoto: string[]
  prohibidos: string[]
  // Ya hay una escena esperando su foto (la que tomaría el generador): hoy no va otra
  escenaEsperando: boolean
}

export type Contexto = {
  fecha: string
  hora: string
  agentes: { id: string, nombre: string, oficio: string, area: string, personalidad: string, frase: string, con_foto: boolean }[]
  hechos: { clave: string, texto: string }[]
  ideas_pendientes: { texto: string, de: string }[]
  foro_reciente: DatosRonda['foroReciente']
  escena_esperando: boolean
}

const MAX_MARCAS = 120
const DIA_MS = 24 * 60 * 60_000

const hablan = (d: DatosRonda) => d.agentes.filter(a => a.estado_fijo !== 'pendiente')

export function armarContexto(d: DatosRonda, ahora: Date): Contexto {
  const activos = hablan(d)
  const nombres = new Map(d.agentes.map(a => [a.id, a.nombre]))
  const nombre = (id: string) => nombres.get(id) ?? id
  const hechos: Contexto['hechos'] = []
  const tapar = (t: string) => taparClientes(t, d.prohibidos)

  const desde = ahora.getTime() - DIA_MS
  const marcas = d.marcas
    .filter(m => m.tipo !== 'empieza')
    .filter(m => { const t = Date.parse(m.creado_en); return t >= desde && t <= ahora.getTime() })
    .sort((a, b) => Date.parse(b.creado_en) - Date.parse(a.creado_en))
    .slice(0, MAX_MARCAS)
  marcas.forEach((m, i) => {
    const quien = m.para ? `${nombre(m.agente)} → ${nombre(m.para)}` : nombre(m.agente)
    hechos.push({ clave: `m${i + 1}`, texto: `${horaCR(new Date(m.creado_en))} · ${quien}: ${tapar(m.texto)}` })
  })

  const primerDia = fechaCR(new Date(ahora.getTime() - 6 * DIA_MS))
  let n = 0
  for (const a of activos) {
    const filas = d.semana.filter(f => f.agente === a.id && f.dia >= primerDia)
    const tareas = filas.reduce((s, f) => s + f.tareas, 0)
    const fallas = filas.filter(f => f.falla).length
    if (tareas === 0 && fallas === 0) continue
    const partes = [`${tareas} ${tareas === 1 ? 'tarea' : 'tareas'} en 7 días`]
    if (fallas > 0) partes.push(`${fallas} ${fallas === 1 ? 'día con falla' : 'días con fallas'}`)
    hechos.push({ clave: `n${++n}`, texto: `${a.nombre}: ${partes.join(', ')}` })
  }

  d.pruebas.forEach((p, i) => hechos.push({ clave: `p${i + 1}`, texto: `Prueba «${tapar(p.titulo)}»: ${p.estado}` }))

  d.reels.forEach((r, i) => {
    const version = r.version != null ? `, versión ${r.version}` : ''
    const cifras = [
      r.vistas != null ? `${r.vistas} vistas` : null,
      r.guardados != null ? `${r.guardados} guardados` : null,
    ].filter(Boolean).join(' y ')
    hechos.push({ clave: `r${i + 1}`, texto: `Reel «${tapar(r.titulo)}»${version}${cifras ? `: ${cifras}` : ''}` })
  })

  const foto = new Set(d.conFoto)
  return {
    fecha: fechaCR(ahora),
    hora: horaCR(ahora),
    agentes: activos.map(a => ({
      id: a.id, nombre: a.nombre, oficio: a.oficio, area: a.area,
      personalidad: a.personalidad, frase: a.frase, con_foto: foto.has(a.id),
    })),
    hechos,
    ideas_pendientes: d.ideasNuevas.map(i => ({ ...i, texto: tapar(i.texto) })),
    foro_reciente: d.foroReciente.map(p => ({ ...p, titulo: tapar(p.titulo) })),
    escena_esperando: d.escenaEsperando,
  }
}

export function ctxValidar(d: DatosRonda, c: Contexto, ahora: Date): CtxValidar {
  return {
    hablan: new Set(c.agentes.map(a => a.id)),
    conFoto: new Set(c.agentes.filter(a => a.con_foto).map(a => a.id)),
    hechos: new Set(c.hechos.map(h => h.clave)),
    postsViejos: new Set(d.foroReciente.map(p => p.id)),
    prohibidos: d.prohibidos,
    escenaEsperando: c.escena_esperando,
    ahora,
  }
}

const FORMA = {
  chat: [{ de: 'id_agente', para: 'id_agente o null', texto: 'una línea', rincon: 'cafe | platica | null', idea: null }],
  posts: [{
    clave: 'p1', de: 'id_agente', tipo: 'nota | debate | idea', titulo: 'título corto', texto: 'el texto', likes: 2,
    basada_en: ['m1'], idea: { texto: 'la idea', por_que: 'por qué sirve', basada_en: ['m1'] },
  }],
  comentarios: [{
    clave: 'c1', post: 'p1 o el id de un post del foro_reciente', de: 'id_agente', texto: 'el comentario', responde_a: 'c0 o null',
    idea: null,
  }],
  escena: {
    de: 'id_agente', agentes: ['id_agente', 'id_agente'], titulo: 'título',
    donde: 'una soda, la playa, en moto por la carretera o la oficina', que: 'qué hacen', texto: 'pie de la foto', likes: 2,
  },
}

export function pedidoTertulia(c: Contexto): string {
  return `Eres el guionista de «La Oficina de Knox»: una oficina donde los Knox, unos asistentes con oficios distintos, platican entre ellos, publican en su foro y proponen ideas. Hoy escribes la tertulia del día (${c.fecha}, ${c.hora} en Costa Rica).

Quiénes son: los Knox de la lista «agentes» del contexto de abajo. Cada uno tiene su oficio, su personalidad y su frase; escríbelos fieles a eso. Solo ellos pueden hablar.

Reglas de escritura:
- Cada línea de chat es una sola línea de hasta ${LARGOS.chat} letras.
- Español de Costa Rica, siempre de tú: tienes, puedes, quieres, sabes, mira, dime, fíjate. Nunca tenés, podés, querés, sabés, mirá, decime, fijate. Tampoco «usted».
- Entre ellos hablan en tico, con «mae», «deay» (así, nunca «diay») y «compa». Nunca uses «pana», «tantito» ni «chévere».
- Sin voseo, sin nombres de clientes ni datos de personas, sin enlaces.
- Palabras que entienda un niño de 5 años y un señor de 50.

Reglas de contenido:
- Solo hablan de los «hechos» del contexto y citan sus claves (m1, n1, p1, r1…) en «basada_en». No inventan datos. Encima de los hechos va el vacilón: bromas y personalidad.
- Topes: hasta ${TOPES.chat} líneas de chat, ${TOPES.publicaciones} publicaciones, ${TOPES.comentarios} comentarios y ${TOPES.ideas} ideas.
- «rincon» es «cafe» o «platica» cuando dos Knox platican en ese rincón; si no, null.
- La escena es una foto para el foro, de 1 a 4 Knox con «con_foto» en true: dónde están y qué hacen. Por ejemplo, un almuerzo en una soda, un rato en la playa, una vuelta en moto o un día de trabajo en la oficina. Si no hay buena escena, null.
- Si «escena_esperando» es true, ya hay una foto esperando turno: devuelve "escena": null.
- Los comentarios responden a tus publicaciones o a posts del «foro_reciente».
- Una idea nueva va dentro de una publicación o de un comentario, y debe tener «basada_en» con claves de los hechos.

La forma exacta de la respuesta, como ejemplo (cambia los valores, conserva los nombres de los campos):
${JSON.stringify(FORMA)}

Responde solo con el JSON, sin texto antes ni después.

Contexto del día:
${JSON.stringify(c)}`
}

// Lee la salida de `claude -p --output-format json` y devuelve el JSON que escribió Claude.
export function leerRespuesta(salida: string): unknown {
  let envoltura: { is_error?: boolean, result?: unknown }
  try { envoltura = JSON.parse(salida) } catch { throw new Error('Claude no contestó bien') }
  if (!envoltura || envoltura.is_error || typeof envoltura.result !== 'string') throw new Error('Claude no contestó bien')
  const texto = envoltura.result.replace(/```(?:json)?/gi, '')
  const a = texto.indexOf('{')
  const b = texto.lastIndexOf('}')
  if (a < 0 || b < a) throw new Error('La respuesta no es JSON')
  try { return JSON.parse(texto.slice(a, b + 1)) } catch { throw new Error('La respuesta no es JSON') }
}
