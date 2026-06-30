import { renderPromptShowcase } from '../templates/prompt-showcase.mjs'
import { renderClosing } from '../templates/closing.mjs'
const fillers = ['scripts/social/out/_cover.png', 'scripts/social/out/_interior.png', 'scripts/social/out/_cover.png', 'scripts/social/out/_interior.png']
const a = await renderPromptShowcase({ outPath: 'scripts/social/out/_prompt.png', gridImagePaths: fillers, promptText: 'Cinematic 3:4 dark hero, glowing orange asterisk, lower 45% empty for text, no text', pill: 'prompt', index: 5, total: 7 })
const b = await renderClosing({ outPath: 'scripts/social/out/_closing.png', headline: '¿Te sirvió esto?', ctaLines: ['Guárdalo para tu próxima automatización', 'Coméntame "IA" y te paso el detalle'], handle: '@bralto', index: 7, total: 7 })
console.log([a, b].every(r => r.width === 1080 && r.height === 1440) ? '✓ extras ok' : '✗ dims')
