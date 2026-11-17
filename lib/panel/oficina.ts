// SERVER-ONLY — lo que lee la página de la Oficina de Knox: la foto del momento, «Te toca» y el bloque social
// (el foro, las ideas y las fotos firmadas, solo cuando cambia su firma). Quien llama revisa antes que sea
// administrador. La página pregunta cada 15 s; por eso «Te toca» y lo crudo del foro se guardan 1 min en memoria
// (por instancia del servidor) y las fotos se firman solo cuando el bloque viaja.
import { createServiceClient } from '@/lib/supabase/service'
import { resumenBandeja } from '@/lib/crm/bandeja/servidor'
import { esperando } from '@/lib/knox/centro/servidor'
import { conTope, memo, MIN, olvidar } from '@/lib/knox/centro/memoria'
import { corteDormida } from '@/lib/oficina/estado'
import { aLaHoraCR } from '@/lib/oficina/horario'
import { firmarFotos, leerOficina, leerSocialCrudo } from '@/lib/oficina/servidor'
import { armarSocial, firmaSocial } from '@/lib/oficina/social'
import { filasTeToca, type CuentaTeToca } from '@/lib/oficina/te-toca'
import type { EstadoOficina, FilaTeToca, RespuestaOficina } from '@/lib/oficina/tipos'

const DIA = 24 * 60 * MIN
const CLAVE_TE_TOCA = 'oficina:te-toca'
const CLAVE_SOCIAL = 'oficina:social'

const db = () => createServiceClient()
const mensaje = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function contar(tabla: string, consulta: PromiseLike<{ count: number | null, error: { message: string } | null }>): Promise<number> {
  const { count, error } = await consulta
  if (error) throw new Error(`${tabla}: ${error.message}`)
  return count ?? 0
}

// Las fuentes de «Te toca», en este orden. Si una falla (o tarda más de 8 s), su fila no sale y las demás sí.
// `oficina`: el estado de la oficina de la misma foto (lo usan las ideas nuevas para el corte de dormida).
export const FUENTES_TE_TOCA: ((oficina: Promise<EstadoOficina>) => Promise<CuentaTeToca>)[] = [
  // Mensajes por contestar y cuántos son clientes posibles: las mismas cuentas del Inicio del panel
  async () => {
    const [bandeja, espera] = await Promise.all([
      resumenBandeja().catch((e) => {
        console.error('[oficina] te toca (bandeja):', mensaje(e))
        return null
      }),
      esperando(1).catch((e) => {
        console.error('[oficina] te toca (te están esperando):', mensaje(e))
        return null
      }),
    ])
    if (!bandeja && !espera) throw new Error('no se pudo leer la bandeja')
    return { clave: 'mensajes', n: bandeja?.porResponder ?? espera?.total ?? 0, clientes: espera?.total ?? 0 }
  },
  // Tareas del CRM sin hacer que vencen hoy o ya vencieron (antes de mañana a las 00:00 de Costa Rica)
  async () => {
    const manana = new Date(aLaHoraCR(new Date(), 0, 0).getTime() + DIA).toISOString()
    const n = await contar('crm_tareas', db().from('crm_tareas').select('id', { count: 'exact', head: true }).eq('hecha', false).lt('vence_en', manana))
    return { clave: 'tareas', n }
  },
  // Ideas del panel que dijo «Lo grabo yo» y todavía no marcó como grabadas
  async () => {
    const n = await contar('lab_ideas', db().from('lab_ideas').select('id', { count: 'exact', head: true }).eq('decision', 'yo').is('grabada_en', null))
    return { clave: 'grabar', n }
  },
  // Guiones que escribió la noche para grabar a cámara y todavía no tienen video: cuántos son y el más nuevo
  async () => {
    const { data, count, error } = await db()
      .from('redes_guiones')
      .select('id, titulo', { count: 'exact' })
      .eq('estado', 'listo')
      .order('dia', { ascending: false })
      .order('creado_en', { ascending: false })
      .limit(1)
    if (error) throw new Error(`redes_guiones: ${error.message}`)
    const g = data?.[0] as { id: string, titulo: string } | undefined
    return g ? { clave: 'guiones', n: count ?? 1, id: g.id, titulo: g.titulo } : { clave: 'guiones', n: 0, id: '', titulo: '' }
  },
  // Ideas nuevas del equipo que ya se ven: con la oficina dormida, solo las de antes de dormirse (el corte del chat y del foro)
  async (oficina) => {
    const corte = corteDormida(await oficina)
    if (corte === -Infinity) return { clave: 'ideas', n: 0 }
    let consulta = db().from('oficina_ideas').select('id', { count: 'exact', head: true }).eq('estado', 'nueva').lte('mostrar_desde', new Date().toISOString())
    if (Number.isFinite(corte)) consulta = consulta.lt('mostrar_desde', new Date(corte).toISOString())
    return { clave: 'ideas', n: await contar('oficina_ideas', consulta) }
  },
]

export function leerTeToca(oficina: Promise<EstadoOficina>): Promise<FilaTeToca[]> {
  return memo(CLAVE_TE_TOCA, MIN, async () => {
    const r = await Promise.allSettled(FUENTES_TE_TOCA.map((f) => conTope(f(oficina))))
    const cuentas: CuentaTeToca[] = []
    for (const x of r) {
      if (x.status === 'fulfilled') cuentas.push(x.value)
      else console.error('[oficina] te toca:', mensaje(x.reason))
    }
    return filasTeToca(cuentas)
  })
}

// Lo llaman las rutas que escriben («Me sirve», «No va», el me gusta): el próximo pedido ya lo ve
export function olvidarCaches(): void {
  olvidar(CLAVE_TE_TOCA)
  olvidar(CLAVE_SOCIAL)
}

// La firma se calcula en cada pedido. Si es la que ya tiene la página, el bloque no viaja; si cambió (o la página
// no mandó la suya), las fotos se firman de una sola vez. Si algo falla, no viaja y se devuelve la firma del cliente.
// Lo crudo se guarda 1 min, pero el corte de dormida se aplica en cada pedido: al despertar, la firma cambia enseguida.
async function bloqueSocial(ahora: Date, firmaCliente: string | null, oficina: Promise<EstadoOficina>): Promise<Pick<RespuestaOficina, 'firmaSocial' | 'social'>> {
  try {
    const [crudo, estado] = await Promise.all([memo(CLAVE_SOCIAL, MIN, () => leerSocialCrudo(ahora)), oficina])
    const s = armarSocial(crudo, ahora, estado)
    const firma = firmaSocial(s)
    if (firma === firmaCliente) return { firmaSocial: firma, social: null }
    const urls = await firmarFotos(s.fotos.map((f) => f.ruta))
    const fotos = s.fotos.flatMap(({ ruta, ...f }) => (urls[ruta] ? [{ ...f, url: urls[ruta] }] : []))
    return { firmaSocial: firma, social: { foro: s.foro, proxima: s.proxima, ideas: s.ideas, fotos, ronda: s.ronda } }
  } catch (e) {
    console.error('[oficina] bloque social:', mensaje(e))
    return { firmaSocial: firmaCliente ?? '', social: null }
  }
}

// El estado de la oficina sale de la misma foto (leerOficina no lanza): el chat, el foro y las ideas nuevas cortan
// igual mientras duerme. Las tres lecturas corren a la vez; solo lo que necesita el estado lo espera.
export async function leerOficinaCompleta(ahora: Date, firmaCliente: string | null): Promise<RespuestaOficina> {
  const foto = leerOficina(ahora)
  const oficina = foto.then((s) => s.oficina)
  const [snap, filas, social] = await Promise.all([foto, leerTeToca(oficina), bloqueSocial(ahora, firmaCliente, oficina)])
  return { ...snap, teToca: filas, ...social }
}
