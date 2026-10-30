// Carga inicial de la bandeja: las conversaciones de Instagram, Messenger y WhatsApp de Zernio de los últimos 30 días,
// con sus últimos 50 mensajes, a las tablas crm_*. Sin Knox ni avisos. Se puede volver a correr: cada conversación y
// cada mensaje se reconocen por su id de la red y no se repiten.
//   npm run crm:bandeja                 → carga
//   npm run crm:bandeja -- --prueba     → solo lee Zernio y cuenta, sin escribir
//   npm run crm:bandeja -- --dias=7     → otro rango
// Nunca imprime nombres ni mensajes: solo cuántos hay.
import { createClient } from '@supabase/supabase-js'
import { clienteZernio } from '../../lib/zernio/cliente.ts'
import { conversacionDeLista, mensajeDeLista, type DatosMensaje } from '../../lib/crm/bandeja/zernio.ts'
import { filaMensaje, guardarConversacion, marcarLeida, pausarKnox } from '../../lib/crm/bandeja/almacen.ts'
import { PAUSA_ALE_MS } from '../../lib/crm/bandeja/procesar.ts'
import type { AutorMensaje } from '../../lib/knox/conversar/tipos.ts'

const args = process.argv.slice(2)
const prueba = args.includes('--prueba')
const DIAS = Number(args.find((a) => a.startsWith('--dias='))?.split('=')[1] ?? 30)
const POR_CONVERSACION = 50

const necesita = (nombre: string) => {
  const v = process.env[nombre]
  if (!v) throw new Error(`Falta ${nombre} en .env.local`)
  return v
}

const dormir = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

async function main() {
  if (!Number.isFinite(DIAS) || DIAS < 1 || DIAS > 365) throw new Error('--dias tiene que ser entre 1 y 365')
  const zernio = clienteZernio({ clave: necesita('ZERNIO_API_KEY') })
  const db = createClient(necesita('NEXT_PUBLIC_SUPABASE_URL'), necesita('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
  const desde = Date.now() - DIAS * 86_400_000
  const cuenta = { conversaciones: 0, conContacto: 0, mensajes: 0, mensajesNuevos: 0, pausadas: 0, omitidas: 0, porCanal: {} as Record<string, number> }

  console.log(`Bandeja: conversaciones de los últimos ${DIAS} días${prueba ? ' (prueba: no se escribe nada)' : ''}`)
  let cursor: string | null = null
  let terminar = false
  while (!terminar) {
    const pagina = await zernio.conversaciones({ cursor, limite: 100 })
    for (const c of pagina.conversaciones) {
      // Vienen de la más nueva a la más vieja: la primera fuera del rango corta la carga
      if (!c.updatedTime || Date.parse(c.updatedTime) < desde) {
        terminar = true
        break
      }
      const d = conversacionDeLista(c)
      if (!d || !c.accountId) {
        cuenta.omitidas++
        continue
      }
      cuenta.conversaciones++
      cuenta.porCanal[d.canal] = (cuenta.porCanal[d.canal] ?? 0) + 1
      const { mensajes } = await zernio.mensajes(c.id, c.accountId, { limite: POR_CONVERSACION, orden: 'desc' })
      const datos = mensajes.map(mensajeDeLista).filter((m): m is DatosMensaje => m !== null)
      cuenta.mensajes += datos.length
      await dormir(150)
      if (prueba || datos.length === 0) continue

      const conv = await guardarConversacion(db, d)
      if (conv.contactoId) cuenta.conContacto++
      // Lo que salió por la API antes de esto no lo mandó el panel: cuenta como automático
      const filas = datos.map((m) => filaMensaje(conv, m, (m.autoria === 'api' ? 'automatizacion' : m.autoria) as AutorMensaje))
      const { data, error } = await db.from('crm_mensajes').upsert(filas, { onConflict: 'origen,externo_id', ignoreDuplicates: true }).select('id')
      if (error) throw new Error(`crm_mensajes: ${error.message}`)
      cuenta.mensajesNuevos += data?.length ?? 0

      // Si Zernio dice que no hay nada sin leer, Ale ya la vio en la app
      const ultimo = datos.reduce((max, m) => (m.enviadoEn > max ? m.enviadoEn : max), '')
      if ((c.unreadCount ?? 0) === 0 && ultimo) await marcarLeida(db, conv.id, ultimo)
      // Si Ale escribió hace menos de 12 horas, Knox espera lo que falta (como si hubiera llegado por el webhook)
      const deAle = datos.filter((m) => m.autoria === 'ale').reduce((max, m) => (m.enviadoEn > max ? m.enviadoEn : max), '')
      if (deAle && Date.parse(deAle) + PAUSA_ALE_MS > Date.now()) {
        await pausarKnox(db, conv.id, new Date(Date.parse(deAle) + PAUSA_ALE_MS))
        cuenta.pausadas++
      }
    }
    if (!pagina.siguiente) break
    cursor = pagina.siguiente
  }

  console.log(`  conversaciones: ${cuenta.conversaciones} ${JSON.stringify(cuenta.porCanal)}`)
  console.log(`  mensajes leídos: ${cuenta.mensajes}${prueba ? '' : `, nuevos en la base: ${cuenta.mensajesNuevos}`}`)
  if (!prueba) {
    console.log(`  con contacto del CRM: ${cuenta.conContacto}`)
    console.log(`  con Knox en pausa (Ale escribió hace menos de 12 h): ${cuenta.pausadas}`)
  }
  if (cuenta.omitidas) console.log(`  omitidas (otra red o sin cuenta): ${cuenta.omitidas}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
