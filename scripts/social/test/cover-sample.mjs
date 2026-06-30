import { renderCover } from '../templates/cover.mjs'
const base = process.argv[2] // ruta a una base IA existente (la del spike)
const r = await renderCover({
  basePath: base, outPath: 'scripts/social/out/_cover.png',
  pill: 'errores · IA', headline: 'Los 5 errores de IA que frenan tu agencia',
  accent: 'IA', subtitle: '(y cómo arreglarlos esta semana)', index: 1, total: 7,
})
console.log(r.width === 1080 && r.height === 1440 ? `✓ ${r.outPath}` : '✗ dims')
