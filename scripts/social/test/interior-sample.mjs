import { renderInterior } from '../templates/interior.mjs'
const r = await renderInterior({
  outPath: 'scripts/social/out/_interior.png', pill: 'error 01',
  heading: 'Automatizar sin proceso', headingAccent: 'sin proceso',
  cards: [
    { kind: 'good', title: 'Haz esto', body: 'Mapea el flujo a mano una semana. Automatiza solo lo que ya funciona.' },
    { kind: 'bad', title: 'No esto', body: 'Conectar 5 herramientas y rezar. Automatizas el caos, no el orden.' },
  ], index: 2, total: 7,
})
console.log(r.width === 1080 && r.height === 1440 ? `✓ ${r.outPath}` : '✗ dims')
