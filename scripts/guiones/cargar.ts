// Carga en el panel (admin.bralto.io/guiones) el guion que escribió la noche para grabar a cámara.
//   node --env-file=.env.local scripts/guiones/cargar.ts <guion.json> [--dia AAAA-MM-DD] [--carpeta <ruta>]
//   npm run guiones:cargar -- <guion.json> [--dia AAAA-MM-DD] [--carpeta <ruta>]
// Sin --dia, el día sale de la ruta (…/publicaciones/2026-11-17/guion/guion.json). Sin --carpeta, se guarda la carpeta
// del guion.json (siempre como ruta completa). Si ya existe uno con ese día y título, se actualiza sin perder su estado
// ni sus videos.
// Imprime el resumen, el id y el enlace del panel. Sale con 0 si quedó guardado; 2 con argumentos malos o sin archivo;
// 3 si el guion está mal hecho (dice qué falta); 1 si no se pudo guardar.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { diaDeRuta, leerArgsCargar, salidaDeCarga, USO_CARGAR } from '../../lib/guiones/cli.ts'
import { leerGuion } from '../../lib/guiones/esquema.ts'
import { cargarGuion } from '../../lib/guiones/servidor.ts'

const orden = leerArgsCargar(process.argv.slice(2))
if ('error' in orden) {
  console.error(orden.error)
  console.error(USO_CARGAR)
  process.exit(2)
}

const ruta = resolve(orden.ruta)
const dia = orden.dia ?? diaDeRuta(ruta)
if (!dia) {
  console.error(`No pude sacar el día de la ruta (${orden.ruta}). Pásalo con --dia AAAA-MM-DD`)
  process.exit(2)
}

let texto: string
try {
  texto = readFileSync(ruta, 'utf8')
} catch (e) {
  console.error(`No pude leer ${orden.ruta}: ${(e as Error).message}`)
  process.exit(2)
}

let json: unknown
try {
  json = JSON.parse(texto)
} catch (e) {
  console.error(`El guion no es un JSON válido (${orden.ruta}): ${(e as Error).message}`)
  process.exit(3)
}

const leido = leerGuion(json)
if (!leido.ok) {
  console.error(`El guion está mal hecho (${orden.ruta}):`)
  for (const error of leido.errores) console.error(`  - ${error}`)
  process.exit(3)
}

try {
  const g = leido.guion
  const r = await cargarGuion(g, { dia, carpeta: orden.carpeta ? resolve(orden.carpeta) : dirname(ruta) })
  for (const linea of salidaDeCarga({ ...r, titulo: g.titulo, dia, lineas: g.lineas.length, ganchos: g.ganchos.length })) console.log(linea)
  process.exit(0)
} catch (e) {
  console.error(`No se pudo guardar el guion: ${(e as Error).message}`)
  process.exit(1)
}
