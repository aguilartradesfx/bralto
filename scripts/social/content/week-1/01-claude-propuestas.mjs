const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '01-claude-propuestas', pillar: 'herramientas',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing molten-orange document/paper sheet folding into an abstract spark'),
      pill: 'herramientas · IA', headline: 'Escribe propuestas de agencia con Claude en 10 min', accent: '10 min', subtitle: 'El proceso que uso, paso a paso' },

    { type: 'interior', pill: 'paso 1', heading: 'Dale tu contexto, no una orden', headingAccent: 'contexto',
      blocks: [
        { type: 'card', kind: 'good', title: 'Haz esto', body: 'Pégale tu oferta, precios y 2 propuestas ganadas. Ej: para una [CLÍNICA VETERINARIA], súmale su web y su competencia.' },
        { type: 'card', kind: 'bad', title: 'No esto', body: '"Hazme una propuesta para un cliente" — sin contexto sale un texto genérico que no cierra.' },
        { type: 'prompt', text: 'Eres el copywriter de [TU AGENCIA]. Te paso mi oferta, precios y 2 propuestas ganadas. Aprende mi voz. Luego te doy el brief de [CLIENTE], ej: [CLÍNICA VETERINARIA].', note: 'Coméntame "PROPUESTA" y te paso el prompt completo' },
      ] },

    { type: 'interior', pill: 'paso 2', heading: 'Pide estructura, luego relleno', headingAccent: 'estructura',
      blocks: [
        { type: 'card', kind: 'good', title: 'Primero el esqueleto', body: 'Pídele SOLO los bullets: problema, solución, alcance, precio y próximos pasos. Lo apruebas o corriges.' },
        { type: 'card', kind: 'plain', title: 'Luego, la prosa', body: 'Con el esqueleto aprobado, pídele que redacte cada sección con tu tono.' },
        { type: 'card', kind: 'plain', title: 'Por qué funciona', body: 'Corriges el rumbo cuando es barato (5 bullets), no cuando ya escribió 2 páginas.' },
      ] },

    { type: 'interior', pill: 'paso 3', heading: 'Conviértelo en plantilla', headingAccent: 'plantilla',
      blocks: [
        { type: 'card', kind: 'good', title: 'Guárdalo como Skill', body: 'Convierte el prompt final en un Skill de Claude o un snippet. Reutilízalo en cada propuesta nueva.' },
        { type: 'metric', value: '10 min → 2 min', label: 'por propuesta, a partir de la segunda' },
        { type: 'shot', src: 'scripts/social/assets/_placeholder-shot.png', caption: 'Tu Skill guardado en Claude (aquí va tu captura)' },
      ] },

    { type: 'closing', headline: '¿Lo vas a probar?', ctaLines: ['Guárdalo para tu próxima propuesta', 'Coméntame "PROPUESTA" y te paso mi prompt'], handle: '@bralto' },
  ],
}
