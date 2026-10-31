// Las cuentas del Centro de mando: de lo que trae cada fuente a lo que muestra cada panel. El servidor
// (servidor.ts) solo lee y la pantalla solo dibuja; todo lo del medio está aquí. Puro, con pruebas (armar.test.ts).
import { diaCR, horaCR, hoyCR, sumarDias } from '../../calendario/fechas.ts'
import { iniciales } from '../../crm/tipos.ts'
import type { CanalKnox, ModoKnox } from '../conversar/tipos.ts'
import { decimal } from './formato.ts'
import type {
  CanalCliente,
  Clientes,
  Embudo,
  Esperando,
  Esperandote,
  Insignia,
  ItemDia,
  MarcaPulso,
  Mejor,
  PostIg,
  Pulso,
  PuntoRadar,
} from './tipos.ts'

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA

// 01 · Clientes nuevos ---------------------------------------------------------------------------------------------

// Una persona nueva: un lead del sitio o un contacto que Knox sacó de la bandeja. clave: su id (o algo fijo de ella)
export type Persona = { clave: string; en: string; canal: CanalCliente }

// En empate, este orden
const CANALES: CanalCliente[] = ['Instagram', 'WhatsApp', 'Sitio web', 'Messenger']

export const CANAL_CLIENTE: Record<CanalKnox, CanalCliente> = { instagram: 'Instagram', whatsapp: 'WhatsApp', messenger: 'Messenger' }

// FNV-1a: el mismo texto da siempre el mismo número
export function hash(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Dónde va cada persona en el radar: siempre en el mismo lugar, porque sale de su id
export function puntoRadar(clave: string): PuntoRadar {
  const h = hash(clave)
  return { angulo: h % 360, radio: 0.3 + ((h >>> 12) % 600) / 1000 }
}

export function clientesNuevos(personas: Persona[], ahora: Date): Clientes {
  const hoy = hoyCR(ahora)
  const ayer = sumarDias(hoy, -1)
  const deHoy = personas
    .filter((p) => diaCR(p.en) === hoy && Date.parse(p.en) <= ahora.getTime())
    .sort((a, b) => Date.parse(a.en) - Date.parse(b.en))
  const cuantos = new Map<CanalCliente, number>(CANALES.map((c) => [c, 0]))
  for (const p of deHoy) cuantos.set(p.canal, (cuantos.get(p.canal) ?? 0) + 1)
  const porCanal = CANALES.map((canal) => ({ canal, total: cuantos.get(canal) ?? 0 }))
    .sort((a, b) => b.total - a.total || CANALES.indexOf(a.canal) - CANALES.indexOf(b.canal))
    .slice(0, 3)
  return {
    hoy: deHoy.length,
    ayer: personas.filter((p) => diaCR(p.en) === ayer).length,
    porCanal,
    puntos: deHoy.map((p) => puntoRadar(p.clave)),
  }
}

// «4 más que ayer», «2 menos que ayer», «Igual que ayer»
export function contraAyer(hoy: number, ayer: number): { texto: string; sube: boolean | null } {
  const d = hoy - ayer
  if (d === 0) return { texto: 'Igual que ayer', sube: null }
  return { texto: `${Math.abs(d)} ${d > 0 ? 'más' : 'menos'} que ayer`, sube: d > 0 }
}

// 02 · Te están esperando ------------------------------------------------------------------------------------------

export type FilaBandeja = {
  id: string
  nombre: string
  canal: CanalKnox
  tipo: string | null
  ultimoEn: string | null
  vistaPrevia: string
  ultimoDeLaPersona: boolean
  contactoId: string | null
  pendiente: { id: string; respuesta: string | null } | null
}

// Las de trabajo donde lo último lo escribió la persona, o donde Knox dejó algo pendiente. Las más nuevas primero
export function porResponder<T extends Pick<FilaBandeja, 'tipo' | 'ultimoDeLaPersona' | 'pendiente' | 'ultimoEn'>>(filas: T[]): T[] {
  const t = (f: T) => (f.ultimoEn ? Date.parse(f.ultimoEn) : 0)
  return filas.filter((f) => (f.tipo === 'trabajo' && f.ultimoDeLaPersona) || f.pendiente !== null).sort((a, b) => t(b) - t(a))
}

export function insignia(etiquetas: string[] | null | undefined): Insignia | null {
  const e = new Set((etiquetas ?? []).map((x) => x.trim().toLowerCase()))
  if (e.has('pidio-llamada')) return 'QUIERE LLAMADA'
  if (e.has('lead')) return 'LEAD'
  return null
}

// Las de Instagram sin nombre se llaman por su @: «@andres.v» → AV
export const inicialesDe = (nombre: string) => iniciales(nombre.replace(/^@+/, ''))

// etiquetas: las de cada contacto (por su id). borradores: las respuestas de Knox listas para mandar
export function armarEsperando(filas: FilaBandeja[], etiquetas: Map<string, string[]>, borradores: string[], cuantas = 3): Esperando {
  const lista = porResponder(filas)
  return {
    total: lista.length,
    conversaciones: lista.slice(0, cuantas).map(
      (f): Esperandote => ({
        id: f.id,
        nombre: f.nombre,
        iniciales: inicialesDe(f.nombre),
        canal: f.canal,
        insignia: insignia(f.contactoId ? etiquetas.get(f.contactoId) : null),
        texto: f.vistaPrevia,
        en: f.ultimoEn,
      }),
    ),
    borradores,
  }
}

// El pie del panel: «Knox ya tiene las 3 respuestas listas»
export function pieEsperando(borradores: number, total: number): string {
  if (borradores === 1) return 'Knox ya tiene la respuesta lista'
  if (borradores > 1) return `Knox ya tiene las ${borradores} respuestas listas`
  return total > 0 ? 'Ver todos los mensajes' : 'Abrir los mensajes'
}

// Lo que dice Knox cuando terminó y hay respuestas para mandar
export function ofrecerRespuestas(n: number): { dice: string; pregunta: string } {
  return n === 1
    ? { dice: 'Tengo 1 respuesta lista.', pregunta: '¿Le escribo yo?' }
    : { dice: `Tengo ${n} respuestas listas.`, pregunta: '¿Les escribo yo?' }
}

export const preguntaAprobar = (n: number) => (n === 1 ? '¿Mando la respuesta de Knox?' : `¿Mando las ${n} respuestas de Knox?`)

// Cómo le fue a «Sí, escríbeles»
export function resultadoAprobar(r: { enviadas: number; fallidas: number }): string {
  const { enviadas: e, fallidas: f } = r
  if (e === 0 && f === 0) return 'Esas respuestas ya no estaban pendientes.'
  if (f === 0) return e === 1 ? 'Listo: mandé la respuesta.' : `Listo: mandé las ${e} respuestas.`
  if (e === 0) return f === 1 ? 'No pude mandarla. Contéstale desde Mensajes.' : `No pude mandar ninguna de las ${f}. Contéstales desde Mensajes.`
  return `Mandé ${e}. ${f === 1 ? '1 no se pudo: contéstale' : `${f} no se pudieron: contéstales`} desde Mensajes.`
}

// La que se resalta: la primera que pidió una llamada; si nadie, la más nueva
export function filaCaliente(conversaciones: Pick<Esperandote, 'insignia'>[]): number {
  if (conversaciones.length === 0) return -1
  const i = conversaciones.findIndex((c) => c.insignia === 'QUIERE LLAMADA')
  return i >= 0 ? i : 0
}

// 03 · Camino a la venta -------------------------------------------------------------------------------------------

// El largo de cada barra (en %), contra la más larga. Lo que no es cero se ve aunque sea poquito
export function anchosEmbudo(e: Embudo): Record<keyof Embudo, number> {
  const max = Math.max(e.llegaron, e.conversando, e.propuesta, e.ganados, 1)
  const ancho = (v: number) => (v <= 0 ? 0 : Math.max(3, Math.round((v / max) * 100)))
  return { llegaron: ancho(e.llegaron), conversando: ancho(e.conversando), propuesta: ancho(e.propuesta), ganados: ancho(e.ganados) }
}

// Las etapas del pipeline que son de propuesta (o cotización)
export const esEtapaDePropuesta = (nombre: string) => /propuesta|cotiz/i.test(nombre)

// 04 · Instagram ---------------------------------------------------------------------------------------------------

// Seguidores nuevos de cada día (el insight follower_count de Instagram)
export type Diario = { valor: number; fin: string }

const enOrden = (diarios: Diario[]) => [...diarios].sort((a, b) => Date.parse(a.fin) - Date.parse(b.fin))

// Los seguidores de cada día, hacia atrás desde los de hoy: un punto más que los días que hay
export function serieSeguidores(total: number, diarios: Diario[]): number[] {
  const orden = enOrden(diarios)
  const serie = [total]
  for (let i = orden.length - 1; i >= 0; i--) serie.unshift(serie[0] - (orden[i].valor || 0))
  return serie
}

export function seguidoresDeLaSemana(diarios: Diario[]): number {
  return enOrden(diarios)
    .slice(-7)
    .reduce((s, d) => s + (d.valor || 0), 0)
}

// 05 · El que más gustó --------------------------------------------------------------------------------------------

// El de más vistas de los últimos 7 días (si no hubo, de 30), con su alcance contra el promedio de los demás.
// false: no hubo posts. null: hubo, pero Instagram no dio sus números
export function elegirMejor(posts: PostIg[], ahora: Date): Mejor | false | null {
  let sinNumeros = false
  for (const dias of [7, 30] as const) {
    const desde = ahora.getTime() - dias * DIA
    const ventana = posts.filter((p) => Date.parse(p.en) >= desde && Date.parse(p.en) <= ahora.getTime())
    const conVistas = ventana.filter((p) => p.vistas !== null)
    if (ventana.length > 0 && conVistas.length === 0) sinNumeros = true
    if (conVistas.length === 0) continue
    const mejor = conVistas.reduce((a, p) => ((p.vistas ?? 0) > (a.vistas ?? 0) ? p : a))
    const otros = ventana.filter((p) => p !== mejor)
    const conAlcance = otros.filter((p) => p.alcance !== null)
    const promedio = conAlcance.length ? conAlcance.reduce((s, p) => s + (p.alcance ?? 0), 0) / conAlcance.length : null
    return {
      titulo: mejor.titulo,
      tipo: mejor.tipo,
      en: mejor.en,
      imagen: mejor.imagen,
      enlace: mejor.enlace,
      vistas: mejor.vistas ?? 0,
      alcance: mejor.alcance,
      promedioOtros: promedio,
      otros: otros.length,
      veces: mejor.alcance !== null && promedio !== null && promedio > 0 ? mejor.alcance / promedio : null,
      dias,
    }
  }
  return sinNumeros ? null : false
}

// Las dos barras: «Este» contra «Los demás» (en %, la más larga llena)
export function barrasMejor(m: Pick<Mejor, 'alcance' | 'promedioOtros'>): { este: number; demas: number } | null {
  if (m.alcance === null || m.promedioOtros === null) return null
  const max = Math.max(m.alcance, m.promedioOtros)
  if (max <= 0) return null
  return { este: Math.round((m.alcance / max) * 100), demas: Math.round((m.promedioOtros / max) * 100) }
}

// La frase de abajo, con la parte fuerte aparte (va en negrita)
export function fraseMejor(m: Pick<Mejor, 'veces' | 'dias' | 'otros'>): { antes: string; fuerte: string; despues: string } {
  const cuando = m.dias === 7 ? 'esta semana' : 'este mes'
  if (m.otros === 0) return { antes: 'Es tu ', fuerte: 'único post', despues: ` de ${m.dias === 7 ? 'la semana' : 'estos 30 días'}.` }
  const v = m.veces
  if (v === null) return { antes: 'Es el que más vieron ', fuerte: cuando, despues: '.' }
  if (v >= 1.5) return { antes: 'Llegó ', fuerte: `${decimal(v >= 10 ? Math.round(v) : v)} veces más lejos`, despues: ' que tus otros posts.' }
  if (v >= 1) return { antes: 'Llegó ', fuerte: 'un poco más lejos', despues: ' que tus otros posts.' }
  return { antes: 'Es el que más vieron, aunque llegó a ', fuerte: 'menos gente', despues: '.' }
}

// 06 · Tu día ------------------------------------------------------------------------------------------------------

export type CitaDia = { titulo: string; inicio: string }
export type PostDia = { titulo: string; tipo: string; estado: string; publicar_en: string }
export type TareaDia = { titulo: string; vence_en: string; hecha: boolean; contacto: string | null }

export const TIPO_POST: Record<string, string> = { reel: 'Reel', carrusel: 'Carrusel', foto: 'Post' }
const ESTADO_POST: Record<string, string> = {
  publicado: 'ya salió',
  programado: 'ya está programado',
  publicando: 'está saliendo',
  borrador: 'falta aprobarlo',
  error: 'no salió',
}

const tipoPost = (tipo: string) => TIPO_POST[tipo] ?? 'Post'

// Lo de hoy (día de Costa Rica): citas, lo que sale en redes y las tareas que vencen, en orden de hora
export function tuDia(o: { citas: CitaDia[]; posts: PostDia[]; tareas: TareaDia[] }, ahora: Date): ItemDia[] {
  const hoy = hoyCR(ahora)
  const items: ItemDia[] = [
    ...o.citas.map((c): ItemDia => ({ tipo: 'cita', en: c.inicio, titulo: c.titulo, detalle: null, hecho: false, fallo: false })),
    ...o.posts
      .filter((p) => p.estado !== 'cancelado')
      .map(
        (p): ItemDia => ({
          tipo: 'post',
          en: p.publicar_en,
          titulo: p.titulo,
          detalle: `${tipoPost(p.tipo)} · ${ESTADO_POST[p.estado] ?? p.estado}`,
          hecho: p.estado === 'publicado',
          fallo: p.estado === 'error',
        }),
      ),
    ...o.tareas.map(
      (t): ItemDia => ({ tipo: 'tarea', en: t.vence_en, titulo: t.titulo, detalle: t.contacto ? `Tarea · ${t.contacto}` : null, hecho: t.hecha, fallo: false }),
    ),
  ]
  return items.filter((i) => diaCR(i.en) === hoy).sort((a, b) => Date.parse(a.en) - Date.parse(b.en))
}

export type EstadoItem = { texto: string; clase: 'hecho' | 'pronto' | 'luego' | 'alerta' }

const DURA_CITA = 45 * MIN
const TARDA_POST = 15 * MIN // el publicador corre cada 5 minutos

// HECHO · EN 18 MIN (falta menos de una hora) · LUEGO, y lo que se quedó atrás
export function estadoItem(i: ItemDia, ahora: Date): EstadoItem {
  if (i.hecho) return { texto: 'Hecho', clase: 'hecho' }
  if (i.fallo) return { texto: 'No salió', clase: 'alerta' }
  const falta = Date.parse(i.en) - ahora.getTime()
  if (falta > HORA) return { texto: 'Luego', clase: 'luego' }
  if (falta > 0) return { texto: `En ${Math.max(1, Math.ceil(falta / MIN))} min`, clase: 'pronto' }
  if (i.tipo === 'cita') return -falta < DURA_CITA ? { texto: 'Ahora', clase: 'pronto' } : { texto: 'Hecho', clase: 'hecho' }
  if (i.tipo === 'post' && -falta < TARDA_POST) return { texto: 'Saliendo', clase: 'pronto' }
  return { texto: 'Pendiente', clase: 'alerta' }
}

export const listos = (items: ItemDia[], ahora: Date) => items.filter((i) => estadoItem(i, ahora).clase === 'hecho').length

// Caben 4: lo último que ya pasó y lo que viene
export function visibles(items: ItemDia[], ahora: Date, max = 4): ItemDia[] {
  const i = items.findIndex((x) => estadoItem(x, ahora).clase !== 'hecho')
  if (i < 0) return items.slice(-max)
  const inicio = Math.min(Math.max(0, i - 1), Math.max(0, items.length - max))
  return items.slice(inicio, inicio + max)
}

// Lo siguiente de hoy, para el «Próximo aviso»
export function proximo(items: ItemDia[], ahora: Date): ItemDia | null {
  return items.find((i) => !i.hecho && !i.fallo && Date.parse(i.en) > ahora.getTime()) ?? null
}

export function textoProximo(i: ItemDia): string {
  if (i.tipo === 'post') return `sale el ${(i.detalle?.split(' · ')[0] ?? 'post').toLowerCase()}`
  return i.titulo
}

// 07 · Pulso del día -----------------------------------------------------------------------------------------------

export const TRAMOS = 34 // de 6:00 a 23:00, cada 30 minutos
export const PRIMERA_HORA = 6

// El tramo (0 a 33) de un instante según la hora de Costa Rica; null antes de las 6:00 o desde las 23:00
export function tramoDe(instante: string): number | null {
  const [h, m] = horaCR(instante).split(':').map(Number)
  const k = (h - PRIMERA_HORA) * 2 + (m >= 30 ? 1 : 0)
  return k >= 0 && k < TRAMOS ? k : null
}

export function contarTramos(instantes: string[], dia: string): number[] {
  const v = new Array<number>(TRAMOS).fill(0)
  for (const t of instantes) {
    if (diaCR(t) !== dia) continue
    const k = tramoDe(t)
    if (k !== null) v[k]++
  }
  return v
}

// Un día de siempre: el promedio de cada tramo en los `dias` días antes de hoy
export function tramosHabituales(instantes: string[], hoy: string, dias = 7): number[] {
  const suma = new Array<number>(TRAMOS).fill(0)
  const desde = sumarDias(hoy, -dias)
  for (const t of instantes) {
    const d = diaCR(t)
    if (d < desde || d >= hoy) continue
    const k = tramoDe(t)
    if (k !== null) suma[k]++
  }
  return suma.map((s) => Math.round((s / dias) * 100) / 100)
}

// Las marcas de arriba: lo que sale en redes, las citas y las propuestas que pidieron
export function marcasDelDia(o: { posts: PostDia[]; citas: CitaDia[]; propuestas: string[] }, ahora: Date): MarcaPulso[] {
  const hoy = hoyCR(ahora)
  return [
    ...o.posts.filter((p) => p.estado !== 'cancelado').map((p): MarcaPulso => ({ tipo: 'post', en: p.publicar_en, etiqueta: tipoPost(p.tipo) })),
    ...o.citas.map((c): MarcaPulso => ({ tipo: 'cita', en: c.inicio, etiqueta: 'Cita' })),
    ...o.propuestas.map((en): MarcaPulso => ({ tipo: 'propuesta', en, etiqueta: 'Propuesta' })),
  ]
    .filter((m) => diaCR(m.en) === hoy && tramoDe(m.en) !== null)
    .sort((a, b) => Date.parse(a.en) - Date.parse(b.en))
}

// mensajes: cuándo entró cada mensaje de la bandeja (de los últimos 8 días)
export function armarPulso(o: { mensajes: string[]; personas: Persona[]; marcas: MarcaPulso[] }, ahora: Date): Pulso {
  const hoy = hoyCR(ahora)
  const eventos = [...o.mensajes, ...o.personas.map((p) => p.en)]
  return {
    hoy: contarTramos(
      eventos.filter((t) => Date.parse(t) <= ahora.getTime()),
      hoy,
    ),
    habitual: tramosHabituales(eventos, hoy),
    clientes: o.personas
      .filter((p) => diaCR(p.en) === hoy && Date.parse(p.en) <= ahora.getTime())
      .map((p) => p.en)
      .sort(),
    marcas: o.marcas,
  }
}

// Media onda de cada lado: así los números de un tramo no dan saltos
export function suavizar(v: number[]): number[] {
  return v.map((x, i) => ((v[i - 1] ?? x) + 2 * x + (v[i + 1] ?? x)) / 4)
}

// La hora de Costa Rica como número (17:42 → 17,7)
export function horaDecimal(instante: string): number {
  const [h, m] = horaCR(instante).split(':').map(Number)
  return h + m / 60
}

// 08 · Conexiones y Knox -------------------------------------------------------------------------------------------

export type CuentaZernioMin = { platform?: string; isActive?: boolean; enabled?: boolean; needsReconnection?: boolean }

// WhatsApp está conectado si Zernio tiene esa cuenta y no pide volver a conectarla
export function whatsappConectado(cuentas: CuentaZernioMin[]): boolean {
  return cuentas.some((c) => c.platform === 'whatsapp' && c.isActive !== false && c.enabled !== false && c.needsReconnection !== true)
}

export const MODO_CENTRO: Record<ModoKnox, { nombre: string; detalle: string }> = {
  ensayo: { nombre: 'Ensayo', detalle: 'tú apruebas' },
  automatico: { nombre: 'Automático', detalle: 'contesta solo' },
  apagado: { nombre: 'Apagado', detalle: 'no contesta' },
}

// Cuántas fuentes revisó el reporte: son 6 (dólar, redes, leads, agenda, mensajes y contenido)
// Cuántas fuentes revisó el reporte: las que trae `datos` (6 en los viejos, 7 desde que lee el correo) menos las que
// no respondieron
export function fuentesRevisadas(datos: Record<string, unknown> | null | undefined): number {
  if (!datos) return 0
  const faltan = Array.isArray(datos.faltan) ? datos.faltan.length : 0
  return Math.max(0, Object.keys(datos).filter((k) => k !== 'faltan').length - faltan)
}

// Knox vuelve a revisar al abrir si el último reporte es de otro día o tiene más de una hora
export const VIGENCIA_REPORTE_MS = HORA
export function reporteViejo(r: { fecha: string; creadoEn: string }, ahora: Date): boolean {
  return r.fecha !== hoyCR(ahora) || ahora.getTime() - Date.parse(r.creadoEn) > VIGENCIA_REPORTE_MS
}
