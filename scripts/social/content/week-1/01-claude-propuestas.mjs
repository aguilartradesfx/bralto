const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '01-claude-propuestas', pillar: 'herramientas',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing molten-orange document/paper sheet folding into an abstract spark'),
      pill: 'herramientas · IA', headline: 'Escribe propuestas de agencia con Claude en 10 min', accent: '10 min', subtitle: 'El proceso que uso, paso a paso' },
    { type: 'interior', pill: 'paso 1', heading: 'Dale tu contexto, no una orden', headingAccent: 'contexto',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Pega tu oferta, precios y 2 propuestas ganadas. Claude aprende tu voz.' }, { kind: 'bad', title: 'No esto', body: '"Hazme una propuesta para un cliente" sin contexto = texto genérico.' }] },
    { type: 'interior', pill: 'paso 2', heading: 'Pide estructura, luego relleno', headingAccent: 'estructura',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Primero el esqueleto (problema, solución, alcance, precio). Apruebas, y recién ahí redacta.' }, { kind: 'plain', title: 'Por qué', body: 'Corriges el rumbo barato, antes de gastar tokens en prosa.' }] },
    { type: 'interior', pill: 'paso 3', heading: 'Convierte en plantilla reutilizable', headingAccent: 'plantilla',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Guarda el prompt como Skill o snippet. La próxima propuesta sale en 2 min.' }] },
    { type: 'closing', headline: '¿Lo vas a probar?', ctaLines: ['Guárdalo para tu próxima propuesta', 'Coméntame "PROPUESTA" y te paso mi prompt'], handle: '@bralto' },
  ],
}
