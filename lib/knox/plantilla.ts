import { diaCr, fechaHablada, horaHablada, saludo } from './fechas.ts'
import type { Datos, Publicacion, Seccion, Tarjeta } from './tipos.ts'

// El guion de Knox armado sin IA. Sirve de respaldo: si Claude no responde, Knox igual habla.
const NOMBRE = 'Alejandro'

const FUENTES: Record<string, string> = {
  cambio: 'el tipo de cambio',
  redes: 'Instagram y Facebook',
  leads: 'los leads del sitio',
  agenda: 'la agenda',
  conversaciones: 'los mensajes de GoHighLevel',
  contenido: 'el calendario de publicaciones',
}

// Lo que se dice no lleva emojis ni símbolos: la voz los leería
export function paraVoz(texto: string): string {
  return texto
    .replace(/₡\s?([\d.,]+)/g, '$1 colones')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const lista = (partes: string[]) => (partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`)
const cuantos = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const nombre = (p: Publicacion) => `el ${p.tipo} «${paraVoz(p.titulo)}»`

function numeros(p: Publicacion): string {
  const partes = [
    ...(p.vistas !== null ? [cuantos(p.vistas, 'vista', 'vistas')] : []),
    `${p.meGusta} me gusta`,
    cuantos(p.comentarios, 'comentario', 'comentarios'),
  ]
  return lista(partes)
}

export function escribirPlantilla(d: Datos, ahora: Date): Seccion[] {
  const secciones: Seccion[] = []
  const decir = (tarjeta: Tarjeta, texto: string) => secciones.push({ tarjeta, texto: paraVoz(texto) })

  decir('saludo', `${saludo(ahora)}, ${NOMBRE}. Hoy es ${fechaHablada(ahora)}. Te cuento lo importante.`)

  if (d.cambio) {
    decir('cambio', `El dólar está a ${Math.round(d.cambio.venta)} colones para la venta y ${Math.round(d.cambio.compra)} para la compra.`)
  }

  if (d.leads) {
    if (!d.leads.length) decir('leads', 'No entraron leads nuevos en las últimas 24 horas.')
    else {
      const quienes = d.leads.slice(0, 3).map((l) => `${l.nombre}, por ${l.origen}`)
      const mas = d.leads.length > 3 ? ` y ${d.leads.length - 3} más` : ''
      decir('leads', `${d.leads.length === 1 ? 'Entró' : 'Entraron'} ${cuantos(d.leads.length, 'lead nuevo', 'leads nuevos')}: ${quienes.join('; ')}${mas}.`)
    }
  }

  if (d.agenda) {
    if (!d.agenda.length) decir('agenda', 'No tienes citas para hoy ni para mañana.')
    else {
      const citas = d.agenda.slice(0, 3).map((c) => {
        const inicio = new Date(c.inicio)
        return `${diaCr(inicio) === diaCr(ahora) ? 'hoy' : 'mañana'} a ${horaHablada(inicio)}, ${c.titulo}`
      })
      decir('agenda', `Tienes ${cuantos(d.agenda.length, 'cita', 'citas')}: ${citas.join('; ')}.`)
    }
  }

  const mensajes: string[] = []
  if (d.conversaciones) {
    if (d.conversaciones.sinLeer) {
      const canales = Object.entries(d.conversaciones.porCanal)
        .sort((a, b) => b[1] - a[1])
        .map(([canal, n]) => `${n} por ${canal}`)
      mensajes.push(`Tienes ${cuantos(d.conversaciones.sinLeer, 'conversación sin responder', 'conversaciones sin responder')}: ${lista(canales)}.`)
    }
  } else if (d.redes) {
    // Sin GoHighLevel, lo que dice Meta
    const sinLeer = d.redes.facebook.reduce((a, p) => a + (p.sinLeer ?? 0), 0) + (d.redes.mensajesIgSinLeer ?? 0)
    if (sinLeer) mensajes.push(`Tienes ${cuantos(sinLeer, 'conversación sin leer', 'conversaciones sin leer')} en Messenger e Instagram.`)
  }
  if (d.redes?.comentarios.length) {
    const ultimo = paraVoz(d.redes.comentarios[0].texto)
    const cuantosComentarios = cuantos(d.redes.comentarios.length, 'comentario nuevo', 'comentarios nuevos')
    mensajes.push(`${mensajes.length ? 'Y' : 'Tienes'} ${cuantosComentarios} en Instagram${ultimo ? `; el último dice: «${ultimo}»` : ''}.`)
  }
  if (mensajes.length) decir('mensajes', mensajes.join(' '))
  else if (d.conversaciones || d.redes) decir('mensajes', 'No tienes mensajes ni comentarios pendientes.')

  const pubs = d.redes?.publicaciones ?? []
  if (pubs.length) {
    const [ultima] = pubs
    const partes = [`${nombre(ultima).replace(/^el/, 'El')} lleva ${numeros(ultima)}.`]
    const mejor = pubs.reduce((a, p) => ((p.vistas ?? 0) > (a.vistas ?? 0) ? p : a), ultima)
    if (mejor !== ultima && mejor.vistas) partes.push(`Lo que mejor va esta semana es ${nombre(mejor)}, con ${cuantos(mejor.vistas, 'vista', 'vistas')}.`)
    const total = pubs.reduce((a, p) => a + (p.vistas ?? 0), 0)
    if (pubs.length > 1 && total) partes.push(`En total, esta semana llevas ${total} vistas.`)
    decir('publicaciones', partes.join(' '))
  }

  if (d.redes?.instagram.length) {
    const [personal, marca] = d.redes.instagram
    const partes = [`Tu Instagram tiene ${personal.seguidores} seguidores${personal.nuevosAyer ? ` y ayer ganaste ${personal.nuevosAyer}` : ''}.`]
    const pagina = [...d.redes.facebook].sort((a, b) => b.seguidores - a.seguidores)[0]
    const otros = [...(marca ? [`el de Bralto tiene ${marca.seguidores}`] : []), ...(pagina ? [`tu página de Facebook, ${pagina.seguidores}`] : [])]
    if (otros.length) partes.push(`${otros.join(', y ').replace(/^el/, 'El')}.`)
    decir('seguidores', partes.join(' '))
  }

  if (d.contenido) {
    const partes: string[] = []
    const salieron = d.contenido.hoy.filter((p) => p.estado === 'publicado').map((p) => `«${paraVoz(p.titulo)}»`)
    if (salieron.length) partes.push(`Hoy ya ${salieron.length === 1 ? 'salió' : 'salieron'} ${lista(salieron)}.`)
    for (const p of d.contenido.hoy.filter((x) => x.estado === 'programado' || x.estado === 'publicando')) {
      partes.push(`A ${horaHablada(new Date(p.en))} sale «${paraVoz(p.titulo)}».`)
    }
    const borradores = d.contenido.hoy.filter((p) => p.estado === 'borrador').map((p) => `«${paraVoz(p.titulo)}»`)
    if (borradores.length) partes.push(`${lista(borradores)} ${borradores.length === 1 ? 'sigue' : 'siguen'} sin aprobar en el calendario.`)
    const errores = d.contenido.hoy.filter((p) => p.estado === 'error').map((p) => `«${paraVoz(p.titulo)}»`)
    if (errores.length) partes.push(`Ojo: ${lista(errores)} no ${errores.length === 1 ? 'pudo' : 'pudieron'} salir.`)
    if (!d.contenido.hoy.length) partes.push('Hoy no hay nada programado en redes.')
    partes.push(
      d.contenido.manana
        ? `Para mañana hay ${cuantos(d.contenido.manana, 'publicación lista', 'publicaciones listas')}.`
        : 'Ojo: para mañana no hay nada programado.',
    )
    decir('contenido', partes.join(' '))
  }

  const faltan = d.faltan.map((f) => FUENTES[f] ?? f)
  decir('cierre', `${faltan.length ? `Hoy no pude leer ${lista(faltan)}. ` : ''}Eso es todo. ¡A darle!`)
  return secciones
}
