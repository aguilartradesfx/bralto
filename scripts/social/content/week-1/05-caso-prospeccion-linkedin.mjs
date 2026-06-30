const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '05-caso-prospeccion-linkedin', pillar: 'caso',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing orange network of connected nodes forming a funnel shape'),
      pill: 'caso · resultado', headline: 'Un agente que agenda reuniones en LinkedIn solo', accent: 'solo', subtitle: 'Lo que montamos y qué logró' },
    { type: 'interior', pill: 'el problema', heading: 'Prospectar a mano no escala', headingAccent: 'no escala',
      cards: [{ kind: 'plain', title: 'Antes', body: 'Horas buscando perfiles, escribiendo DMs uno por uno, sin seguimiento.' }] },
    { type: 'interior', pill: 'la solución', heading: 'Pipeline IA de 3 pasos', headingAccent: '3 pasos',
      cards: [{ kind: 'good', title: 'Qué hace', body: 'Filtra perfiles del nicho, redacta mensajes personalizados y agenda en el calendario.' }, { kind: 'plain', title: 'Con control', body: 'Tú apruebas el mensaje base; el agente ejecuta y hace el seguimiento.' }] },
    { type: 'interior', pill: 'resultado', heading: 'Reuniones en automático', headingAccent: 'automático',
      cards: [{ kind: 'good', title: 'El cambio', body: 'De prospección manual a un flujo que corre solo y deja al equipo cerrar, no buscar.' }] },
    { type: 'closing', headline: '¿Quieres algo así en tu agencia?', ctaLines: ['Coméntame "AGENTE" y te cuento cómo', 'Sigue a Bralto para más casos'], handle: '@bralto' },
  ],
}
