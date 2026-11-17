// El contexto de la ronda y el pedido a Claude para la tertulia de la Oficina de Knox (tres al día: mañana, mediodía y
// tarde). Todo es puro: recibe datos ya leídos y devuelve texto o estructuras.

import type { Agente, FilaSemana, Marca, Turno } from './tipos.ts'
import type { CtxValidar } from './validar.ts'
import { TOPES, LARGOS, LINEAS_CHARLA, cortar, taparClientes } from './validar.ts'
import { fechaCR, horaCR } from './horario.ts'
import { TURNOS, finDeTurno, turnoDe } from './turnos.ts'

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
  // Lo que ya se habló hoy en las rondas de antes: el chat, las publicaciones y los comentarios
  hoy: {
    chat: { de: string, para: string | null, texto: string, rincon: string | null, donde: string | null, mostrar_desde: string }[]
    posts: { de: string, tipo: string, titulo: string, texto: string, mostrar_desde: string }[]
    comentarios: { de: string, post_titulo: string | null, texto: string, mostrar_desde: string }[]
  }
}

export type Contexto = {
  fecha: string
  hora: string
  turno: Turno
  hasta: string // hasta qué hora salen las cosas de esta ronda
  agentes: { id: string, nombre: string, oficio: string, area: string, personalidad: string, frase: string, con_foto: boolean }[]
  hechos: { clave: string, texto: string }[]
  ideas_pendientes: { texto: string, de: string }[]
  foro_reciente: DatosRonda['foroReciente']
  escena_esperando: boolean
  // Lo que ya dijeron hoy (para seguir la plática sin repetir); donde: «el café», «la sala» o «la oficina de <id>»
  ya_se_hablo: {
    chat: { hora: string, de: string, para: string | null, donde: string | null, texto: string }[]
    publicaciones: { hora: string, de: string, tipo: string, titulo: string, texto: string }[]
    comentarios: { hora: string, de: string, en: string | null, texto: string }[] // en: el título del post
  }
}

const MAX_MARCAS = 120
const DIA_MS = 24 * 60 * 60_000
const LARGO_YA_DICHO = 200

const hablan = (d: DatosRonda) => d.agentes.filter(a => a.estado_fijo !== 'pendiente')

// Dónde se dijo una línea de antes, para el contexto
function dondeSeDijo(rincon: string | null, donde: string | null): string | null {
  if (rincon === 'cafe') return 'el café'
  if (rincon === 'platica') return 'la sala'
  if (rincon === 'visita' && donde) return `la oficina de ${donde}`
  return null
}

export function armarContexto(d: DatosRonda, ahora: Date, turno: Turno = turnoDe(ahora)): Contexto {
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
  const hora = (iso: string) => horaCR(new Date(iso))
  const porHora = <T extends { mostrar_desde: string }>(xs: T[]) => [...xs].sort((a, b) => Date.parse(a.mostrar_desde) - Date.parse(b.mostrar_desde))
  return {
    fecha: fechaCR(ahora),
    hora: horaCR(ahora),
    turno,
    hasta: horaCR(finDeTurno(ahora, turno)),
    agentes: activos.map(a => ({
      id: a.id, nombre: a.nombre, oficio: a.oficio, area: a.area,
      personalidad: a.personalidad, frase: a.frase, con_foto: foto.has(a.id),
    })),
    hechos,
    ideas_pendientes: d.ideasNuevas.map(i => ({ ...i, texto: tapar(i.texto) })),
    foro_reciente: d.foroReciente.map(p => ({ ...p, titulo: tapar(p.titulo) })),
    escena_esperando: d.escenaEsperando,
    ya_se_hablo: {
      chat: porHora(d.hoy.chat).map(l => ({
        hora: hora(l.mostrar_desde), de: l.de, para: l.para, donde: dondeSeDijo(l.rincon, l.donde), texto: tapar(l.texto),
      })),
      publicaciones: porHora(d.hoy.posts).map(p => ({
        hora: hora(p.mostrar_desde), de: p.de, tipo: p.tipo, titulo: tapar(p.titulo), texto: cortar(tapar(p.texto).replace(/\s+/g, ' ').trim(), LARGO_YA_DICHO),
      })),
      comentarios: porHora(d.hoy.comentarios).map(k => ({
        hora: hora(k.mostrar_desde), de: k.de, en: k.post_titulo === null ? null : tapar(k.post_titulo), texto: tapar(k.texto),
      })),
    },
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
    turno: c.turno,
    ahora,
  }
}

const ESCENA_EJEMPLO = {
  de: 'id_agente', agentes: ['id_agente', 'id_agente'], titulo: 'título',
  donde: 'una soda, la playa, en moto por la carretera o la oficina', que: 'qué hacen', texto: 'pie de la foto', likes: 2,
}

// La forma de la respuesta, como ejemplo: la escena solo se ofrece en la ronda del mediodía
function forma(turno: Turno) {
  return {
    chat: [{ de: 'id_agente', para: 'id_agente o null', texto: 'una línea', rincon: 'cafe | platica | null', idea: null }],
    charlas: [
      {
        donde: 'cafe', visita_a: null,
        lineas: [{ de: 'id_agente', texto: 'una línea' }, { de: 'otro id_agente', texto: 'la respuesta' }, { de: 'id_agente', texto: 'una línea' }],
      },
      {
        donde: 'visita', visita_a: 'id_agente al que visitan',
        lineas: [{ de: 'id_agente que llega', texto: 'lo que viene a preguntar' }, { de: 'id_agente al que visitan', texto: 'la respuesta' }],
      },
    ],
    posts: [{
      clave: 'p1', de: 'id_agente', tipo: 'nota | debate | idea', titulo: 'título corto', texto: 'el texto', likes: 2,
      basada_en: ['m1'], idea: { texto: 'la idea', por_que: 'por qué sirve', basada_en: ['m1'] },
    }],
    comentarios: [{
      clave: 'c1', post: 'p1 o el id de un post del foro_reciente', de: 'id_agente', texto: 'el comentario', responde_a: 'c0 o null',
      idea: null,
    }],
    escena: turno === 'mediodia' ? ESCENA_EJEMPLO : null,
  }
}

const cuantos = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

function reglasEscena(turno: Turno): string {
  if (turno !== 'mediodia') return '- En esta ronda no va escena (la foto del foro solo se propone en la del mediodía): devuelve "escena": null.'
  return `- La escena es una foto para el foro, de 1 a 4 Knox con «con_foto» en true: dónde están y qué hacen. Por ejemplo, un almuerzo en una soda, un rato en la playa, una vuelta en moto o un día de trabajo en la oficina. Si no hay buena escena, null.
- La escena no cuenta como la publicación de la ronda: puede ir junto con ella.
- Si «escena_esperando» es true, ya hay una foto esperando turno: devuelve "escena": null.`
}

export function pedidoTertulia(c: Contexto): string {
  return `Eres el guionista de «La Oficina de Knox»: una oficina donde los Knox, unos asistentes con oficios distintos, platican entre ellos, publican en su foro y proponen ideas. Hay tres tertulias al día (la de la mañana, la del mediodía y la de la tarde) y ahora escribes la ${TURNOS[c.turno].de} (${c.fecha}, ${c.hora} en Costa Rica): lo que pasa de ahora a las ${c.hasta}

Quiénes son: los Knox de la lista «agentes» del contexto de abajo. Cada uno tiene su oficio, su personalidad y su frase; escríbelos fieles a eso. Solo ellos pueden hablar.

Lo que ya se habló hoy va en «ya_se_hablo» (el chat, las publicaciones y los comentarios de las tertulias de antes): sigue la plática desde ahí (pueden retomar algo, preguntar cómo salió o cambiar de tema), pero nunca repitas lo que ya se dijo ni vuelvas a contar un hecho igual.

Reglas de escritura:
- Cada línea, suelta o de una charla, es una sola línea de hasta ${LARGOS.chat} letras. En una charla, una línea más larga bota la charla entera.
- Cada Knox habla en primera persona de lo suyo: «terminé», «me salió», «estoy revisando». Nunca habla de sí mismo como si fuera otro.
- Español de Costa Rica, siempre de tú: tienes, puedes, quieres, sabes, mira, dime, fíjate. Nunca tenés, podés, querés, sabés, mirá, decime, fijate. Tampoco «usted».
- Entre ellos hablan en tico, con «mae», «deay» (así, nunca «diay») y «compa». Nunca uses «pana», «tantito» ni «chévere».
- Sin voseo, sin nombres de clientes ni datos de personas, sin enlaces.
- Palabras que entienda un niño de 5 años y un señor de 50.

Las charlas son lo más importante de la ronda: que platiquen entre ellos y no se queden todo el rato en su escritorio.
- Una charla es una plática de ida y vuelta entre exactamente 2 Knox que se turnan (uno, el otro, uno…), de ${LINEAS_CHARLA.min} a ${LINEAS_CHARLA.max} líneas.
- «donde» es «cafe» (se toman un café en la barra), «platica» (en los sillones de la sala) o «visita» (uno va a la oficina del otro).
- En una visita, «visita_a» es el id del Knox al que visitan, y el que llega habla primero. Fuera de las visitas, «visita_a» va en null.
- Las visitas son por trabajo de verdad, sacado de los hechos del día: ir a preguntarle al otro por un gancho, un número, una prueba, una idea o una publicación. En el café y en la sala pueden hablar más suelto y vacilar.
- Mezcla café, sala y visitas: unas 3 a 6 charlas por ronda, con Knox distintos.
- «chat» son las líneas sueltas: algo que uno dice al aire o a otro («para»), sin que le contesten.

Reglas de contenido:
- Solo hablan de los «hechos» del contexto y citan sus claves (m1, n1, p1, r1…) en «basada_en». No inventan datos. Encima de los hechos va el vacilón: bromas y personalidad.
- Topes de esta ronda: hasta ${TOPES.chat} líneas en total (las sueltas más las de las charlas), ${cuantos(TOPES.charlas, 'charla', 'charlas')}, ${cuantos(TOPES.publicaciones, 'publicación', 'publicaciones')}, ${cuantos(TOPES.comentarios, 'comentario', 'comentarios')} y ${cuantos(TOPES.ideas, 'idea', 'ideas')}.
- En una línea suelta, «rincon» es «cafe» o «platica» si la dice en ese rincón de la sala; si no, null.
${reglasEscena(c.turno)}
- Los comentarios responden a tus publicaciones o a posts del «foro_reciente».
- Una idea nueva va dentro de una publicación o de un comentario, y debe tener «basada_en» con claves de los hechos.

La forma exacta de la respuesta, como ejemplo (cambia los valores, conserva los nombres de los campos):
${JSON.stringify(forma(c.turno))}

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
