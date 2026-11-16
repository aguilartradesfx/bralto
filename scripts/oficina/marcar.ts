// Marca desde el servidor lo que hace cada agente, o pregunta si la oficina está dormida.
//   npm run oficina:marcar -- estado                       → imprime «dormida» (sale con 3) o «despierta» (sale con 0)
//   npm run oficina:marcar -- <agente> <tipo> "<texto>" [--para x] [--enlace url] [--ref tabla:id] [--dura seg]
// Una marca que no se pudo guardar nunca frena el trabajo: sale con 0. Argumentos malos: sale con 2.
import { leerArgs } from '../../lib/oficina/cli.ts'
import { estadoOficina, marcar } from '../../lib/oficina/servidor.ts'

const orden = leerArgs(process.argv.slice(2))
if ('error' in orden) {
  console.error(orden.error)
  process.exit(2)
}
if (orden.orden === 'estado') {
  const e = await estadoOficina()
  console.log(e.dormida ? 'dormida' : 'despierta')
  process.exit(e.dormida ? 3 : 0)
}
await marcar(orden.marca)
process.exit(0)
