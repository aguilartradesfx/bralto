// La foto de grupo del foro (2 por semana como mucho; la corre el cron del servidor).
//   npm run oficina:foto-grupo                          → hace la foto de la escena pendiente (cuesta plata)
//   npm run oficina:foto-grupo -- --simular             → dice qué haría, sin llamar a Gemini ni anotar nada
//   npm run oficina:foto-grupo -- --gasto <archivo.jsonl> → cada imagen pagada deja su línea en el archivo
// Sale con 1 solo si la foto quedó en «falla».
import { correrFotoGrupo } from '../../lib/oficina/fotos.ts'
import { depsFotoGrupo } from '../../lib/oficina/fotos-servidor.ts'

const args = process.argv.slice(2)
const simular = args.includes('--simular')
const i = args.indexOf('--gasto')
const gasto = i >= 0 ? args[i + 1] : undefined
if (i >= 0 && !gasto) { console.error('--gasto va con un archivo .jsonl'); process.exit(2) }

try {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  if (!simular && !apiKey) throw new Error('Falta GEMINI_API_KEY')
  const r = await correrFotoGrupo(depsFotoGrupo(apiKey, gasto), new Date(), simular)
  console.log(`Foto de grupo: ${r.resultado}${r.detalle ? ` — ${r.detalle}` : ''}`)
  process.exit(r.resultado === 'falla' ? 1 : 0)
} catch (e) {
  console.error('[foto-grupo]', e instanceof Error ? e.message : String(e))
  process.exit(1)
}
