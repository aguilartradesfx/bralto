// Sube los retratos de los Knox al bucket privado `oficina`.
//   npm run oficina:foto -- retrato <agente> <archivo.jpg>
//   npm run oficina:foto -- retratos <carpeta>      → <id>.jpg de cada Knox (o su versión -v<n> más alta); ignora lo demás
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { elegirArchivos } from '../../lib/oficina/fotos.ts'
import { achicar, idsDelCatalogo, subirRetrato } from '../../lib/oficina/fotos-servidor.ts'

const [modo, a, b] = process.argv.slice(2)

try {
  const ids = await idsDelCatalogo()
  if (modo === 'retrato' && a && b) {
    if (!ids.includes(a)) { console.error(`«${a}» no está en el catálogo`); process.exit(2) }
    await subirRetrato(a, await achicar(await readFile(b)))
    console.log(`Subido: retratos/${a}.jpg`)
  } else if (modo === 'retratos' && a) {
    const elegidos = elegirArchivos(await readdir(a), ids)
    for (const [id, archivo] of Object.entries(elegidos)) {
      await subirRetrato(id, await achicar(await readFile(join(a, archivo))))
      console.log(`Subido: retratos/${id}.jpg (${archivo})`)
    }
    const faltan = ids.filter(i => !elegidos[i])
    console.log(`Faltan: ${faltan.length ? faltan.join(', ') : 'ninguno'}`)
  } else {
    console.error('Uso: retrato <agente> <archivo> | retratos <carpeta>')
    process.exit(2)
  }
  process.exit(0)
} catch (e) {
  console.error('[foto]', e instanceof Error ? e.message : String(e))
  process.exit(1)
}
