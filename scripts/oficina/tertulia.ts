// Una ronda de la tertulia de la Oficina de Knox. El cron del servidor la corre tres veces al día, a las 8:30 a. m.,
// 12:30 p. m. y 4:00 p. m. de Costa Rica: el turno (mañana, mediodía o tarde) sale de la hora, y un turno que ya salió
// bien hoy no se repite.
//   npm run oficina:tertulia                                  → la ronda de verdad (guarda y anota)
//   npm run oficina:tertulia -- --probar                      → le pregunta a Claude y muestra lo limpio, sin guardar
//   npm run oficina:tertulia -- --simular [--respuesta <archivo>] → muestra el pedido (y lo limpio, con una respuesta guardada); no llama a Claude ni guarda
//   npm run oficina:tertulia -- anotar <falla|saltada> "<detalle>" → anota el resultado del turno de esta hora (lo usa el cron si algo se rompe antes)
// Sale con 1 solo si la ronda quedó en «falla».
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fechaCR } from '../../lib/oficina/horario.ts'
import { argsClaude, correrRonda, entornoClaude, type DepsRonda } from '../../lib/oficina/ronda.ts'
import { anotarRonda, estadoOficina, guardarRonda, leerDatosRonda, rondaDe } from '../../lib/oficina/servidor.ts'
import { TURNOS, turnoDe } from '../../lib/oficina/turnos.ts'

const OCHO_MIN = 8 * 60_000

// Lanza `claude -p` con el pedido por la entrada estándar, en una carpeta vacía y sin llave de API.
async function preguntarAClaude(pedido: string): Promise<string> {
  const carpeta = await mkdtemp(join(tmpdir(), 'tertulia-'))
  try {
    return await new Promise<string>((resolver, rechazar) => {
      const hijo = spawn('claude', argsClaude(), { cwd: carpeta, env: entornoClaude(process.env), stdio: ['pipe', 'pipe', 'pipe'] })
      let salida = ''
      let cortado = false
      const reloj = setTimeout(() => { cortado = true; hijo.kill('SIGKILL') }, OCHO_MIN)
      hijo.stdout.on('data', d => { salida += d })
      hijo.stderr.resume()
      hijo.on('error', e => { clearTimeout(reloj); rechazar(new Error(`No se pudo lanzar claude: ${e.message}`)) })
      hijo.on('close', codigo => {
        clearTimeout(reloj)
        if (cortado) return rechazar(new Error('Claude tardó más de 8 minutos'))
        if (!salida.trim()) return rechazar(new Error(`Claude no contestó (salió con ${codigo})`))
        resolver(salida)
      })
      hijo.stdin.on('error', () => {})
      hijo.stdin.end(pedido)
    })
  } finally {
    await rm(carpeta, { recursive: true, force: true })
  }
}

const deps: DepsRonda = {
  dormida: async () => (await estadoOficina()).dormida,
  rondaDe,
  leerDatos: leerDatosRonda,
  preguntar: preguntarAClaude,
  guardar: guardarRonda,
  anotar: anotarRonda,
}

const args = process.argv.slice(2)
const ahora = new Date()

try {
  if (args[0] === 'anotar') {
    const [, resultado, detalle] = args
    if ((resultado !== 'falla' && resultado !== 'saltada') || !detalle?.trim()) {
      console.error('Uso: anotar <falla|saltada> "<detalle>"')
      process.exit(2)
    }
    const turno = turnoDe(ahora)
    await anotarRonda({ fecha: fechaCR(ahora), turno, resultado, detalle: detalle.replace(/\s+/g, ' ').trim().slice(0, 200) })
    console.log(`Anotada la tertulia ${TURNOS[turno].de}: ${resultado}`)
    process.exit(resultado === 'falla' ? 1 : 0)
  }

  const modo = args.includes('--simular') ? 'simular' : args.includes('--probar') ? 'probar' : 'real'
  let respuesta: string | undefined
  const i = args.indexOf('--respuesta')
  if (i >= 0) {
    if (modo !== 'simular' || !args[i + 1]) {
      console.error('--respuesta va con --simular y un archivo')
      process.exit(2)
    }
    respuesta = await readFile(args[i + 1], 'utf8')
  }

  const r = await correrRonda(deps, ahora, { modo, respuesta })
  if (modo === 'real') {
    console.log(`Ronda ${TURNOS[r.turno].de}: ${r.resultado}${r.detalle ? ` — ${r.detalle}` : ''}`)
  } else {
    // El pedido ya trae los nombres de clientes tapados; nunca se imprimen los prohibidos.
    if (r.pedido) console.log(r.pedido)
    if (r.limpia) console.log('\n--- Lo limpio ---\n' + JSON.stringify(r.limpia, null, 2))
    console.log(`\n${r.resultado} (${TURNOS[r.turno].de}): ${r.detalle}`)
  }
  process.exit(r.resultado === 'falla' ? 1 : 0)
} catch (e) {
  // Un error antes de poder anotar (por ejemplo, la base caída) tampoco rompe nada más: solo sale con 1
  console.error('[tertulia]', e instanceof Error ? e.message : String(e))
  process.exit(1)
}
